import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';

export const sessionsRouter = Router();

// GET /api/sessions - List all tracked sessions
sessionsRouter.get('/', (req: Request, res: Response): void => {
  const sessions = store.getAllSessions();
  res.status(200).json(sessions);
});

// GET /api/sessions/:sessionId - Get specific session info
sessionsRouter.get('/:sessionId', (req: Request, res: Response): void => {
  const sessionParam = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = sessionParam || '';
  const session = store.getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: `Session ${sessionId} not found` });
    return;
  }
  res.status(200).json(session);
});

// GET /api/sessions/:sessionId/actions - Get actions and decision history for a session
sessionsRouter.get('/:sessionId/actions', (req: Request, res: Response): void => {
  const sessionParam = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const sessionId = sessionParam || '';
  const actions = store.getSessionActions(sessionId);

  const enrichedActions = actions.map((action) => {
    const decision = store.getDecision(action.action_id);
    return {
      ...action,
      decision: decision?.decision || 'ALLOW',
      reason: decision?.reason || '',
      drift_score: decision?.drift_score || 0.05,
      risk_class: decision?.risk_class || action.risk_class || 'read',
      requires_human_confirm: decision?.requires_human_confirm || false,
      approved_by: decision?.approved_by,
      approved_at: decision?.approved_at,
      execution_latency_ms: decision?.execution_latency_ms || 12,
    };
  });

  res.status(200).json(enrichedActions);
});

// POST /api/sessions/reset - Reset demo state
sessionsRouter.post('/reset', (req: Request, res: Response): void => {
  store.resetDemoState();
  res.status(200).json({ status: 'success', message: 'Demo environment successfully reset.' });
});
