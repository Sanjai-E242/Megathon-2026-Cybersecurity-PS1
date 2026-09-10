import { Action, RiskLevel, TrajectoryFactors, TrajectoryMetrics } from './types.js';
import { DEFAULT_RISK_TABLE } from './risk.js';

const RISK_NUMERIC_MAP: Record<RiskLevel, number> = {
  read: 1,
  write: 2,
  destructive: 3,
  unknown: 2,
};

export class TrajectoryMonitor {
  /**
   * Calculates deterministic behavioral trajectory drift for current session
   * and cross-session historical context for the same principal.
   */
  public calculateDrift(
    sessionHistory: Action[],
    crossSessionHistory?: Action[]
  ): TrajectoryMetrics {
    const currentDriftMetrics = this.computeSingleSequenceDrift(sessionHistory);

    let crossDriftMetrics = currentDriftMetrics;
    if (crossSessionHistory && crossSessionHistory.length > 0) {
      crossDriftMetrics = this.computeSingleSequenceDrift(crossSessionHistory);
    }

    const currentDrift = currentDriftMetrics.drift_score;
    const crossDrift = crossDriftMetrics.drift_score;

    // Composite drift score reflects the peak bounded behavioral drift observed
    const compositeDrift = Number(Math.max(currentDrift, crossDrift).toFixed(2));

    // Determine qualitative explanation factors
    const maxEscalations = Math.max(currentDriftMetrics.escalations, crossDriftMetrics.escalations);
    const maxResources = Math.max(currentDriftMetrics.distinct_resources, crossDriftMetrics.distinct_resources);
    const maxDestructive = Math.max(currentDriftMetrics.destructive_count, crossDriftMetrics.destructive_count);
    const maxSpeed = Math.max(currentDriftMetrics.speed, crossDriftMetrics.speed);

    const factors: TrajectoryFactors = {
      risk_escalation: maxEscalations >= 2 ? 'HIGH' : maxEscalations === 1 ? 'MEDIUM' : 'LOW',
      resource_diversity: maxResources >= 3 ? 'HIGH' : maxResources === 2 ? 'MEDIUM' : 'LOW',
      destructive_actions: maxDestructive >= 1 ? 'HIGH' : 'LOW',
      action_velocity: maxSpeed >= 15 ? 'HIGH' : maxSpeed >= 5 ? 'MEDIUM' : 'LOW',
    };

    // Generate deterministic human-readable explanation
    const reasons: string[] = [];
    if (factors.destructive_actions === 'HIGH') {
      reasons.push('destructive operation proposed');
    }
    if (factors.risk_escalation === 'HIGH') {
      reasons.push('progressive risk escalation from READ to WRITE/DESTRUCTIVE');
    }
    if (factors.resource_diversity === 'HIGH') {
      reasons.push(`accessing ${maxResources} diverse resource domains`);
    }
    if (crossDrift > currentDrift + 0.15) {
      reasons.push('elevated cross-session historical drift observed');
    }

    const explanation = reasons.length > 0
      ? `Behavioral drift (${Math.round(compositeDrift * 100)}%): ${reasons.join(', ')}.`
      : `Behavioral trajectory within normal parameters (${Math.round(compositeDrift * 100)}% drift).`;

    // Calculate deterministic Trajectory Drift Confidence Score
    const { confidence_score, confidence_level, confidence_factors, evidence } = this.calculateConfidence(
      sessionHistory,
      crossSessionHistory,
      maxEscalations,
      maxResources,
      maxDestructive,
      maxSpeed
    );

    return {
      distinct_resources: maxResources,
      escalations: maxEscalations,
      destructive_count: maxDestructive,
      speed: Number(maxSpeed.toFixed(1)),
      drift_score: compositeDrift,
      current_session_drift: currentDrift,
      cross_session_drift: crossDrift,
      confidence_score,
      confidence_level,
      confidence_factors,
      evidence,
      history_length: Math.max(sessionHistory.length, crossSessionHistory?.length || 0),
      factors,
      explanation,
    };
  }

