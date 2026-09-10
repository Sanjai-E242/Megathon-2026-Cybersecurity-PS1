import { Action, RiskLevel, TrajectoryFactors, TrajectoryMetrics } from './types.js';

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

    return {
      distinct_resources: maxResources,
      escalations: maxEscalations,
      destructive_count: maxDestructive,
      speed: Number(maxSpeed.toFixed(1)),
      drift_score: compositeDrift,
      current_session_drift: currentDrift,
      cross_session_drift: crossDrift,
      history_length: Math.max(sessionHistory.length, crossSessionHistory?.length || 0),
      factors,
      explanation,
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
    const destructiveCount = history.filter((a) => a.risk_class === 'destructive').length;
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
      const prevLevel = RISK_NUMERIC_MAP[history[i - 1].risk_class || 'read'] || 1;
      const currLevel = RISK_NUMERIC_MAP[history[i].risk_class || 'read'] || 1;
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
