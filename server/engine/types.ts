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
  drift_score?: number;
  confidence_score?: number;
  confidence_level?: ConfidenceLevel;
  confidence_factors?: ConfidenceFactors;
  evidence?: TrajectoryEvidence;
  human_explanation?: string;
  technical_explanation?: string;
}

export interface AuthResult {
  auth_ok: boolean;
  reason?: string;
}

export interface GateResult {
  requires_confirm: boolean;
  reason?: string;
}

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TrajectoryFactors {
  risk_escalation: 'LOW' | 'MEDIUM' | 'HIGH';
  resource_diversity: 'LOW' | 'MEDIUM' | 'HIGH';
  destructive_actions: 'LOW' | 'MEDIUM' | 'HIGH';
  action_velocity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ConfidenceFactors {
  history_depth_score: number;
  signal_consistency_score: number;
  escalation_evidence_score: number;
  metadata_quality_score: number;
  cross_session_evidence_score: number;
}

export interface TrajectoryEvidence {
  history_depth: number;
  risk_escalations: number;
  resource_diversity: number;
  destructive_actions: number;
  large_operation: boolean;
  metadata_richness: 'LOW' | 'MEDIUM' | 'HIGH';
  action_velocity_rate: number;
}

export interface TrajectoryMetrics {
  distinct_resources: number;
  escalations: number;
  destructive_count: number;
  speed: number;
  drift_score: number;
  current_session_drift?: number;
  cross_session_drift?: number;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  confidence_factors: ConfidenceFactors;
  evidence: TrajectoryEvidence;
  history_length: number;
  factors?: TrajectoryFactors;
  explanation?: string;
}

export interface DecisionResult {
  id?: string;
  action_id: string;
  session_id: string;
  decision: DecisionType;
  reason: string;
  risk_class: RiskLevel;
  auth_ok: boolean;
  drift_score: number;
  current_session_drift?: number;
  cross_session_drift?: number;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  confidence_factors: ConfidenceFactors;
  evidence: TrajectoryEvidence;
  human_explanation?: string;
  technical_explanation?: string;
  factors?: TrajectoryFactors;
  explanation?: string;
  requires_human_confirm: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  execution_latency_ms?: number;
  idempotent_replay?: boolean;
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

export interface SessionInfo {
  id?: string;
  session_id: string;
  principal_id: string;
  scenario: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed' | 'blocked';
  total_actions: number;
  peak_drift: number;
}
