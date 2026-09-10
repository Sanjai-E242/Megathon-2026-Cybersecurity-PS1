import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';
import { Principal } from '../engine/types.js';

export const principalsRouter = Router();

// GET /api/principals - List principals and authorized scopes
principalsRouter.get('/', (req: Request, res: Response): void => {
  const principals = store.getAllPrincipals();
  res.status(200).json(principals);
});

// POST /api/principals - Create or update principal
principalsRouter.post('/', (req: Request, res: Response): void => {
  const { principal_id, role, authorized_scopes } = req.body;

  if (!principal_id || !role || !Array.isArray(authorized_scopes)) {
    res.status(400).json({ error: 'principal_id, role, and authorized_scopes array are required' });
    return;
  }

  const principal: Principal = {
    principal_id,
    role,
    authorized_scopes,
    created_at: new Date().toISOString(),
  };

  const saved = store.savePrincipal(principal);
  res.status(201).json(saved);
});
