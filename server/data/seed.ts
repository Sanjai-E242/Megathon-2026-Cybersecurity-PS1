import { Principal, PolicyRule, AuditLogEntry } from '../engine/types.js';
import { DEFAULT_RISK_TABLE } from '../engine/risk.js';

export const SEED_PRINCIPALS: Principal[] = [
  {
    principal_id: 'user_42',
    role: 'sysadmin',
    authorized_scopes: ['db.read', 'db.write', 'db.migrate', 'file.read', 'repo.read', 'repo.write'],
    created_at: new Date('2026-03-01T10:00:00Z').toISOString(),
  },
  {
    principal_id: 'admin_migration_01',
    role: 'migration_admin',
    authorized_scopes: ['db.read', 'db.write', 'db.migrate', 'file.read', 'repo.read', 'repo.write'],
    created_at: new Date('2026-03-02T11:00:00Z').toISOString(),
  },
  {
    principal_id: 'agent_support_01',
    role: 'support_bot',
    authorized_scopes: ['db.read', 'file.read'],
    created_at: new Date('2026-03-03T09:30:00Z').toISOString(),
  },
  {
    principal_id: 'agent_billing_service',
    role: 'billing_automation',
    authorized_scopes: ['db.read', 'db.write'],
    created_at: new Date('2026-03-04T08:15:00Z').toISOString(),
  },
  {
    principal_id: 'external-agent-01',
    role: 'dynamic_agent',
    authorized_scopes: ['file.read', 'db.read', 'repo.read', 'repo.write'],
    created_at: new Date('2026-03-05T08:00:00Z').toISOString(),
  },
  {
    principal_id: 'github_agent_01',
    role: 'github_integration_bot',
    authorized_scopes: ['repo.read', 'repo.write'],
    created_at: new Date('2026-03-06T08:00:00Z').toISOString(),
  },
];

export const SEED_POLICIES: PolicyRule[] = Object.entries(DEFAULT_RISK_TABLE).map(([operation, risk_level]) => ({
  operation,
  risk_level,
  description: `Standard runtime classification for ${operation}`,
  updated_at: new Date('2026-03-10T00:00:00Z').toISOString(),
}));

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_init_01',
    session_id: 'sess_baseline_00',
    action_id: 'act_init_01',
    principal_id: 'agent_support_01',
    event_type: 'ALLOW',
    event_data: { operation: 'read_file', target: 'faq_catalog.json' },
    decision: 'ALLOW',
    reason: 'Within normal runtime policy and authorized scope limits',
    risk_class: 'read',
    target: 'faq_catalog.json',
    operation: 'read_file',
    actor: 'SENTINEL_ENGINE',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'aud_init_02',
    session_id: 'sess_baseline_00',
    action_id: 'act_init_02',
    principal_id: 'agent_support_01',
    event_type: 'BLOCK',
    event_data: { operation: 'drop_database', target: 'customers_prod' },
    decision: 'BLOCK',
    reason: "Scope 'db.write' not authorized for principal 'agent_support_01'",
    risk_class: 'destructive',
    target: 'customers_prod',
    operation: 'drop_database',
    actor: 'SENTINEL_ENGINE',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];
