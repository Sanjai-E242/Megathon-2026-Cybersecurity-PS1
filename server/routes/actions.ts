import { Router, Request, Response } from 'express';
import { Action, Principal } from '../engine/types.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { store } from '../data/store.js';

export const actionsRouter = Router();
const securityEngine = new SentinelSecurityEngine();

// POST /api/actions - Evaluate and record an action
actionsRouter.post('/', (req: Request, res: Response): void => {
  try {
    const rawAction = req.body as Partial<Action>;

    if (!rawAction.operation || !rawAction.principal_id || !rawAction.scope_required || !rawAction.target) {
      res.status(400).json({
        error: 'Missing required action fields: operation, principal_id, scope_required, target',
      });
      return;
    }

    const action: Action = {
      action_id: rawAction.action_id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: rawAction.session_id || `sess_${Date.now()}`,
      principal_id: rawAction.principal_id,
      timestamp: rawAction.timestamp || new Date().toISOString(),
      resource_type: rawAction.resource_type || 'unknown',
      operation: rawAction.operation,
      scope_required: rawAction.scope_required,
      target: rawAction.target,
      metadata: rawAction.metadata || {},
    };

    // Get principal
    let principal = store.getPrincipal(action.principal_id);
    if (!principal) {
      principal = {
        principal_id: action.principal_id,
        role: 'dynamic_agent',
        authorized_scopes: ['file.read', 'db.read'],
      };
      store.savePrincipal(principal);
    }

    // Get past session history
    const sessionHistory = store.getSessionActions(action.session_id);

    // Evaluate in security engine
    const { decisionResult } = securityEngine.evaluateAction(action, principal, sessionHistory);

    // Persist action, decision, and audit log
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
      },
      decision: decisionResult.decision,
      reason: decisionResult.reason,
      risk_class: decisionResult.risk_class,
      target: action.target,
      operation: action.operation,
      actor: 'SENTINEL_ENGINE',
    });

    res.status(200).json(decisionResult);
  } catch (error: any) {
    console.error('[API_ERROR] Error evaluating action:', error);
    res.status(500).json({
      error: 'Runtime engine error during policy evaluation',
      details: error?.message,
    });
  }
});

// POST /api/decisions/:actionId/approve - Human Approval
actionsRouter.post('/decisions/:actionId/approve', (req: Request, res: Response): void => {
  const actionId = Array.isArray(req.params.actionId) ? req.params.actionId[0] : req.params.actionId;
  const operator = req.body?.operator || 'Security Operations Center (SOC)';

  const decision = store.getDecision(actionId);
  if (!decision) {
    res.status(404).json({ error: `Decision record for action ${actionId} not found` });
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
});

// POST /api/decisions/:actionId/deny - Human Denial
actionsRouter.post('/decisions/:actionId/deny', (req: Request, res: Response): void => {
  const actionId = Array.isArray(req.params.actionId) ? req.params.actionId[0] : req.params.actionId;
  const operator = req.body?.operator || 'Security Operations Center (SOC)';

  const decision = store.getDecision(actionId);
  if (!decision) {
    res.status(404).json({ error: `Decision record for action ${actionId} not found` });
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
});
