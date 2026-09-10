import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { store } from '../data/store.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { Action, Principal } from '../engine/types.js';

describe('Sentinel Runtime Security Hardening & Agent Integration Suite', () => {
  beforeEach(() => {
    store.resetDemoState();
  });

  describe('1. API Key Authentication & Middleware Hardening', () => {
    it('TEST 1: rejects request with missing Authorization header (401)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .send({
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toContain('Missing Authorization header');
    });

    it('TEST 2: rejects request with invalid API key (401)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer invalid_secret_key_12345')
        .send({
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toContain('Invalid API key');
    });

    it('TEST 3: rejects request with malformed Bearer token (401)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .send({
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('TEST 4: accepts valid API key and reaches security engine (200)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_auth_test_01',
          resource_type: 'file',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(200);
      expect(res.body.decision).toBe('ALLOW');
      expect(res.body.auth_ok).toBe(true);
      expect(res.body.action_id).toBeDefined();
    });
  });

  describe('2. Principal & Scope Binding Security', () => {
    it('TEST 10: rejects or prevents client from spoofing a different principal ID', async () => {
      // Key is bound to external-agent-01, client tries to impersonate user_42 / sysadmin
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          principal_id: 'user_42', // Spoofing attempt
          session_id: 'sess_spoof_test',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toContain('Principal spoofing attempt detected');
    });

    it('TEST 11: client-supplied authorized_scopes are completely ignored and server-side scopes govern', async () => {
      // external-agent-01 only has ['file.read', 'db.read']. Attempt db.write with injected scopes
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          principal_id: 'external-agent-01',
          authorized_scopes: ['*'], // Injected scope
          session_id: 'sess_scope_spoof',
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'users',
        });

      expect(res.status).toBe(200);
      expect(res.body.auth_ok).toBe(false);
      expect(res.body.decision).toBe('BLOCK');
      expect(res.body.reason).toContain('not authorized');
    });

    it('TEST 5: Valid API key + unauthorized scope results in deterministic BLOCK', async () => {
      // external-agent-01 only has file.read and db.read. Requesting db.write must BLOCK
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_unauth_scope',
          operation: 'update_record',
          scope_required: 'db.write',
          target: 'users',
        });

      expect(res.status).toBe(200);
      expect(res.body.decision).toBe('BLOCK');
      expect(res.body.auth_ok).toBe(false);
      expect(res.body.reason).toContain('Scope \'db.write\' not authorized');
    });

    it('TEST 6: Valid API key + authorized scope results in ALLOW', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_auth_scope',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'notes.txt',
        });

      expect(res.status).toBe(200);
      expect(res.body.decision).toBe('ALLOW');
      expect(res.body.auth_ok).toBe(true);
    });
  });

  describe('3. Input Validation & Attack Vector Defenses', () => {
    it('TEST 12: rejects malformed request missing required fields (400)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          // missing operation, scope_required, target
          session_id: 'sess_invalid',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('TEST 15: rejects oversized metadata payloads (400)', async () => {
      const hugeMetadata: Record<string, string> = {};
      for (let i = 0; i < 60; i++) {
        hugeMetadata[`key_${i}`] = 'x'.repeat(100);
      }

      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'data.json',
          metadata: hugeMetadata,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
      expect(res.body.message).toContain('too many keys');
    });

    it('TEST 16: blocks prototype pollution attack payloads safely (400)', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .set('Content-Type', 'application/json')
        .send('{"operation": "read_file", "scope_required": "file.read", "target": "data.json", "__proto__": {"isAdmin": true}}');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
      expect(res.body.message).toContain('prototype pollution');
    });

    it('TEST 17: classifies unknown operations safely as UNKNOWN risk level', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          operation: 'execute_custom_binary_x99',
          scope_required: 'file.read',
          target: 'binary.bin',
        });

      expect(res.status).toBe(200);
      expect(res.body.risk_class).toBe('unknown');
    });
  });

  describe('4. Idempotency, Trajectory, and Gating Engine', () => {
    it('TEST 13: repeated submissions with identical action_id return idempotent decision without double counting', async () => {
      const actionPayload = {
        action_id: 'act_idempotent_test_99',
        session_id: 'sess_idempotent_01',
        operation: 'read_file',
        scope_required: 'file.read',
        target: 'system.log',
      };

      // 1st submission
      const res1 = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send(actionPayload);

      expect(res1.status).toBe(200);
      expect(res1.body.decision).toBe('ALLOW');

      // 2nd submission with same action_id
      const res2 = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send(actionPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.action_id).toBe('act_idempotent_test_99');
      expect(res2.body.idempotent_replay).toBe(true);

      // Verify actions list in store only stored it once
      const sessionActions = store.getSessionActions('sess_idempotent_01');
      expect(sessionActions.length).toBe(1);
    });

    it('TEST 7 & 8: escalating trajectory correctly increases drift and destructive step triggers BLOCK', async () => {
      const sessionId = 'sess_escalation_qa_01';
      const userKey = 'sentinel_sec_user_key_demo_42';

      const sequence = [
        { op: 'read_file', scope: 'file.read', target: 'config.yaml' },
        { op: 'list_records', scope: 'db.read', target: 'users' },
        { op: 'update_record', scope: 'db.write', target: 'users' },
        { op: 'create_migration', scope: 'db.migrate', target: 'schema' },
        { op: 'update_record', scope: 'db.write', target: 'bulk_users', meta: { row_count_estimate: 500 } },
      ];

      for (const step of sequence) {
        const res = await request(app)
          .post('/api/actions')
          .set('Authorization', `Bearer ${userKey}`)
          .send({
            session_id: sessionId,
            operation: step.op,
            scope_required: step.scope,
            target: step.target,
            metadata: step.meta || {},
          });
        expect(res.status).toBe(200);
      }

      // Step 6: Destructive action in production after high escalation
      const destructiveRes = await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: sessionId,
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'orders_prod',
          metadata: { row_count_estimate: 500000 },
        });

      expect(destructiveRes.status).toBe(200);
      expect(destructiveRes.body.decision).toBe('BLOCK');
      expect(destructiveRes.body.drift_score).toBeGreaterThanOrEqual(0.60);
      expect(destructiveRes.body.risk_class).toBe('destructive');
    });

    it('TEST 9: session actions from different sessions do not cross-contaminate trajectory', async () => {
      const userKey = 'sentinel_sec_user_key_demo_42';

      // Session A performs 3 actions
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/actions')
          .set('Authorization', `Bearer ${userKey}`)
          .send({
            session_id: 'sess_isolated_A',
            operation: 'read_file',
            scope_required: 'file.read',
            target: `file_${i}.txt`,
          });
      }

      // Session B performs a single clean read action
      const resB = await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_isolated_B',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'file_clean.txt',
        });

      expect(resB.status).toBe(200);
      expect(resB.body.drift_score).toBeLessThanOrEqual(0.35);

      const historyA = store.getSessionActions('sess_isolated_A');
      const historyB = store.getSessionActions('sess_isolated_B');
      expect(historyA.length).toBe(3);
      expect(historyB.length).toBe(1);
    });
  });

  describe('5. Human Approval & Denial Endpoints', () => {
    it('allows operator to approve a CONFIRM decision', async () => {
      // Create an action that requires confirmation (e.g. staging deletion with admin)
      const adminKey = 'sentinel_sec_admin_key_demo_01';
      const actionRes = await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${adminKey}`)
        .send({
          action_id: 'act_confirm_approve_test',
          session_id: 'sess_admin_stage',
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'staging_backup_table',
        });

      expect(actionRes.body.decision).toBe('CONFIRM');

      // Operator approves
      const approveRes = await request(app)
        .post('/api/actions/decisions/act_confirm_approve_test/approve')
        .set('X-Operator-Role', 'SOC_ADMIN')
        .send({ operator: 'SOC_Lead_01' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('success');
      expect(approveRes.body.execution_state).toBe('EXECUTED');
      expect(approveRes.body.decision.decision).toBe('APPROVED');
    });

    it('allows operator to deny a CONFIRM decision', async () => {
      const adminKey = 'sentinel_sec_admin_key_demo_01';
      const actionRes = await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${adminKey}`)
        .send({
          action_id: 'act_confirm_deny_test',
          session_id: 'sess_admin_stage_2',
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'staging_backup_table',
        });

      expect(actionRes.body.decision).toBe('CONFIRM');

      // Operator denies
      const denyRes = await request(app)
        .post('/api/actions/decisions/act_confirm_deny_test/deny')
        .set('X-Operator-Role', 'SOC_ADMIN')
        .send({ operator: 'SOC_Lead_01' });

      expect(denyRes.status).toBe(200);
      expect(denyRes.body.status).toBe('denied');
      expect(denyRes.body.execution_state).toBe('BLOCKED');
      expect(denyRes.body.decision.decision).toBe('DENIED');
    });
  });

  describe('6. Zero Secret Leakage & API Response Sanitization', () => {
    it('ensures API key never appears in responses or audit logs', async () => {
      const res = await request(app)
        .post('/api/actions')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_no_leak',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain('sentinel_sec_live_key_demo_99');

      const auditLogs = store.getAuditLogs({ sessionId: 'sess_no_leak' });
      const auditString = JSON.stringify(auditLogs);
      expect(auditString).not.toContain('sentinel_sec_live_key_demo_99');
    });
  });

  describe('7. Cross-Session Trajectory Monitoring (Principal-level)', () => {
    it('elevates drift across multiple sessions for the same principal', async () => {
      const userKey = 'sentinel_sec_user_key_demo_42';

      // Session 1: READ actions
      await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_user42_01',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_user42_01',
          operation: 'list_records',
          scope_required: 'db.read',
          target: 'users',
        });

      // Session 2: WRITE actions for same principal
      await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_user42_02',
          operation: 'update_record',
          scope_required: 'db.write',
          target: 'users',
        });

      await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_user42_02',
          operation: 'create_migration',
          scope_required: 'db.migrate',
          target: 'production_schema',
        });

      // Session 3: High impact write for same principal
      const resSession3 = await request(app)
        .post('/api/actions')
        .set('Authorization', `Bearer ${userKey}`)
        .send({
          session_id: 'sess_user42_03',
          operation: 'update_record',
          scope_required: 'db.write',
          target: 'users_bulk',
          metadata: { row_count_estimate: 500 },
        });

      expect(resSession3.status).toBe(200);
      expect(resSession3.body.cross_session_drift).toBeGreaterThanOrEqual(0.35);
      expect(resSession3.body.factors?.risk_escalation).toBeDefined();
    });
  });

  describe('8. Acme Operations Sandbox Protected Tool Gating', () => {
    it('executes tool in sandbox when Sentinel decision is ALLOW', async () => {
      const res = await request(app)
        .post('/api/sandbox/execute')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_sbx_test_01',
          operation: 'read_file',
          scope_required: 'file.read',
          target: 'config.yaml',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('EXECUTED');
      expect(res.body.sentinel_decision.decision).toBe('ALLOW');
      expect(res.body.sandbox_output).toBeDefined();
    });

    it('blocks tool execution in sandbox and leaves state untouched when decision is BLOCK', async () => {
      // external-agent-01 has no db.write permission. Attempt to drop table
      const res = await request(app)
        .post('/api/sandbox/execute')
        .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
        .send({
          session_id: 'sess_sbx_test_02',
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'orders_prod',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('BLOCKED');
      expect(res.body.sentinel_decision.decision).toBe('BLOCK');
      expect(res.body.sandbox_output).toBeNull();
      expect(res.body.message).toContain('untouched');
    });

    it('pauses tool execution when decision is CONFIRM', async () => {
      const adminKey = 'sentinel_sec_admin_key_demo_01';
      const res = await request(app)
        .post('/api/sandbox/execute')
        .set('Authorization', `Bearer ${adminKey}`)
        .send({
          session_id: 'sess_sbx_test_03',
          operation: 'delete_table',
          scope_required: 'db.write',
          target: 'staging_backup_table',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('WAITING_FOR_CONFIRMATION');
      expect(res.body.sentinel_decision.decision).toBe('CONFIRM');
    });
  });
});
