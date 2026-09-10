import { Action, DecisionResult, Principal, RiskLevel } from './types.js';
import { AuthorizationEngine } from './auth.js';
import { RiskClassifier } from './risk.js';
import { TrajectoryMonitor } from './trajectory.js';
import { DecisionEngine } from './decision.js';

export class SentinelSecurityEngine {
  private authEngine: AuthorizationEngine;
  private riskClassifier: RiskClassifier;
  private trajectoryMonitor: TrajectoryMonitor;
  private decisionEngine: DecisionEngine;

  constructor(customPolicies?: Record<string, RiskLevel>) {
    this.authEngine = new AuthorizationEngine();
    this.riskClassifier = new RiskClassifier(customPolicies);
    this.trajectoryMonitor = new TrajectoryMonitor();
    this.decisionEngine = new DecisionEngine();
  }

  public evaluateAction(
    action: Action,
    principal: Principal,
    sessionHistory: Action[],
    crossSessionHistory?: Action[]
  ): { decisionResult: DecisionResult; metrics: ReturnType<TrajectoryMonitor['calculateDrift']> } {
    const startTime = Date.now();

    // 1. Structured log: ACTION_RECEIVED
    console.log(`[SENTINEL_PIPELINE] ACTION_RECEIVED: action_id=${action.action_id} principal=${action.principal_id} op=${action.operation} target=${action.target}`);

    // 2. Classify Risk & Evaluate Reversibility Gate
    const riskClass = this.riskClassifier.classifyRisk(action.operation);
    action.risk_class = riskClass;
    const gateResult = this.riskClassifier.evaluateGate(action, riskClass);
    console.log(`[SENTINEL_PIPELINE] RISK_CLASSIFIED: op=${action.operation} risk_class=${riskClass} requires_confirm=${gateResult.requires_confirm}`);

    // 3. Check Authorization
    const authResult = this.authEngine.checkAuth(action, principal);
    console.log(`[SENTINEL_PIPELINE] AUTH_CHECK: auth_ok=${authResult.auth_ok} ${authResult.reason || 'authorized'}`);

    // 4. Update and calculate Trajectory Drift Score (Current Session + Cross Session)
    const updatedCurrentHistory = [...sessionHistory, action];
    const updatedCrossHistory = crossSessionHistory ? [...crossSessionHistory, action] : undefined;
    const metrics = this.trajectoryMonitor.calculateDrift(updatedCurrentHistory, updatedCrossHistory);
    console.log(`[SENTINEL_PIPELINE] TRAJECTORY_UPDATED: drift_score=${metrics.drift_score} current_drift=${metrics.current_session_drift} cross_drift=${metrics.cross_session_drift}`);

    // 5. Compute Final Execution Decision
    const decisionEvaluation = this.decisionEngine.decide(
      action,
      principal,
      authResult,
      riskClass,
      gateResult,
      metrics.drift_score
    );
    const latency = Date.now() - startTime;
    console.log(`[SENTINEL_PIPELINE] DECISION_MADE: action_id=${action.action_id} decision=${decisionEvaluation.decision} reason="${decisionEvaluation.reason}" latency=${latency}ms`);

    const decisionResult: DecisionResult = {
      action_id: action.action_id,
      session_id: action.session_id,
      decision: decisionEvaluation.decision,
      reason: decisionEvaluation.reason,
      risk_class: riskClass,
      auth_ok: authResult.auth_ok,
      drift_score: metrics.drift_score,
      current_session_drift: metrics.current_session_drift,
      cross_session_drift: metrics.cross_session_drift,
      factors: metrics.factors,
      explanation: metrics.explanation,
      requires_human_confirm: decisionEvaluation.requires_human_confirm,
      created_at: new Date().toISOString(),
      execution_latency_ms: Math.max(latency, 8),
    };

    return { decisionResult, metrics };
  }

  public getRiskClassifier(): RiskClassifier {
    return this.riskClassifier;
  }
}