  /**
   * Deterministic Trajectory Drift Confidence Score calculation (0.00 -> 1.00).
   * Measures evidence depth & consistency supporting the behavioral assessment.
   */
  public calculateConfidence(
    sessionHistory: Action[],
    crossSessionHistory?: Action[],
    maxEscalations: number = 0,
    maxResources: number = 0,
    maxDestructive: number = 0,
    maxSpeed: number = 0
  ): {
    confidence_score: number;
    confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence_factors: {
      history_depth_score: number;
      signal_consistency_score: number;
      escalation_evidence_score: number;
      metadata_quality_score: number;
      cross_session_evidence_score: number;
    };
    evidence: {
      history_depth: number;
      risk_escalations: number;
      resource_diversity: number;
      destructive_actions: number;
      large_operation: boolean;
      metadata_richness: 'LOW' | 'MEDIUM' | 'HIGH';
      action_velocity_rate: number;
    };
  } {
    const sessionCount = sessionHistory.length;
    const crossCount = crossSessionHistory?.length || 0;
    const lastAction = sessionHistory[sessionHistory.length - 1];

    // Compute inferred metrics if not provided directly
    const actualEscalations = maxEscalations > 0 ? maxEscalations : this.countEscalations(sessionHistory);
    const actualResources = maxResources > 0 ? maxResources : new Set(sessionHistory.map(a => a.resource_type)).size;
    const actualDestructive = maxDestructive > 0 ? maxDestructive : sessionHistory.filter(a => (a.risk_class || DEFAULT_RISK_TABLE[a.operation]) === 'destructive').length;
    const actualSpeed = maxSpeed > 0 ? maxSpeed : (sessionCount / (this.minutesElapsed(sessionHistory) || 0.5));

    // 1. History Depth (0.40 max weight):
    // 0 actions -> 0.00, 1 action -> 0.05, 3 actions -> 0.18, 6 actions -> 0.32, 8+ actions -> 0.40
    const historyDepthScore = Number((Math.min(sessionCount / 8, 1.0) * 0.40).toFixed(3));

    // 2. Cross-Session Corroboration (0.15 weight):
    const crossSessionEvidenceScore = Number((Math.min(crossCount / 6, 1.0) * 0.15).toFixed(3));

    // 3. Signal Consistency (0.25 weight):
    // Multiple trajectory signals corroborating the escalation pattern
    let signalCount = 0;
    if (actualEscalations > 0) signalCount += 0.35;
    if (actualResources > 1) signalCount += 0.25;
    if (actualDestructive > 0) signalCount += 0.25;
    if (actualSpeed >= 3) signalCount += 0.15;
    const signalConsistencyScore = Number((Math.min(signalCount, 1.0) * 0.25).toFixed(3));

    // 4. Escalation Evidence (0.15 weight):
    // Progressive transition depth (e.g. read -> write -> destructive)
    const escalationEvidenceScore = Number((Math.min(actualEscalations / 2, 1.0) * 0.15).toFixed(3));

    // 5. Metadata Quality / Richness (0.10 weight):
    const hasLargeOp = Boolean(
      lastAction?.metadata?.row_count_estimate &&
      Number(lastAction.metadata.row_count_estimate) >= 500
    );
    const hasRichMeta = Boolean(
      lastAction?.metadata &&
      Object.keys(lastAction.metadata).length > 0 &&
      (lastAction.metadata.row_count_estimate || lastAction.metadata.version || lastAction.metadata.environment)
    );
    const metadataQualityScore = hasLargeOp ? 0.10 : hasRichMeta ? 0.07 : 0.03;

    // Total raw confidence score (base minimum 0.12 to ensure valid positive baseline)
    const rawScore = 0.12 + historyDepthScore + crossSessionEvidenceScore + signalConsistencyScore + escalationEvidenceScore + metadataQualityScore;
    const boundedScore = Number(Math.min(Math.max(rawScore, 0.12), 0.98).toFixed(2));

    const confidence_level: 'LOW' | 'MEDIUM' | 'HIGH' =
      boundedScore >= 0.70 ? 'HIGH' : boundedScore >= 0.40 ? 'MEDIUM' : 'LOW';

    return {
      confidence_score: boundedScore,
      confidence_level,
      confidence_factors: {
        history_depth_score: historyDepthScore,
        signal_consistency_score: signalConsistencyScore,
        escalation_evidence_score: escalationEvidenceScore,
        metadata_quality_score: metadataQualityScore,
        cross_session_evidence_score: crossSessionEvidenceScore,
      },
      evidence: {
        history_depth: sessionCount,
        risk_escalations: actualEscalations,
        resource_diversity: actualResources,
        destructive_actions: actualDestructive,
        large_operation: hasLargeOp,
        metadata_richness: hasLargeOp ? 'HIGH' : hasRichMeta ? 'MEDIUM' : 'LOW',
        action_velocity_rate: Number(actualSpeed.toFixed(1)),
      },
    };
  }

