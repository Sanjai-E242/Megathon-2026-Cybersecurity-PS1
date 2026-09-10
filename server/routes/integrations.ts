import { Router, Request, Response } from 'express';
import { gitHubAdapter } from '../integrations/github.js';
import { authenticateAgent, requireOperatorAuth } from '../middleware/auth.js';
import { validateActionInput } from '../middleware/validation.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { store } from '../data/store.js';
import { Action, Principal } from '../engine/types.js';

export const integrationsRouter = Router();
const securityEngine = new SentinelSecurityEngine();

// GET /api/integrations/github/status - Connection status & repository info
integrationsRouter.get('/github/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await gitHubAdapter.getStatus();
    res.status(200).json(status);
  } catch (error: any) {
    console.error('[GITHUB_STATUS_ERROR]', error?.message || error);
    res.status(500).json({ error: 'StatusCheckFailed', message: 'Failed to retrieve GitHub status' });
  }
});

/**
 * POST /api/integrations/github/action - Propose and evaluate GitHub action through Sentinel
 * 
 * CRITICAL ARCHITECTURAL FLOW:
 * AI AGENT -> GITHUB ACTION ADAPTER -> SENTINEL RUNTIME -> (ALLOW / CONFIRM / BLOCK) -> GITHUB API
 */
