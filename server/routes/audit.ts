import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';

export const auditRouter = Router();

// GET /api/audit - Get audit trail with filtering
auditRouter.get('/', (req: Request, res: Response): void => {
  const { session, principal, decision, risk, search } = req.query;

  const logs = store.getAuditLogs({
    sessionId: session as string,
    principalId: principal as string,
    decision: decision as string,
    risk: risk as string,
    search: search as string,
  });

  res.status(200).json(logs);
});

// GET /api/audit/export-csv - Export audit logs as CSV
auditRouter.get('/export-csv', (req: Request, res: Response): void => {
  const logs = store.getAuditLogs();

  const headers = [
    'Timestamp',
    'Log ID',
    'Session ID',
    'Action ID',
    'Principal',
    'Operation',
    'Target',
    'Risk Level',
    'Decision',
    'Reason',
    'Actor',
  ];

  const rows = logs.map((log) => [
    `"${log.timestamp}"`,
    `"${log.id}"`,
    `"${log.session_id}"`,
    `"${log.action_id}"`,
    `"${log.principal_id}"`,
    `"${log.operation || ''}"`,
    `"${log.target || ''}"`,
    `"${log.risk_class || ''}"`,
    `"${log.decision || log.event_type}"`,
    `"${(log.reason || '').replace(/"/g, '""')}"`,
    `"${log.actor}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sentinel_audit_export_${Date.now()}.csv"`);
  res.status(200).send(csvContent);
});