  private computeSingleSequenceDrift(history: Action[]): {
    distinct_resources: number;
    escalations: number;
    destructive_count: number;
    speed: number;
    drift_score: number;
  } {
    if (!history || history.length === 0) {
      return {
        distinct_resources: 0,
        escalations: 0,
        destructive_count: 0,
        speed: 0,
        drift_score: 0.05,
      };
    }

    const distinctResources = new Set(history.map((a) => a.resource_type)).size;
    const escalations = this.countEscalations(history);
    const destructiveCount = history.filter((a) => (a.risk_class || DEFAULT_RISK_TABLE[a.operation]) === 'destructive').length;
    const minutes = this.minutesElapsed(history) || 0.5;
    const speed = history.length / minutes;

    // Deterministic Formula:
    // Resource factor: 25% | Escalation: 35% | Destructive: 25% | Speed: 10% | Length: 5%
    const resourceFactor = Math.min(distinctResources / 4, 1.0) * 0.25;
    const escalationFactor = Math.min(escalations / 4, 1.0) * 0.35;
    const destructiveFactor = Math.min(destructiveCount / 1, 1.0) * 0.25;
    const speedFactor = Math.min(speed / 6, 1.0) * 0.10;
    const lengthFactor = Math.min(history.length / 8, 1.0) * 0.05;

    let score = resourceFactor + escalationFactor + destructiveFactor + speedFactor + lengthFactor;

    // Check for high-impact metadata (e.g. bulk rows affected)
    const lastAction = history[history.length - 1];
    if (lastAction?.metadata?.row_count_estimate) {
      const rows = Number(lastAction.metadata.row_count_estimate);
      if (rows >= 50000) {
        score += 0.15;
      } else if (rows >= 500) {
        score += 0.08;
      }
    }

    // Keep score bounded between 0.05 and 0.98
    const finalScore = Number(Math.min(Math.max(score, 0.05), 0.98).toFixed(2));

    return {
      distinct_resources: distinctResources,
      escalations,
      destructive_count: destructiveCount,
      speed: Number(speed.toFixed(1)),
      drift_score: finalScore,
    };
  }

  private countEscalations(history: Action[]): number {
    let escalations = 0;
    for (let i = 1; i < history.length; i++) {
      const prevClass = history[i - 1].risk_class || DEFAULT_RISK_TABLE[history[i - 1].operation] || 'read';
      const currClass = history[i].risk_class || DEFAULT_RISK_TABLE[history[i].operation] || 'read';
      const prevLevel = RISK_NUMERIC_MAP[prevClass] || 1;
      const currLevel = RISK_NUMERIC_MAP[currClass] || 1;
      if (currLevel > prevLevel) {
        escalations += (currLevel - prevLevel);
      }
    }
    return escalations;
  }

  private minutesElapsed(history: Action[]): number {
    if (history.length < 2) return 0.5;
    const firstTime = new Date(history[0].timestamp).getTime();
    const lastTime = new Date(history[history.length - 1].timestamp).getTime();
    const diffMs = Math.max(lastTime - firstTime, 1000);
    return Math.max(diffMs / 60000, 0.2);
  }
}
