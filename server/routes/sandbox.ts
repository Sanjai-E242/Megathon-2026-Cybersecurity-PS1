import { Router, Request, Response } from 'express';
import { acmeOpsSandbox } from '../sandbox/acmeOps.js';
import { authenticateAgent } from '../middleware/auth.js';
import { validateActionInput } from '../middleware/validation.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { store } from '../data/store.js';
import { Action, Principal } from '../engine/types.js';

export const sandboxRouter = Router();
const securityEngine = new SentinelSecurityEngine();

// GET /api/sandbox/state - Current Acme Operations sandbox state
sandboxRouter.get('/state', (_req: Request, res: Response): void => {
  res.status(200).json(acmeOpsSandbox.getState());
});

// GET /api/sandbox/customers - List simulated customers
sandboxRouter.get('/customers', (_req: Request, res: Response): void => {
  res.status(200).json(acmeOpsSandbox.getCustomers());
});

// GET /api/sandbox/orders - List simulated orders
sandboxRouter.get('/orders', (_req: Request, res: Response): void => {
  res.status(200).json(acmeOpsSandbox.getOrders());
});

// GET /api/sandbox/users - List simulated users
sandboxRouter.get('/users', (_req: Request, res: Response): void => {
  res.status(200).json(acmeOpsSandbox.getUsers());
});

// GET /api/sandbox/tables - List simulated database tables
sandboxRouter.get('/tables', (_req: Request, res: Response): void => {
  res.status(200).json(acmeOpsSandbox.getTables());
});

// POST /api/sandbox/reset - Reset Acme Operations state
sandboxRouter.post('/reset', (_req: Request, res: Response): void => {
  acmeOpsSandbox.resetState();
  res.status(200).json({ status: 'success', message: 'Acme Operations sandbox reset to initial state' });
});

/**
 * POST /api/sandbox/execute - Live Gated Tool Execution on Acme Operations
 * 
 * Demonstrates:
 * 1. Action is evaluated by Sentinel Runtime FIRST
 * 2. If ALLOW -> Protected tool executes in Acme Operations sandbox
 * 3. If CONFIRM -> Tool execution PAUSES awaiting human confirmation token
 * 4. If BLOCK -> Tool is NEVER executed; target resource is 100% untouched
 */
sandboxRouter.post(
  '/execute',
  authenticateAgent,
  validateActionInput,
  (req: Request, res: Response): void => {
    try {
      const rawAction = req.body as Partial<Action>;
      const authenticatedPrincipal = req.authenticatedPrincipal as Principal;

      const actionId = rawAction.action_id || `act_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const sessionId = rawAction.session_id || `sess_sbx_${Date.now()}`;

      const action: Action = {
        action_id: actionId,
        session_id: sessionId,
        principal_id: authenticatedPrincipal.principal_id,
        timestamp: rawAction.timestamp || new Date().toISOString(),
        resource_type: rawAction.resource_type || 'database',
        operation: rawAction.operation!.trim(),
        scope_required: rawAction.scope_required!.trim(),
        target: rawAction.target!.trim(),
        metadata: rawAction.metadata || {},
      };

      // 1. Evaluate with Sentinel Runtime
      const sessionHistory = store.getSessionActions(action.session_id);
      const crossSessionHistory = store.getPrincipalActions(authenticatedPrincipal.principal_id, 30);

      const { decisionResult } = securityEngine.evaluateAction(
        action,
        authenticatedPrincipal,
        sessionHistory,
        crossSessionHistory
      );

      // Persist in Sentinel
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
          sandbox: 'Acme Operations',
        },
        decision: decisionResult.decision,
        reason: decisionResult.reason,
        risk_class: decisionResult.risk_class,
        target: action.target,
        operation: action.operation,
        actor: 'SENTINEL_ENGINE',
      });

      // 2. Gated Execution on Acme Operations Sandbox
      if (decisionResult.decision === 'ALLOW' || decisionResult.decision === 'APPROVED') {
        const toolResult = acmeOpsSandbox.executeTool(action.operation, action.target, action.metadata, {
          action_id: action.action_id,
          session_id: action.session_id,
          principal_id: action.principal_id,
          decision: decisionResult.decision,
        });

        res.status(200).json({
          execution_status: 'EXECUTED',
          sentinel_decision: decisionResult,
          sandbox_output: toolResult.output,
          message: toolResult.message,
        });
        return;
      }

      if (decisionResult.decision === 'CONFIRM') {
        acmeOpsSandbox.logInterceptedAction(
          action,
          'CONFIRM',
          'WAITING_FOR_CONFIRMATION',
          decisionResult.reason
        );

        res.status(200).json({
          execution_status: 'WAITING_FOR_CONFIRMATION',
          sentinel_decision: decisionResult,
          sandbox_output: null,
          message: 'Tool execution paused. Human operator confirmation required.',
        });
        return;
      }

      // BLOCK
      acmeOpsSandbox.logInterceptedAction(
        action,
        'BLOCK',
        'BLOCKED',
        decisionResult.reason
      );

      res.status(200).json({
        execution_status: 'BLOCKED',
        sentinel_decision: decisionResult,
        sandbox_output: null,
        message: 'Action blocked by Sentinel Runtime. Acme Operations sandbox untouched.',
      });
    } catch (error: any) {
      console.error('[SANDBOX_ERROR] Error in sandbox execution:', error?.message || error);
      res.status(500).json({
        error: 'SandboxExecutionError',
        message: 'Internal error executing gated action on sandbox',
      });
    }
  }
);
