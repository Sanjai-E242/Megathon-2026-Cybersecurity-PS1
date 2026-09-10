import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SentinelClient, ExternalAgentAction } from '../../external-agent/sentinelClient.js';
import { ProtectedToolExecutor } from '../../external-agent/protectedTool.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { Principal } from '../engine/types.js';

describe('External Agent Integration & Gated Execution', () => {
  let securityEngine: SentinelSecurityEngine;
  let mockClient: SentinelClient;
  let executor: ProtectedToolExecutor;

  const adminPrincipal: Principal = {
    principal_id: 'admin_migration_01',
    role: 'migration_admin',
    authorized_scopes: ['file.read', 'db.read', 'db.write', 'db.migrate'],
  };

  const userPrincipal: Principal = {
    principal_id: 'user_42',
    role: 'sysadmin',
    authorized_scopes: ['file.read', 'db.read', 'db.write', 'db.migrate'],
  };

  beforeEach(() => {
    securityEngine = new SentinelSecurityEngine();
    mockClient = new SentinelClient({ baseUrl: 'http://localhost:3001' });
    executor = new ProtectedToolExecutor(mockClient);
  });

  describe('1. Protected Tool Gating Contract', () => {
    it('executes tool ONLY when Sentinel permits ALLOW', async () => {
      const toolMock = vi.fn().mockResolvedValue({ executed: true, rows: 10 });

      // Mock checkWithSentinel to return ALLOW
      vi.spyOn(mockClient, 'checkWithSentinel').mockResolvedValueOnce({
        action_id: 'act_test_01',
        session_id: 'sess_test_01',
        decision: 'ALLOW',
        reason: 'Within normal runtime policy',
        risk_class: 'read',
        auth_ok: true,
        drift_score: 0.1,
        requires_human_confirm: false,
      });

      const action: ExternalAgentAction = {
        session_id: 'sess_test_01',
        principal_id: 'admin_migration_01',
        resource_type: 'file',
        operation: 'read_migration_plan',
        scope_required: 'file.read',
        target: 'migration_plan.md',
      };

      const result = await executor.executeProtectedTool(action, toolMock);

      expect(mockClient.checkWithSentinel).toHaveBeenCalledTimes(1);
      expect(toolMock).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('EXECUTED');
    });

    it('pauses execution and DOES NOT run tool when Sentinel returns CONFIRM', async () => {
      const toolMock = vi.fn().mockResolvedValue({ executed: true });

      vi.spyOn(mockClient, 'checkWithSentinel').mockResolvedValueOnce({
        action_id: 'act_test_02',
        session_id: 'sess_test_02',
        decision: 'CONFIRM',
        reason: 'Destructive action requires human confirmation',
        risk_class: 'destructive',
        auth_ok: true,
        drift_score: 0.65,
        requires_human_confirm: true,
      });

      const action: ExternalAgentAction = {
        session_id: 'sess_test_02',
        principal_id: 'admin_migration_01',
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'staging_backup_table',
      };

      const result = await executor.executeProtectedTool(action, toolMock);

      expect(mockClient.checkWithSentinel).toHaveBeenCalledTimes(1);
      expect(toolMock).not.toHaveBeenCalled();
      expect(result.status).toBe('PENDING_CONFIRMATION');
    });

    it('blocks execution and NEVER calls tool when Sentinel returns BLOCK', async () => {
      const toolMock = vi.fn().mockResolvedValue({ executed: true });

      vi.spyOn(mockClient, 'checkWithSentinel').mockResolvedValueOnce({
        action_id: 'act_test_03',
        session_id: 'sess_test_03',
        decision: 'BLOCK',
        reason: 'Destructive action detected after significant trajectory escalation',
        risk_class: 'destructive',
        auth_ok: true,
        drift_score: 0.88,
        requires_human_confirm: false,
      });

      const action: ExternalAgentAction = {
        session_id: 'sess_test_03',
        principal_id: 'user_42',
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'orders_prod',
      };

      const result = await executor.executeProtectedTool(action, toolMock);

      expect(mockClient.checkWithSentinel).toHaveBeenCalledTimes(1);
      expect(toolMock).not.toHaveBeenCalled();
      expect(result.status).toBe('BLOCKED');
    });
  });

  describe('2. Scenario Integration with Core Security Engine', () => {
    it('evaluates full external attack scenario and triggers BLOCK on step 6', () => {
      const sessionActions = [
        { operation: 'read_file', target: 'config.yaml', scope: 'file.read' },
        { operation: 'list_records', target: 'users', scope: 'db.read' },
        { operation: 'update_record', target: 'users', scope: 'db.write' },
        { operation: 'create_migration', target: 'production_schema', scope: 'db.migrate' },
        { operation: 'update_record', target: 'users_bulk', scope: 'db.write', metadata: { row_count_estimate: 500 } },
      ];

      const history: any[] = [];
      for (const step of sessionActions) {
        const act: any = {
          action_id: `ext_act_${history.length}`,
          session_id: 'sess_external_attack_test',
          principal_id: 'user_42',
          timestamp: new Date().toISOString(),
          resource_type: 'database',
          operation: step.operation,
          scope_required: step.scope,
          target: step.target,
          metadata: step.metadata || {},
        };
        const { decisionResult } = securityEngine.evaluateAction(act, userPrincipal, history);
        history.push({ ...act, decision: decisionResult.decision });
      }

      // Step 6: Destructive action
      const dropAction: any = {
        action_id: 'ext_act_drop',
        session_id: 'sess_external_attack_test',
        principal_id: 'user_42',
        timestamp: new Date().toISOString(),
        resource_type: 'database',
        operation: 'delete_table',
        scope_required: 'db.write',
        target: 'orders_prod',
        metadata: { row_count_estimate: 500000 },
      };

      const { decisionResult: finalDecision } = securityEngine.evaluateAction(dropAction, userPrincipal, history);
      expect(finalDecision.decision).toBe('BLOCK');
      expect(finalDecision.drift_score).toBeGreaterThanOrEqual(0.75);
    });
  });
});
