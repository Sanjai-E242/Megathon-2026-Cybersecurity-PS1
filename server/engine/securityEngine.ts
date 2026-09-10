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

    // 6. Generate human-friendly and technical explanations
    let humanExplanation = '';
    if (decisionEvaluation.decision === 'BLOCK') {
      if (!authResult.auth_ok) {
        humanExplanation = `Blocked. This agent does not have permission to perform this type of action (missing required scope '${action.scope_required}').`;
      } else if (riskClass === 'destructive') {
        humanExplanation = `Blocked. The action is destructive and the agent's recent behavior shows significant escalation (${Math.round(metrics.drift_score * 100)}% behavioral risk, ${metrics.confidence_level.toLowerCase()} evidence confidence).`;
      } else {
        humanExplanation = `Blocked. Action exceeded runtime security thresholds (${Math.round(metrics.drift_score * 100)}% behavioral risk).`;
      }
    } else if (decisionEvaluation.decision === 'CONFIRM') {
      if (riskClass === 'destructive') {
        humanExplanation = `Human approval required. The agent is authorized, but destructive operations require explicit human operator sign-off.`;
      } else if (gateResult.requires_confirm) {
        humanExplanation = `Human approval required. The action is potentially high-impact (bulk modification) and requires operator confirmation.`;
      } else {
        humanExplanation = `Human approval required. The agent's recent behavior shows elevated drift (${Math.round(metrics.drift_score * 100)}%), requiring manual verification.`;
      }
    } else {
      humanExplanation = `Allowed. The agent is authorized and the action presents low operational risk within normal behavioral patterns.`;
    }

    const technicalExplanation = `${decisionEvaluation.reason} [Drift: ${(metrics.drift_score * 100).toFixed(0)}%, Confidence: ${(metrics.confidence_score * 100).toFixed(0)}% (${metrics.confidence_level}), Risk: ${riskClass.toUpperCase()}, Auth: ${authResult.auth_ok ? 'PASS' : 'FAIL'}]`;

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
      confidence_score: metrics.confidence_score,
      confidence_level: metrics.confidence_level,
      confidence_factors: metrics.confidence_factors,
      evidence: metrics.evidence,
      human_explanation: humanExplanation,
      technical_explanation: technicalExplanation,
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
