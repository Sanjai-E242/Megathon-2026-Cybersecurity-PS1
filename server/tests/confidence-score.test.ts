import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { TrajectoryMonitor } from '../engine/trajectory.js';
import { SentinelSecurityEngine } from '../engine/securityEngine.js';
import { Action, Principal } from '../engine/types.js';
import { store } from '../data/store.js';

describe('Sentinel Trajectory Drift Confidence Score Suite', () => {
  let trajectoryMonitor: TrajectoryMonitor;
  let securityEngine: SentinelSecurityEngine;

  beforeEach(() => {
    trajectoryMonitor = new TrajectoryMonitor();
    securityEngine = new SentinelSecurityEngine();
    store.resetDemoState();
  });

  it('1. Low-history trajectory produces LOW confidence level (< 0.40)', () => {
    const singleAction: Action[] = [
      {
        action_id: 'act_1',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'file',
        target: 'config.yaml',
        operation: 'read_file',
        scope_required: 'file.read',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = trajectoryMonitor.calculateDrift(singleAction);
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.0);
    expect(result.confidence_score).toBeLessThan(0.40);
    expect(result.confidence_level).toBe('LOW');
    expect(result.confidence_factors.history_depth_score).toBeLessThanOrEqual(0.10);
  });

  it('2. Multiple consistent signals increase confidence score', () => {
    // 1 action vs 4 escalating diverse actions
    const lowSignal: Action[] = [
      {
        action_id: 'act_1',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'file',
        target: 'readme.md',
        operation: 'read_file',
        scope_required: 'file.read',
        timestamp: new Date(Date.now() - 10000).toISOString(),
      },
    ];

    const now = Date.now();
    const highSignal: Action[] = [
      {
        action_id: 'act_1',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'file',
        target: 'notes.txt',
        operation: 'read_file',
        scope_required: 'file.read',
        timestamp: new Date(now - 4000).toISOString(),
      },
      {
        action_id: 'act_2',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'database',
        target: 'users',
        operation: 'update_record',
        scope_required: 'db.write',
        timestamp: new Date(now - 3000).toISOString(),
      },
      {
        action_id: 'act_3',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'schema',
        target: 'production_schema',
        operation: 'create_migration',
        scope_required: 'schema.migrate',
        timestamp: new Date(now - 2000).toISOString(),
      },
      {
        action_id: 'act_4',
        session_id: 'sess_1',
        principal_id: 'user_42',
        resource_type: 'database',
        target: 'orders',
        operation: 'delete_table',
        scope_required: 'db.admin',
        timestamp: new Date(now - 1000).toISOString(),
      },
    ];

    const lowRes = trajectoryMonitor.calculateDrift(lowSignal);
    const highRes = trajectoryMonitor.calculateDrift(highSignal);

    expect(highRes.confidence_score).toBeGreaterThan(lowRes.confidence_score);
    expect(highRes.confidence_factors.signal_consistency_score).toBeGreaterThan(
      lowRes.confidence_factors.signal_consistency_score
    );
  });

  it('3. High escalation evidence corroborates behavioral trajectory and increases confidence', () => {
    const actions: Action[] = [
      {
        action_id: 'a1',
        session_id: 's1',
        principal_id: 'p1',
        resource_type: 'file',
        target: 'doc.txt',
        operation: 'read_file',
        scope_required: 'file.read',
        timestamp: new Date(Date.now() - 3000).toISOString(),
      },
      {
        action_id: 'a2',
        session_id: 's1',
        principal_id: 'p1',
        resource_type: 'database',
        target: 'db',
        operation: 'update_record',
        scope_required: 'db.write',
        timestamp: new Date(Date.now() - 2000).toISOString(),
      },
      {
        action_id: 'a3',
        session_id: 's1',
        principal_id: 'p1',
        resource_type: 'database',
        target: 'db',
        operation: 'delete_table',
        scope_required: 'db.admin',
        timestamp: new Date(Date.now() - 1000).toISOString(),
      },
    ];

    const res = trajectoryMonitor.calculateDrift(actions);
    expect(res.confidence_factors.escalation_evidence_score).toBeGreaterThan(0.05);
    expect(res.evidence.risk_escalations).toBeGreaterThanOrEqual(2);
    expect(res.confidence_score).toBeGreaterThanOrEqual(0.40);
  });

  it('4. Rich metadata (e.g. row_count_estimate) increases metadata quality confidence factor', () => {
    const baseAction: Action = {
      action_id: 'a1',
      session_id: 's1',
      principal_id: 'p1',
      resource_type: 'database',
      target: 'users',
      operation: 'update_record',
      scope_required: 'db.write',
      timestamp: new Date().toISOString(),
    };

    const actionWithRichMetadata: Action = {
      ...baseAction,
      metadata: {
        row_count_estimate: 25000,
        environment: 'production',
        version: '2.4.0',
      },
    };

    const resBase = trajectoryMonitor.calculateDrift([baseAction]);
    const resRich = trajectoryMonitor.calculateDrift([actionWithRichMetadata]);

    expect(resRich.confidence_factors.metadata_quality_score).toBeGreaterThan(
      resBase.confidence_factors.metadata_quality_score
    );
    expect(resRich.evidence.large_operation).toBe(true);
    expect(resRich.evidence.metadata_richness).toBe('HIGH');
  });

  it('5. Long session (8+ actions) delivers HIGH confidence (>= 0.70)', () => {
    const longHistory: Action[] = Array.from({ length: 8 }).map((_, i) => ({
      action_id: `act_${i}`,
      session_id: 'sess_long',
      principal_id: 'agent_long',
      resource_type: i % 2 === 0 ? 'file' : 'database',
      target: `target_${i}`,
      operation: i % 3 === 0 ? 'read_file' : i % 3 === 1 ? 'update_record' : 'create_migration',
      scope_required: 'db.write',
      timestamp: new Date(Date.now() - (8 - i) * 1000).toISOString(),
    }));

    const res = trajectoryMonitor.calculateDrift(longHistory);
    expect(res.confidence_score).toBeGreaterThanOrEqual(0.70);
    expect(res.confidence_level).toBe('HIGH');
    expect(res.evidence.history_depth).toBe(8);
  });

  it('6. Confidence score is strictly bounded between 0.00 and 1.00', () => {
    // Empty history
    const emptyRes = trajectoryMonitor.calculateConfidence([], []);
    expect(emptyRes.confidence_score).toBeGreaterThanOrEqual(0.0);
    expect(emptyRes.confidence_score).toBeLessThanOrEqual(1.0);

    // Huge history and massive escalations
    const hugeHistory: Action[] = Array.from({ length: 50 }).map((_, i) => ({
      action_id: `act_huge_${i}`,
      session_id: 'sess_huge',
      principal_id: 'agent_huge',
      resource_type: `res_${i % 10}`,
      target: `tbl_${i}`,
      operation: 'delete_table',
      scope_required: 'db.admin',
      metadata: { row_count_estimate: 1000000 },
      timestamp: new Date(Date.now() - (50 - i) * 100).toISOString(),
    }));

    const maxRes = trajectoryMonitor.calculateConfidence(hugeHistory, hugeHistory, 10, 10, 10, 10);
    expect(maxRes.confidence_score).toBeGreaterThanOrEqual(0.0);
    expect(maxRes.confidence_score).toBeLessThanOrEqual(1.0);
  });

  it('7. Confidence MUST NOT override security decisions (Low Confidence does not grant Allow; High Confidence does not force Block)', () => {
    const principalAuthorized: Principal = {
      principal_id: 'agent_test',
      role: 'developer',
      authorized_scopes: ['file.read', 'db.write', 'db.admin', 'schema.migrate'],
    };

    // Case A: Destructive action with single action (LOW confidence) -> Still BLOCKED or CONFIRMED deterministically
    const destructiveAction: Action = {
      action_id: 'act_dest_1',
      session_id: 'sess_fresh',
      principal_id: 'agent_test',
      resource_type: 'database',
      target: 'orders_prod',
      operation: 'delete_table',
      scope_required: 'db.admin',
      timestamp: new Date().toISOString(),
    };

    // Principal with only read scope trying destructive action (unauthorized) with 1 action (low confidence)
    const unauthorizedPrincipal: Principal = {
      principal_id: 'bot_unauth',
      role: 'readonly',
      authorized_scopes: ['file.read'],
    };

    const { decisionResult: unauthDecision } = securityEngine.evaluateAction(
      destructiveAction,
      unauthorizedPrincipal,
      []
    );

    expect(unauthDecision.confidence_level).toBe('LOW');
    expect(unauthDecision.decision).toBe('BLOCK'); // Must STILL BE BLOCKED despite low confidence!

    // Case B: High confidence normal reading session -> Still ALLOWED
    const readHistory: Action[] = Array.from({ length: 8 }).map((_, i) => ({
      action_id: `act_r_${i}`,
      session_id: 'sess_read',
      principal_id: 'agent_test',
      resource_type: 'file',
      target: `file_${i}.txt`,
      operation: 'read_file',
      scope_required: 'file.read',
      timestamp: new Date(Date.now() - (8 - i) * 1000).toISOString(),
    }));

    const nextReadAction: Action = {
      action_id: 'act_r_next',
      session_id: 'sess_read',
      principal_id: 'agent_test',
      resource_type: 'file',
      target: 'file_final.txt',
      operation: 'read_file',
      scope_required: 'file.read',
      timestamp: new Date().toISOString(),
    };

    const { decisionResult: readDecision } = securityEngine.evaluateAction(
      nextReadAction,
      principalAuthorized,
      readHistory
    );

    expect(['MEDIUM', 'HIGH']).toContain(readDecision.confidence_level);
    expect(readDecision.decision).toBe('ALLOW'); // Must STILL BE ALLOWED despite high confidence!
  });

  it('8. Existing attack scenario finishes in deterministic BLOCK with rich explanations', () => {
    const principal: Principal = {
      principal_id: 'user_42',
      role: 'support_agent',
      authorized_scopes: ['file.read', 'db.read', 'db.write', 'db.admin', 'schema.migrate'],
    };

    const attackSteps: Action[] = [
      { action_id: 's1', session_id: 'att_1', principal_id: 'user_42', resource_type: 'file', target: 'readme.txt', operation: 'read_file', scope_required: 'file.read', timestamp: new Date(Date.now() - 4000).toISOString() },
      { action_id: 's2', session_id: 'att_1', principal_id: 'user_42', resource_type: 'database', target: 'users', operation: 'list_records', scope_required: 'db.read', timestamp: new Date(Date.now() - 3000).toISOString() },
      { action_id: 's3', session_id: 'att_1', principal_id: 'user_42', resource_type: 'database', target: 'users', operation: 'update_record', scope_required: 'db.write', timestamp: new Date(Date.now() - 2000).toISOString() },
      { action_id: 's4', session_id: 'att_1', principal_id: 'user_42', resource_type: 'database', target: 'users', operation: 'update_record', scope_required: 'db.write', metadata: { row_count_estimate: 25000 }, timestamp: new Date(Date.now() - 1000).toISOString() },
    ];

    const finalDestructiveStep: Action = {
      action_id: 's5',
      session_id: 'att_1',
      principal_id: 'user_42',
      resource_type: 'database',
      target: 'orders_prod',
      operation: 'delete_table',
      scope_required: 'db.admin',
      timestamp: new Date().toISOString(),
    };

    const { decisionResult } = securityEngine.evaluateAction(
      finalDestructiveStep,
      principal,
      attackSteps
    );

    expect(decisionResult.decision).toBe('BLOCK');
    expect(decisionResult.drift_score).toBeGreaterThanOrEqual(0.60);
    expect(decisionResult.confidence_score).toBeGreaterThanOrEqual(0.65);
    expect(decisionResult.human_explanation).toContain('Blocked');
    expect(decisionResult.human_explanation).toContain('destructive');
    expect(decisionResult.technical_explanation).toBeDefined();
  });

  it('9. Legitimate migration scenario correctly reaches CONFIRM with appropriate explanations', () => {
    const adminPrincipal: Principal = {
      principal_id: 'admin_migration_01',
      role: 'dba_admin',
      authorized_scopes: ['schema.migrate', 'db.write', 'db.admin', 'file.read'],
    };

    const migrationStep: Action = {
      action_id: 'm1',
      session_id: 'mig_1',
      principal_id: 'admin_migration_01',
      resource_type: 'schema',
      target: 'production_schema_v2',
      operation: 'create_migration',
      scope_required: 'schema.migrate',
      metadata: { row_count_estimate: 5000 },
      timestamp: new Date().toISOString(),
    };

    const { decisionResult } = securityEngine.evaluateAction(
      migrationStep,
      adminPrincipal,
      []
    );

    expect(decisionResult.decision).toBe('CONFIRM');
    expect(decisionResult.requires_human_confirm).toBe(true);
    expect(decisionResult.human_explanation).toContain('Human approval required');
  });

  it('10. REST API returns all new confidence and explanation fields', async () => {
    const res = await request(app)
      .post('/api/actions')
      .set('Authorization', 'Bearer sentinel_sec_live_key_demo_99')
      .send({
        action_id: `act_api_test_${Date.now()}`,
        session_id: 'sess_api_test',
        principal_id: 'external-agent-01',
        resource_type: 'file',
        target: 'app.config',
        operation: 'read_file',
        scope_required: 'file.read',
      });

    expect(res.status).toBe(200);
    expect(res.body.confidence_score).toBeDefined();
    expect(typeof res.body.confidence_score).toBe('number');
    expect(res.body.confidence_level).toBeDefined();
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(res.body.confidence_level);
    expect(res.body.confidence_factors).toBeDefined();
    expect(res.body.evidence).toBeDefined();
    expect(res.body.human_explanation).toBeDefined();
    expect(res.body.technical_explanation).toBeDefined();
  });
});
