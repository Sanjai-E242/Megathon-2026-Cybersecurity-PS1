export type RiskLevel = 'read' | 'write' | 'destructive' | 'unknown';
export type DecisionType = 'ALLOW' | 'CONFIRM' | 'BLOCK' | 'APPROVED' | 'DENIED';

export interface Principal {
  id?: string;
  principal_id: string;
  role: string;
  authorized_scopes: string[];
  created_at?: string;
}

export interface Action {
  id?: string;
  action_id: string;
  session_id: string;
  principal_id: string;
  timestamp: string;
  resource_type: string;
  operation: string;
  scope_required: string;
  target: string;
  metadata?: Record<string, unknown>;
  risk_class?: RiskLevel;
  decision?: DecisionType;
  reason?: string;
  drift_score?: number;
  requires_human_confirm?: boolean;
  approved_by?: string;
  approved_at?: string;
  execution_latency_ms?: number;
}

export interface DecisionResult {
  action_id: string;
  session_id: string;
  decision: DecisionType;
  reason: string;
  risk_class: RiskLevel;
  auth_ok: boolean;
  drift_score: number;
  requires_human_confirm: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  execution_latency_ms?: number;
}

export interface AuditLogEntry {
  id: string;
  session_id: string;
  action_id: string;
  principal_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  decision?: DecisionType;
  reason?: string;
  risk_class?: RiskLevel;
  target?: string;
  operation?: string;
  actor: string;
  timestamp: string;
}

export interface PolicyRule {
  operation: string;
  risk_level: RiskLevel;
  description?: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  totalIntercepted: number;
  allowedCount: number;
  pendingCount: number;
  blockedCount: number;
  activeSessions: number;
  currentDriftScore: number;
  avgLatencyMs: number;
}

export type ActiveTab = 'overview' | 'live-agent' | 'developer-api' | 'live-feed' | 'scenarios' | 'trajectory' | 'audit' | 'policies' | 'principals';
