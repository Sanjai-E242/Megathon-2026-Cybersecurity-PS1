import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { store } from '../data/store.js';
import { RiskClassifier } from '../engine/risk.js';
import { gitHubAdapter } from '../integrations/github.js';

describe('Sentinel Runtime — GitHub External Integration Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    store.resetDemoState();
    vi.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
  });

  // =========================================================================
  // 1. RISK & CLASSIFICATION MAPPING
  // =========================================================================
  describe('1. Risk & Policy Classification for GitHub Operations', () => {
    const classifier = new RiskClassifier();

    it('classifies get_repository as read', () => {
      expect(classifier.classifyRisk('get_repository')).toBe('read');
    });

    it('classifies list_issues as read', () => {
      expect(classifier.classifyRisk('list_issues')).toBe('read');
    });

    it('classifies create_issue as write', () => {
      expect(classifier.classifyRisk('create_issue')).toBe('write');
    });

    it('classifies add_comment as write', () => {
      expect(classifier.classifyRisk('add_comment')).toBe('write');
    });

    it('classifies delete_repository as destructive', () => {
      expect(classifier.classifyRisk('delete_repository')).toBe('destructive');
    });

    it('evaluates gate requirement for destructive actions', () => {
      const gate = classifier.evaluateGate(
        {
          action_id: 'a1',
          session_id: 's1',
          principal_id: 'p1',
          timestamp: new Date().toISOString(),
          resource_type: 'github',
          operation: 'delete_repository',
          scope_required: 'repo.admin',
          target: 'owner/repo',
        },
        'destructive'
      );
      expect(gate.requires_confirm).toBe(true);
    });
  });

  // =========================================================================
  // 2. GITHUB ADAPTER UNIT TESTS
  // =========================================================================
  describe('2. GitHub Integration Adapter Safety and Gating', () => {
    it('returns status without crashing when GITHUB_TOKEN is not configured', async () => {
      const status = await gitHubAdapter.getStatus();
      expect(status).toHaveProperty('id', 'github');
      expect(status).toHaveProperty('name', 'GitHub REST API');
      expect(status.connected).toBe(false);
      expect(status.targetInfo).toHaveProperty('owner');
      expect(status.targetInfo).toHaveProperty('repo');
    });

    it('strictly forbids delete_repository simulation from executing on GitHub API', async () => {
      const result = await gitHubAdapter.executeTool('delete_repository', 'owner/repo');
      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
      expect(result.message).toContain('strictly forbidden');
      expect(result.output.simulated_block).toBe(true);
    });

    it('rejects unknown GitHub tools cleanly', async () => {
      const result = await gitHubAdapter.executeTool('unsupported_action', 'owner/repo');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe('UnsupportedTool');
    });

    it('executes get_repository in local demo fallback when no token is present', async () => {
      const result = await gitHubAdapter.executeTool('get_repository', 'Sanjai-E242/sentinel-runtime');
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.output).toHaveProperty('full_name');
    });

    it('executes create_issue in local demo fallback when no token is present', async () => {
      const result = await gitHubAdapter.executeTool('create_issue', 'Sanjai-E242/sentinel-runtime', {
        title: 'Test Issue',
        body: 'Test Body',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.output).toHaveProperty('title', 'Test Issue');
    });

    it('executes real GitHub fetch when token is configured and handles HTTP errors safely', async () => {
      process.env.GITHUB_TOKEN = 'ghp_mocktoken1234567890abcdef';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found', documentation_url: 'https://docs.github.com' }),
      });
      global.fetch = mockFetch as any;

      const result = await gitHubAdapter.executeTool('get_repository', 'nonexistent/repo');
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toContain('Not Found');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. SENTINEL GATED GITHUB API ENDPOINTS
  // =========================================================================
  describe('3. Sentinel Protected Gating for GitHub Actions', () => {
    it('GET /api/integrations/github/status returns status safely', async () => {
      const res = await request(app).get('/api/integrations/github/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'github');
      expect(res.body).toHaveProperty('name', 'GitHub REST API');
    });

    it('ALLOW: executes tool when action is authorized and within normal drift', async () => {
      const res = await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_admin_key_demo_01')
        .send({
          action_id: 'act_gh_read_01',
          session_id: 'sess_gh_test_01',
          principal_id: 'admin_migration_01',
          resource_type: 'github',
          operation: 'get_repository',
          scope_required: 'repo.read',
          target: 'Sanjai-E242/sentinel-runtime',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('EXECUTED');
      expect(res.body.sentinel_decision.decision).toBe('ALLOW');
      expect(res.body.github_output).not.toBeNull();
    });

    it('BLOCK: blocks tool execution when principal lacks authorized scope', async () => {
      const res = await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_support_key_01') // support_bot lacks repo.write
        .send({
          action_id: 'act_gh_write_unauth',
          session_id: 'sess_gh_test_unauth',
          principal_id: 'agent_support_01',
          resource_type: 'github',
          operation: 'create_issue',
          scope_required: 'repo.write',
          target: 'Sanjai-E242/sentinel-runtime',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('BLOCKED');
      expect(res.body.sentinel_decision.decision).toBe('BLOCK');
      expect(res.body.github_output).toBeNull();
      expect(res.body.message).toContain('GitHub API request was NOT sent');
    });

    it('BLOCK: strictly blocks delete_repository and NEVER calls GitHub API', async () => {
      const res = await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_user_key_demo_42')
        .send({
          action_id: 'act_gh_delete_exploit',
          session_id: 'sess_gh_attack_01',
          principal_id: 'user_42',
          resource_type: 'github',
          operation: 'delete_repository',
          scope_required: 'repo.admin', // user_42 lacks repo.admin
          target: 'Sanjai-E242/sentinel-runtime',
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('BLOCKED');
      expect(res.body.sentinel_decision.decision).toBe('BLOCK');
      expect(res.body.github_output).toBeNull();
      expect(res.body.message).toContain('NOT sent');
    });

    it('CONFIRM: pauses execution when action requires human confirmation', async () => {
      // Propose multiple writes to elevate drift score
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/integrations/github/action')
          .set('Authorization', 'Bearer sentinel_sec_user_key_demo_42')
          .send({
            action_id: `act_gh_elevate_${i}`,
            session_id: 'sess_gh_confirm_flow',
            principal_id: 'user_42',
            resource_type: 'github',
            operation: 'create_issue',
            scope_required: 'repo.write',
            target: 'Sanjai-E242/sentinel-runtime',
          });
      }

      // Propose high volume action triggering confirmation
      const res = await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_user_key_demo_42')
        .send({
          action_id: 'act_gh_confirm_pending',
          session_id: 'sess_gh_confirm_flow',
          principal_id: 'user_42',
          resource_type: 'github',
          operation: 'add_comment',
          scope_required: 'repo.write',
          target: 'Sanjai-E242/sentinel-runtime',
          metadata: { row_count_estimate: 500 },
        });

      expect(res.status).toBe(200);
      expect(res.body.execution_status).toBe('WAITING_FOR_CONFIRMATION');
      expect(res.body.sentinel_decision.decision).toBe('CONFIRM');
      expect(res.body.github_output).toBeNull();
    });

    it('APPROVE: operator approval executes pending GitHub tool', async () => {
      // Setup pending action
      await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_admin_key_demo_01')
        .send({
          action_id: 'act_gh_to_approve',
          session_id: 'sess_gh_approval_test',
          principal_id: 'admin_migration_01',
          resource_type: 'github',
          operation: 'add_comment',
          scope_required: 'repo.write',
          target: 'Sanjai-E242/sentinel-runtime',
        });

      // Update decision in store to simulate CONFIRM state
      store.updateDecision('act_gh_to_approve', {
        decision: 'CONFIRM',
        requires_human_confirm: true,
      });

      const approveRes = await request(app)
        .post('/api/integrations/github/approve')
        .set('X-Operator-Role', 'SOC_ADMIN')
        .send({
          action_id: 'act_gh_to_approve',
          operator: 'SOC_ADMIN_SANJAI',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('success');
      expect(approveRes.body.execution_state).toBe('EXECUTED');
      expect(approveRes.body.decision.decision).toBe('APPROVED');
      expect(approveRes.body.github_output).not.toBeNull();
    });

    it('REJECT: operator rejection denies pending GitHub tool without calling API', async () => {
      // Setup pending action
      await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_admin_key_demo_01')
        .send({
          action_id: 'act_gh_to_reject',
          session_id: 'sess_gh_reject_test',
          principal_id: 'admin_migration_01',
          resource_type: 'github',
          operation: 'add_comment',
          scope_required: 'repo.write',
          target: 'Sanjai-E242/sentinel-runtime',
        });

      store.updateDecision('act_gh_to_reject', {
        decision: 'CONFIRM',
        requires_human_confirm: true,
      });

      const rejectRes = await request(app)
        .post('/api/integrations/github/reject')
        .set('X-Operator-Role', 'SOC_ADMIN')
        .send({
          action_id: 'act_gh_to_reject',
          operator: 'SOC_ADMIN_SANJAI',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.status).toBe('denied');
      expect(rejectRes.body.execution_state).toBe('BLOCKED');
      expect(rejectRes.body.decision.decision).toBe('DENIED');
      expect(rejectRes.body.github_output).toBeNull();
    });

    it('records audit logs with external_system: github', async () => {
      await request(app)
        .post('/api/integrations/github/action')
        .set('Authorization', 'Bearer sentinel_sec_admin_key_demo_01')
        .send({
          action_id: 'act_gh_audit_log_test',
          session_id: 'sess_gh_audit',
          principal_id: 'admin_migration_01',
          resource_type: 'github',
          operation: 'list_issues',
          scope_required: 'repo.read',
          target: 'Sanjai-E242/sentinel-runtime',
        });

      const auditLogs = store.getAuditLogs({ sessionId: 'sess_gh_audit' });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].event_data).toHaveProperty('external_system', 'github');
    });
  });
});