integrationsRouter.post(
  '/github/action',
  authenticateAgent,
  validateActionInput,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawAction = req.body as Partial<Action>;
      const authenticatedPrincipal = req.authenticatedPrincipal as Principal;

      const actionId = rawAction.action_id || `act_gh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const sessionId = rawAction.session_id || `sess_gh_${Date.now()}`;

      // 1. Replay / Idempotency Check
      const existingDecision = store.getDecision(actionId);
      if (existingDecision) {
        res.status(200).json({
          execution_status: existingDecision.decision === 'ALLOW' ? 'EXECUTED' : existingDecision.decision === 'CONFIRM' ? 'WAITING_FOR_CONFIRMATION' : 'BLOCKED',
          sentinel_decision: { ...existingDecision, idempotent_replay: true },
          github_output: null,
          message: 'Idempotent action replay detected.',
        });
        return;
      }

      // 2. Authoritative Action Binding
      const action: Action = {
        action_id: actionId,
        session_id: sessionId,
        principal_id: authenticatedPrincipal.principal_id,
        timestamp: rawAction.timestamp || new Date().toISOString(),
        resource_type: rawAction.resource_type || 'github',
        operation: rawAction.operation!.trim(),
        scope_required: rawAction.scope_required!.trim(),
        target: rawAction.target!.trim(),
        metadata: rawAction.metadata || {},
      };

      // 3. Trajectory & Policy Evaluation
      const sessionHistory = store.getSessionActions(action.session_id);
      const crossSessionHistory = store.getPrincipalActions(authenticatedPrincipal.principal_id, 30);

      const { decisionResult } = securityEngine.evaluateAction(
        action,
        authenticatedPrincipal,
        sessionHistory,
        crossSessionHistory
      );

      // Persist in Sentinel Store
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
          external_system: 'github',
          execution_status: decisionResult.decision === 'ALLOW' ? 'executed' : 'not_executed',
        },
        decision: decisionResult.decision,
        reason: decisionResult.reason,
        risk_class: decisionResult.risk_class,
        target: action.target,
        operation: action.operation,
        actor: 'SENTINEL_ENGINE',
      });

      // 4. Execution Gating
      if (decisionResult.decision === 'ALLOW' || decisionResult.decision === 'APPROVED') {
        const toolResult = await gitHubAdapter.executeTool(
          action.operation,
          action.target,
          action.metadata,
          {
            action_id: action.action_id,
            session_id: action.session_id,
            principal_id: action.principal_id,
            decision: decisionResult.decision,
          }
        );

        res.status(200).json({
          execution_status: toolResult.success ? 'EXECUTED' : 'EXECUTION_FAILED',
          sentinel_decision: decisionResult,
          github_output: toolResult.output,
          message: toolResult.message,
        });
        return;
      }

      if (decisionResult.decision === 'CONFIRM') {
        res.status(200).json({
          execution_status: 'WAITING_FOR_CONFIRMATION',
          sentinel_decision: decisionResult,
          github_output: null,
          message: 'Tool execution paused. Human operator confirmation required.',
        });
        return;
      }

      // BLOCK - GitHub API is NEVER CALLED
      res.status(200).json({
        execution_status: 'BLOCKED',
        sentinel_decision: decisionResult,
        github_output: null,
        message: 'Action blocked by Sentinel Runtime. GitHub API request was NOT sent.',
      });
    } catch (error: any) {
      console.error('[GITHUB_ACTION_ERROR] Error evaluating GitHub action:', error?.message || error);
      res.status(500).json({
        error: 'IntegrationActionError',
        message: 'Failed to process GitHub action through Sentinel Runtime.',
      });
    }
  }
);

/**
 * POST /api/integrations/github/approve - Human Operator Approves Pending GitHub Action
 */
integrationsRouter.post(
  '/github/approve',
  requireOperatorAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const actionId = req.body?.action_id;
      const operator = req.body?.operator || 'Security Operations Center (SOC)';

      if (!actionId) {
        res.status(400).json({ error: 'ValidationError', message: 'action_id is required for approval' });
        return;
      }

      const decision = store.getDecision(actionId);
      const action = store.getAction(actionId);

      if (!decision || !action) {
        res.status(404).json({ error: 'NotFound', message: `Pending action ${actionId} not found` });
        return;
      }

      if (decision.decision !== 'CONFIRM') {
        res.status(400).json({
          error: 'InvalidState',
          message: `Action ${actionId} is currently in '${decision.decision}' state and does not require confirmation.`,
        });
        return;
      }

      // Execute on GitHub API upon explicit human sign-off
      const toolResult = await gitHubAdapter.executeTool(
        action.operation,
        action.target,
        action.metadata,
        {
          action_id: action.action_id,
          session_id: action.session_id,
          principal_id: action.principal_id,
          decision: 'APPROVED',
        }
      );

      const updatedDecision = store.updateDecision(actionId, {
        decision: 'APPROVED',
        approved_by: operator,
        approved_at: new Date().toISOString(),
        reason: `Human operator (${operator}) approved GitHub action execution.`,
      });

      store.logAuditEvent({
        session_id: decision.session_id,
        action_id: actionId,
        principal_id: 'soc_operator',
        event_type: 'HUMAN_APPROVAL',
        event_data: {
          action_id: actionId,
          external_system: 'github',
          approved_by: operator,
          execution_status: toolResult.success ? 'executed' : 'execution_failed',
        },
        decision: 'APPROVED',
        reason: `Human operator approved execution of '${action.operation}' on GitHub`,
        risk_class: decision.risk_class,
        actor: operator,
      });

      res.status(200).json({
        status: 'success',
        execution_state: 'EXECUTED',
        decision: updatedDecision,
        github_output: toolResult.output,
        message: toolResult.message,
      });
    } catch (error: any) {
      console.error('[GITHUB_APPROVE_ERROR]', error?.message || error);
      res.status(500).json({ error: 'ApprovalError', message: 'Failed to process GitHub approval' });
    }
  }
);

/**
 * POST /api/integrations/github/reject - Human Operator Denies Pending GitHub Action
 */
integrationsRouter.post(
  '/github/reject',
  requireOperatorAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const actionId = req.body?.action_id;
      const operator = req.body?.operator || 'Security Operations Center (SOC)';

      if (!actionId) {
        res.status(400).json({ error: 'ValidationError', message: 'action_id is required for rejection' });
        return;
      }

      const decision = store.getDecision(actionId);
      const action = store.getAction(actionId);

      if (!decision || !action) {
        res.status(404).json({ error: 'NotFound', message: `Pending action ${actionId} not found` });
        return;
      }

      if (decision.decision !== 'CONFIRM') {
        res.status(400).json({
          error: 'InvalidState',
          message: `Action ${actionId} is currently in '${decision.decision}' state.`,
        });
        return;
      }

      // Reject - GitHub API is NOT CALLED
      const updatedDecision = store.updateDecision(actionId, {
        decision: 'DENIED',
        approved_by: operator,
        approved_at: new Date().toISOString(),
        reason: `Operation rejected by human operator (${operator}). Execution prevented.`,
      });

      store.logAuditEvent({
        session_id: decision.session_id,
        action_id: actionId,
        principal_id: 'soc_operator',
        event_type: 'HUMAN_DENIAL',
        event_data: {
          action_id: actionId,
          external_system: 'github',
          denied_by: operator,
          execution_status: 'not_executed',
        },
        decision: 'DENIED',
        reason: `Human operator rejected execution of '${action.operation}' on GitHub`,
        risk_class: decision.risk_class,
        actor: operator,
      });

      res.status(200).json({
        status: 'denied',
        execution_state: 'BLOCKED',
        decision: updatedDecision,
        github_output: null,
        message: 'Action rejected by operator. GitHub API request was NOT sent.',
      });
    } catch (error: any) {
      console.error('[GITHUB_REJECT_ERROR]', error?.message || error);
      res.status(500).json({ error: 'RejectionError', message: 'Failed to process GitHub rejection' });
    }
  }
);
