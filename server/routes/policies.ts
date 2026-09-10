import { Router, Request, Response } from 'express';
import { RiskLevel } from '../engine/types.js';
import { store } from '../data/store.js';

export const policiesRouter = Router();

// GET /api/policies - List all configured operation policies
policiesRouter.get('/', (req: Request, res: Response): void => {
  const policies = store.getPolicies();
  res.status(200).json(policies);
});

// PUT /api/policies/:operation - Create or update a policy rule
policiesRouter.put('/:operation', (req: Request, res: Response): void => {
  const opParam = Array.isArray(req.params.operation) ? req.params.operation[0] : req.params.operation;
  const operation = (opParam || '').toLowerCase().trim();
  const { risk_level, description } = req.body;

  if (!risk_level || !['read', 'write', 'destructive', 'unknown'].includes(risk_level)) {
    res.status(400).json({ error: 'Valid risk_level (read, write, destructive, unknown) is required' });
    return;
  }

  const updated = store.setPolicy({
    operation,
    risk_level: risk_level as RiskLevel,
    description: description || `Custom runtime policy for ${operation}`,
  });

  store.logAuditEvent({
    session_id: 'policy_config',
    action_id: `pol_${operation}`,
    principal_id: 'secops_admin',
    event_type: 'POLICY_UPDATE',
    event_data: { operation, risk_level },
    decision: 'ALLOW',
    reason: `Updated policy for ${operation} to ${risk_level}`,
    actor: 'SECOPS_ADMIN',
  });

  res.status(200).json({
    message: 'Policy updated successfully',
    policy: updated,
  });
});

// DELETE /api/policies/:operation - Delete a policy rule
policiesRouter.delete('/:operation', (req: Request, res: Response): void => {
  const opParam = Array.isArray(req.params.operation) ? req.params.operation[0] : req.params.operation;
  const operation = (opParam || '').toLowerCase().trim();
  const success = store.deletePolicy(operation);

  if (!success) {
    res.status(404).json({ error: `Policy for ${operation} not found` });
    return;
  }

  res.status(200).json({ message: `Policy for ${operation} removed successfully` });
});
