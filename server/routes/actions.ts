import { Router, Request, Response } from 'express';
import { Action, Principal } from '../engine/types.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { store } from '../data/store.js';
import { authenticateAgent, requireOperatorAuth } from '../middleware/auth.js';
import { validateActionInput } from '../middleware/validation.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

export const actionsRouter = Router();
const securityEngine = new SentinelSecurityEngine();
const actionsRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 120 });

// POST /api/actions - Evaluate and record an action
actionsRouter.post(
  '/',
  actionsRateLimiter,
  authenticateAgent,
  validateActionInput,
  (req: Request, res: Response): void => {
    try {
      const rawAction = req.body as Partial<Action>;
      const authenticatedPrincipal = req.authenticatedPrincipal as Principal;

      const actionId = rawAction.action_id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const sessionId = rawAction.session_id || `sess_${Date.now()}`;

      // 1. Replay / Idempotency Check:
      // If action_id already exists in store, return the existing evaluated decision without polluting trajectory
      const existingDecision = store.getDecision(actionId);
      if (existingDecision) {
        res.status(200).json({
          ...existingDecision,
          idempotent_replay: true,
        });
        return;
      }

      // 2. Bind action strictly to authenticated principal
      // The server dictates the principal and its scopes — client cannot spoof or elevate
      const action: Action = {
        action_id: actionId,
        session_id: sessionId,
        principal_id: authenticatedPrincipal.principal_id,
        timestamp: rawAction.timestamp || new Date().toISOString(),
        resource_type: rawAction.resource_type || 'unknown',
        operation: rawAction.operation!.trim(),
        scope_required: rawAction.scope_required!.trim(),
        target: rawAction.target!.trim(),
        metadata: rawAction.metadata || {},
      };

      // 3. Fetch past session and cross-session history for trajectory analysis
      const sessionHistory = store.getSessionActions(action.session_id);
      const crossSessionHistory = store.getPrincipalActions(authenticatedPrincipal.principal_id, 30);

      // 4. Evaluate action with deterministic security engine
      const { decisionResult } = securityEngine.evaluateAction(
        action,
        authenticatedPrincipal,
        sessionHistory,
        crossSessionHistory
      );

      // 5. Persist action, decision, and audit log
      store.saveAction(action);
      store.saveDecision(decisionResult);

      store.logAuditEvent({
        session_id: action.session_id,
        action_id: action.action_id,
        principal_id: action.principal_id,
        event_type: decisionResult.decision,
        event_data: {
          operation: action.operation,
          target: action.target,
          scope_required: action.scope_required,
          risk_class: decisionResult.risk_class,
          drift_score: decisionResult.drift_score,
          current_session_drift: decisionResult.current_session_drift,
          cross_session_drift: decisionResult.cross_session_drift,
        },
        decision: decisionResult.decision,
        reason: decisionResult.reason,
        risk_class: decisionResult.risk_class,
        target: action.target,
        operation: action.operation,
        actor: 'SENTINEL_ENGINE',
      });

      // 6. Return standard structured decision (Zero secrets or internal paths leaked)
      res.status(200).json({
        action_id: decisionResult.action_id,
        session_id: decisionResult.session_id,
        decision: decisionResult.decision,
        reason: decisionResult.reason,
        risk_class: decisionResult.risk_class,
        auth_ok: decisionResult.auth_ok,
        drift_score: decisionResult.drift_score,
        current_session_drift: decisionResult.current_session_drift,
        cross_session_drift: decisionResult.cross_session_drift,
        factors: decisionResult.factors,
        explanation: decisionResult.explanation,
        requires_human_confirm: decisionResult.requires_human_confirm,
        created_at: decisionResult.created_at,
        execution_latency_ms: decisionResult.execution_latency_ms,
      });
    } catch (error: any) {
      console.error('[API_ERROR] Error evaluating action:', error?.message || error);
      res.status(500).json({
        error: 'Runtime engine error during policy evaluation',
        message: 'An internal error occurred while processing the security decision.',
      });
    }
  }
);

