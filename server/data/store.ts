import { EventEmitter } from 'events';
import { Action, AuditLogEntry, DecisionResult, PolicyRule, Principal, SessionInfo } from '../engine/types.js';
import { SEED_AUDIT_LOGS, SEED_POLICIES, SEED_PRINCIPALS } from './seed.js';
import { supabase } from './supabaseClient.js';

export interface RealtimeEventPayload {
  type: 'ACTION_EVALUATED' | 'DECISION_UPDATED' | 'AUDIT_LOGGED' | 'DEMO_RESET';
  data: any;
  timestamp: string;
}

// Safe async wrapper for non-blocking Supabase sync
async function safeSupabaseSync(taskName: string, asyncFn: () => PromiseLike<any>): Promise<void> {
  if (!supabase) return;
  try {
    const res = await asyncFn();
    if (res && res.error) {
      console.warn(`[SUPABASE_${taskName}_NOTE]`, res.error.message || res.error);
    }
  } catch (err: any) {
    console.warn(`[SUPABASE_${taskName}_ERR]`, err?.message || err);
  }
}

export class SentinelStore extends EventEmitter {
  private principals: Map<string, Principal> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();
  private actions: Action[] = [];
  private decisions: Map<string, DecisionResult> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private policies: Map<string, PolicyRule> = new Map();

  constructor() {
    super();
    this.seedDefaults();
    this.syncFromSupabase();
  }

  public seedDefaults(): void {
    SEED_PRINCIPALS.forEach((p) => this.principals.set(p.principal_id, { ...p }));
    SEED_POLICIES.forEach((pol) => this.policies.set(pol.operation, { ...pol }));
    this.auditLogs = [...SEED_AUDIT_LOGS];
  }

  private async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      // Seed principals if table is empty
      const { data: existingPrincipals } = await supabase.from('principals').select('principal_id');
      if (!existingPrincipals || existingPrincipals.length === 0) {
        for (const p of SEED_PRINCIPALS) {
          await supabase.from('principals').upsert({
            principal_id: p.principal_id,
            role: p.role,
            authorized_scopes: p.authorized_scopes,
          });
        }
      }

