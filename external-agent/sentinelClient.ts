/**
 * Sentinel Runtime - External Agent SDK Client
 * 
 * Reusable client for AI agents to evaluate proposed actions against
 * Sentinel's runtime security harness before executing tools.
 */

export interface ExternalAgentAction {
  action_id?: string;
  session_id: string;
  principal_id: string;
  resource_type: string;
  operation: string;
  scope_required: string;
  target: string;
  metadata?: Record<string, unknown>;
}

export type SentinelDecisionType = 'ALLOW' | 'CONFIRM' | 'BLOCK' | 'APPROVED' | 'DENIED';
export type SentinelRiskLevel = 'read' | 'write' | 'destructive' | 'unknown';

export interface SentinelDecision {
  action_id: string;
  session_id: string;
  decision: SentinelDecisionType;
  reason: string;
  risk_class: SentinelRiskLevel;
  auth_ok: boolean;
  drift_score: number;
  requires_human_confirm: boolean;
  execution_latency_ms?: number;
}

export interface SentinelClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class SentinelClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(options: SentinelClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.SENTINEL_URL || 'http://localhost:3001').replace(/\/$/, '');
    this.apiKey = options.apiKey || process.env.SENTINEL_AGENT_API_KEY || 'sentinel_sec_live_key_demo_99';
    this.timeoutMs = options.timeoutMs || 5000;
  }

  /**
   * Evaluates an agent's proposed action with Sentinel Runtime.
   * MUST be invoked before executing any potentially sensitive tool or command.
   */
  async checkWithSentinel(action: ExternalAgentAction): Promise<SentinelDecision> {
    const payload = {
      action_id: action.action_id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: action.session_id,
      principal_id: action.principal_id,
      resource_type: action.resource_type,
      operation: action.operation,
      scope_required: action.scope_required,
      target: action.target,
      metadata: action.metadata || {},
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sentinel evaluation rejected (${response.status}): ${errorText}`);
      }

      const decision = await response.json() as SentinelDecision;
      return decision;
    } finally {
      clearTimeout(timer);
    }
  }
}