// POST /api/actions/decisions/:actionId/approve - Human Approval
actionsRouter.post(
  '/decisions/:actionId/approve',
  requireOperatorAuth,
  (req: Request, res: Response): void => {
    try {
      const actionId = Array.isArray(req.params.actionId) ? req.params.actionId[0] : req.params.actionId;
      const operator = req.body?.operator || 'Security Operations Center (SOC)';

      if (!actionId) {
        res.status(400).json({ error: 'ValidationError', message: 'Action ID is required' });
        return;
      }

      const decision = store.getDecision(actionId);
      if (!decision) {
        res.status(404).json({ error: 'NotFound', message: `Decision record for action ${actionId} not found` });
        return;
      }

      if (decision.decision !== 'CONFIRM') {
        res.status(400).json({
          error: 'InvalidState',
          message: `Action ${actionId} is in '${decision.decision}' state and does not require human approval`,
        });
        return;
      }

      const updatedDecision = store.updateDecision(actionId, {
        decision: 'APPROVED',
        approved_by: operator,
        approved_at: new Date().toISOString(),
        reason: `Human authorization granted by ${operator}. Operation sanctioned for execution.`,
      });

      // Add audit trail for human confirmation
      store.logAuditEvent({
        session_id: decision.session_id,
        action_id: actionId,
        principal_id: 'soc_operator',
        event_type: 'HUMAN_APPROVAL',
        event_data: {
          action_id: actionId,
          original_decision: 'CONFIRM',
          approved_by: operator,
          status: 'EXECUTED',
        },
        decision: 'APPROVED',
        reason: `Human operator (${operator}) approved action execution`,
        risk_class: decision.risk_class,
        actor: operator,
      });

      res.status(200).json({
        status: 'success',
        decision: updatedDecision,
        execution_state: 'EXECUTED',
      });
    } catch (error: any) {
      console.error('[API_ERROR] Error in approval:', error?.message || error);
      res.status(500).json({ error: 'InternalError', message: 'Failed to process approval' });
    }
  }
);

// POST /api/actions/decisions/:actionId/deny - Human Denial
actionsRouter.post(
  '/decisions/:actionId/deny',
  requireOperatorAuth,
  (req: Request, res: Response): void => {
    try {
      const actionId = Array.isArray(req.params.actionId) ? req.params.actionId[0] : req.params.actionId;
      const operator = req.body?.operator || 'Security Operations Center (SOC)';

      if (!actionId) {
        res.status(400).json({ error: 'ValidationError', message: 'Action ID is required' });
        return;
      }

      const decision = store.getDecision(actionId);
      if (!decision) {
        res.status(404).json({ error: 'NotFound', message: `Decision record for action ${actionId} not found` });
        return;
      }

      if (decision.decision !== 'CONFIRM') {
        res.status(400).json({
          error: 'InvalidState',
          message: `Action ${actionId} is in '${decision.decision}' state and does not require human confirmation`,
        });
        return;
      }

      const updatedDecision = store.updateDecision(actionId, {
        decision: 'DENIED',
        approved_by: operator,
        approved_at: new Date().toISOString(),
        reason: `Operation rejected by human operator (${operator}). Execution prevented.`,
      });

      // Add audit trail for denial
      store.logAuditEvent({
        session_id: decision.session_id,
        action_id: actionId,
        principal_id: 'soc_operator',
        event_type: 'HUMAN_DENIAL',
        event_data: {
          action_id: actionId,
          original_decision: 'CONFIRM',
          denied_by: operator,
          status: 'BLOCKED',
        },
        decision: 'DENIED',
        reason: `Human operator (${operator}) denied action execution`,
        risk_class: decision.risk_class,
        actor: operator,
      });

      res.status(200).json({
        status: 'denied',
        decision: updatedDecision,
        execution_state: 'BLOCKED',
      });
    } catch (error: any) {
      console.error('[API_ERROR] Error in denial:', error?.message || error);
      res.status(500).json({ error: 'InternalError', message: 'Failed to process denial' });
    }
  }
);