      // Seed policies if table is empty
      const { data: existingPolicies } = await supabase.from('policies').select('operation');
      if (!existingPolicies || existingPolicies.length === 0) {
        for (const pol of SEED_POLICIES) {
          await supabase.from('policies').upsert({
            operation: pol.operation,
            risk_level: pol.risk_level,
            description: pol.description,
          });
        }
      }
    } catch (err) {
      console.warn('[STORE] Supabase seed sync note:', err);
    }
  }

  // Broadcast event to listeners
  public broadcast(type: RealtimeEventPayload['type'], data: any) {
    const payload: RealtimeEventPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit('realtime_event', payload);
  }

  // Principals
  public getPrincipal(principalId: string): Principal | undefined {
    return this.principals.get(principalId);
  }

  public getAllPrincipals(): Principal[] {
    return Array.from(this.principals.values());
  }

  public savePrincipal(principal: Principal): Principal {
    this.principals.set(principal.principal_id, principal);
    safeSupabaseSync('SAVE_PRINCIPAL', () =>
      supabase!.from('principals').upsert({
        principal_id: principal.principal_id,
        role: principal.role,
        authorized_scopes: principal.authorized_scopes,
      })
    );
    return principal;
  }

  // Sessions
  public getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  public saveSession(session: SessionInfo): SessionInfo {
    this.sessions.set(session.session_id, session);
    safeSupabaseSync('SAVE_SESSION', () =>
      supabase!.from('sessions').upsert(
        {
          session_id: session.session_id,
          principal_id: session.principal_id,
          scenario: session.scenario,
          started_at: session.started_at,
          ended_at: session.ended_at,
          status: session.status,
          total_actions: session.total_actions,
          peak_drift: session.peak_drift,
        },
        { onConflict: 'session_id' }
      )
    );
    return session;
  }

  // Actions
  public saveAction(action: Action): Action {
    this.actions.push(action);

    // Update or create session info
    let session = this.sessions.get(action.session_id);
    if (!session) {
      session = {
        session_id: action.session_id,
        principal_id: action.principal_id,
        scenario: action.session_id.includes('attack') ? 'attack-escalation' : 'legitimate-migration',
        started_at: action.timestamp,
        status: 'active',
        total_actions: 0,
        peak_drift: 0,
      };
      this.sessions.set(action.session_id, session);
    }
    session.total_actions += 1;

    // Asynchronously persist to Supabase
    safeSupabaseSync('SAVE_ACTION', () =>
      supabase!.from('actions').upsert(
        {
          action_id: action.action_id,
          session_id: action.session_id,
          principal_id: action.principal_id,
          timestamp: action.timestamp,
          resource_type: action.resource_type,
          operation: action.operation,
          scope_required: action.scope_required,
          target: action.target,
          metadata: action.metadata || {},
          risk_class: action.risk_class || 'read',
        },
        { onConflict: 'action_id' }
      )
    );
    this.saveSession(session);

    return action;
  }

  public getSessionActions(sessionId: string): Action[] {
    return this.actions.filter((a) => a.session_id === sessionId);
  }

  public getPrincipalActions(principalId: string, limit = 50): Action[] {
    return this.actions
      .filter((a) => a.principal_id === principalId)
      .slice(-limit);
  }

  public getPrincipalSessions(principalId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.principal_id === principalId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  public getAllActions(): Action[] {
    return [...this.actions];
  }

  // Decisions
  public saveDecision(decision: DecisionResult): DecisionResult {
    this.decisions.set(decision.action_id, decision);

    // Update peak drift on session
    const session = this.sessions.get(decision.session_id);
    if (session) {
      if (decision.drift_score > session.peak_drift) {
        session.peak_drift = decision.drift_score;
      }
      if (decision.decision === 'BLOCK') {
        session.status = 'blocked';
        session.ended_at = decision.created_at;
      }
      this.saveSession(session);
    }

    // Persist to Supabase
    safeSupabaseSync('SAVE_DECISION', () =>
      supabase!.from('decisions').upsert(
        {
          action_id: decision.action_id,
          session_id: decision.session_id,
          decision: decision.decision,
          reason: decision.reason,
          auth_ok: decision.auth_ok,
          risk_class: decision.risk_class,
          drift_score: decision.drift_score,
          requires_human_confirm: decision.requires_human_confirm,
          created_at: decision.created_at,
          execution_latency_ms: decision.execution_latency_ms || 10,
        },
        { onConflict: 'action_id' }
      )
    );

    // Find the associated action and broadcast
    const action = this.actions.find((a) => a.action_id === decision.action_id);
    this.broadcast('ACTION_EVALUATED', {
      action: {
        ...(action || {}),
        decision: decision.decision,
        reason: decision.reason,
        drift_score: decision.drift_score,
        risk_class: decision.risk_class,
        requires_human_confirm: decision.requires_human_confirm,
        execution_latency_ms: decision.execution_latency_ms,
      },
      decision,
    });

    return decision;
  }

  public getDecision(actionId: string): DecisionResult | undefined {
    return this.decisions.get(actionId);
  }

  public updateDecision(
    actionId: string,
    updates: Partial<DecisionResult>
  ): DecisionResult | undefined {
    const existing = this.decisions.get(actionId);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.decisions.set(actionId, updated);

    safeSupabaseSync('UPDATE_DECISION', () =>
      supabase!.from('decisions').update({
        decision: updated.decision,
        reason: updated.reason,
        approved_by: updated.approved_by,
        approved_at: updated.approved_at,
      }).eq('action_id', actionId)
    );

    this.broadcast('DECISION_UPDATED', {
      action_id: actionId,
      decision: updated,
    });

    return updated;
  }

  // Audit Logs
  public logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log); // Most recent first

    safeSupabaseSync('LOG_AUDIT', () =>
      supabase!.from('audit_logs').upsert(
        {
          id: log.id,
          session_id: log.session_id,
          action_id: log.action_id,
          principal_id: log.principal_id,
          event_type: log.event_type,
          event_data: log.event_data,
          decision: log.decision,
          reason: log.reason,
          risk_class: log.risk_class,
          target: log.target,
          operation: log.operation,
          actor: log.actor,
          timestamp: log.timestamp,
        },
        { onConflict: 'id' }
      )
    );

    this.broadcast('AUDIT_LOGGED', log);
    return log;
  }

  public getAuditLogs(filters?: {
    sessionId?: string;
    principalId?: string;
    decision?: string;
    risk?: string;
    search?: string;
  }): AuditLogEntry[] {
    let result = [...this.auditLogs];

    if (!filters) return result;

    if (filters.sessionId) {
      result = result.filter((l) => l.session_id.toLowerCase().includes(filters.sessionId!.toLowerCase()));
    }
    if (filters.principalId) {
      result = result.filter((l) => l.principal_id.toLowerCase() === filters.principalId!.toLowerCase());
    }
    if (filters.decision) {
      result = result.filter((l) => l.decision === filters.decision);
    }
    if (filters.risk) {
      result = result.filter((l) => l.risk_class === filters.risk);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action_id.toLowerCase().includes(q) ||
          l.target?.toLowerCase().includes(q) ||
          l.operation?.toLowerCase().includes(q) ||
          l.reason?.toLowerCase().includes(q) ||
          l.principal_id.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // Policies
  public getPolicies(): PolicyRule[] {
    return Array.from(this.policies.values());
  }

  public setPolicy(rule: PolicyRule): PolicyRule {
    const updated = { ...rule, updated_at: new Date().toISOString() };
    this.policies.set(rule.operation, updated);
    safeSupabaseSync('SET_POLICY', () =>
      supabase!.from('policies').upsert({
        operation: updated.operation,
        risk_level: updated.risk_level,
        description: updated.description,
        updated_at: updated.updated_at,
      })
    );
    return updated;
  }

  public deletePolicy(operation: string): boolean {
    const deleted = this.policies.delete(operation);
    safeSupabaseSync('DELETE_POLICY', () =>
      supabase!.from('policies').delete().eq('operation', operation)
    );
    return deleted;
  }

  // Reset demo state
  public resetDemoState(): void {
    this.actions = [];
    this.decisions.clear();
    this.sessions.clear();
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.broadcast('DEMO_RESET', { message: 'Demo environment reset' });
    console.log('[STORE] Reset demo actions, decisions, and active sessions.');
  }
}

export const store = new SentinelStore();
