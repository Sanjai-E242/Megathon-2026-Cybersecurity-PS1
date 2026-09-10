import { describe, it, expect, beforeEach } from 'vitest';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { AuthorizationEngine } from '../engine/auth.js';
import { RiskClassifier } from '../engine/risk.js';
import { TrajectoryMonitor } from '../engine/trajectory.js';
import { Action, Principal } from '../engine/types.js';

describe('Sentinel Runtime Security Engine', () => {
  let engine: SentinelSecurityEngine;
  let authEngine: AuthorizationEngine;
  let riskClassifier: RiskClassifier;
  let trajectoryMonitor: TrajectoryMonitor;

  beforeEach(() => {
    engine = new SentinelSecurityEngine();
    authEngine = new AuthorizationEngine();
    riskClassifier = new RiskClassifier();
    trajectoryMonitor = new TrajectoryMonitor();
  });

  describe('1. Authorization Engine', () => {
    const user42: Principal = {
      principal_id: 'user_42',
      role: 'sysadmin',
      authorized_scopes: ['db.read', 'db.write', 'db.migrate', 'file.read'],
    };

    const bot: Principal = {
      principal_id: 'agent_support_01',
      role: 'support_bot',
      authorized_scopes: ['db.read', 'file.read'],
    };

    it('allows actions within authorized scopes', () => {
      const action: Action = {
        action_id: 'a1',
        session_id: 's1',
        principal_id: 'user_42',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'list_records',
        scope_required: 'db.read',
        target: 'users',
      };
      const res = authEngine.checkAuth(action, user42);
      expect(res.auth_ok).toBe(true);
    });

    it('blocks actions exceeding authorized scopes', () => {
      const action: Action = {
        action_id: 'a2',
        session_id: 's1',
        principal_id: 'agent_support_01',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'users',
      };
      const res = authEngine.checkAuth(action, bot);
      expect(res.auth_ok).toBe(false);
      expect(res.reason).toContain('not authorized');
    });
  });

  describe('2. Risk Classification & Reversibility Gate', () => {
    it('correctly maps standard operations to risk classes', () => {
      expect(riskClassifier.classifyRisk('read_file')).toBe('read');
      expect(riskClassifier.classifyRisk('list_records')).toBe('read');
      expect(riskClassifier.classifyRisk('update_record')).toBe('write');
      expect(riskClassifier.classifyRisk('delete_table')).toBe('destructive');
      expect(riskClassifier.classifyRisk('drop_database')).toBe('destructive');
      expect(riskClassifier.classifyRisk('custom_unrecognized_op')).toBe('unknown');
    });

    it('requires confirmation for destructive actions', () => {
      const action: Action = {
        action_id: 'a1',
        session_id: 's1',
        principal_id: 'user_42',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'orders',
      };
      const gate = riskClassifier.evaluateGate(action, 'destructive');
      expect(gate.requires_confirm).toBe(true);
    });
  });

  describe('3. Scenario A — Escalation Attack Simulation', () => {
    const user42: Principal = {
      principal_id: 'user_42',
      role: 'sysadmin',
      authorized_scopes: ['db.read', 'db.write', 'db.migrate', 'file.read'],
    };

    it('evaluates Scenario A step-by-step and BLOCKS final destructive step', () => {
      const sessionHistory: Action[] = [];
      const sessionId = 'attack-escalation-test';

      // Step 1: read_file -> ALLOW
      const step1: Action = {
        action_id: 'a1',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        resource_type: 'file',
        operation: 'read_file',
        scope_required: 'file.read',
        target: 'config.yaml',
      };
      const r1 = engine.evaluateAction(step1, user42, sessionHistory);
      expect(r1.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(step1);

      // Step 2: list_records -> ALLOW
      const step2: Action = {
        action_id: 'a2',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date(Date.now() - 4000).toISOString(),
        resource_type: 'database',
        operation: 'list_records',
        scope_required: 'db.read',
        target: 'users',
      };
      const r2 = engine.evaluateAction(step2, user42, sessionHistory);
      expect(r2.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(step2);

      // Step 3: update_record -> ALLOW
      const step3: Action = {
        action_id: 'a3',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date(Date.now() - 3000).toISOString(),
        resource_type: 'database',
        operation: 'update_record',
        scope_required: 'db.write',
        target: 'users',
      };
      const r3 = engine.evaluateAction(step3, user42, sessionHistory);
      expect(r3.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(step3);

      // Step 4: create_migration -> CONFIRM
      const step4: Action = {
        action_id: 'a4',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        resource_type: 'database',
        operation: 'create_migration',
        scope_required: 'db.migrate',
        target: 'production_schema',
      };
      const r4 = engine.evaluateAction(step4, user42, sessionHistory);
      expect(['ALLOW', 'CONFIRM']).toContain(r4.decisionResult.decision);
      sessionHistory.push(step4);

      // Step 5: bulk update -> CONFIRM
      const step5: Action = {
        action_id: 'a5',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        resource_type: 'database',
        operation: 'update_record',
        scope_required: 'db.write',
        target: 'users_bulk',
        metadata: { row_count_estimate: 500 },
      };
      const r5 = engine.evaluateAction(step5, user42, sessionHistory);
      expect(r5.decisionResult.decision).toBe('CONFIRM');
      sessionHistory.push(step5);

      // Step 6: delete_table orders_prod -> BLOCK
      const step6: Action = {
        action_id: 'a6',
        session_id: sessionId,
        principal_id: 'user_42',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'orders_prod',
        metadata: { row_count_estimate: 500000 },
      };
      const r6 = engine.evaluateAction(step6, user42, sessionHistory);
      expect(r6.decisionResult.decision).toBe('BLOCK');
      expect(r6.decisionResult.drift_score).toBeGreaterThan(0.60);
      expect(r6.decisionResult.reason).toContain('trajectory');
    });
  });

  describe('4. Scenario B — Legitimate Admin Work', () => {
    const adminMigration: Principal = {
      principal_id: 'admin_migration_01',
      role: 'migration_admin',
      authorized_scopes: ['db.read', 'db.write', 'db.migrate', 'file.read'],
    };

    it('evaluates Scenario B and requires human confirmation for staging cleanup', () => {
      const sessionHistory: Action[] = [];
      const sessionId = 'legitimate-migration-test';

      // Step 1: read migration plan -> ALLOW
      const s1: Action = {
        action_id: 'b1',
        session_id: sessionId,
        principal_id: 'admin_migration_01',
        timestamp: new Date(Date.now() - 4000).toISOString(),
        resource_type: 'file',
        operation: 'read_migration_plan',
        scope_required: 'file.read',
        target: 'migration_plan.md',
      };
      const r1 = engine.evaluateAction(s1, adminMigration, sessionHistory);
      expect(r1.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(s1);

      // Step 2: create migration on staging -> ALLOW
      const s2: Action = {
        action_id: 'b2',
        session_id: sessionId,
        principal_id: 'admin_migration_01',
        timestamp: new Date(Date.now() - 3000).toISOString(),
        resource_type: 'database',
        operation: 'create_migration',
        scope_required: 'db.migrate',
        target: 'staging_schema',
      };
      const r2 = engine.evaluateAction(s2, adminMigration, sessionHistory);
      expect(r2.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(s2);

      // Step 3: bulk update staging -> ALLOW
      const s3: Action = {
        action_id: 'b3',
        session_id: sessionId,
        principal_id: 'admin_migration_01',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        resource_type: 'database',
        operation: 'update_record',
        scope_required: 'db.write',
        target: 'staging_users',
      };
      const r3 = engine.evaluateAction(s3, adminMigration, sessionHistory);
      expect(r3.decisionResult.decision).toBe('ALLOW');
      sessionHistory.push(s3);

      // Step 4: delete staging backup table -> CONFIRM (requires human sign-off)
      const s4: Action = {
        action_id: 'b4',
        session_id: sessionId,
        principal_id: 'admin_migration_01',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'staging_backup_table',
      };
      const r4 = engine.evaluateAction(s4, adminMigration, sessionHistory);
      expect(r4.decisionResult.decision).toBe('CONFIRM');
      expect(r4.decisionResult.requires_human_confirm).toBe(true);
    });
  });
});
