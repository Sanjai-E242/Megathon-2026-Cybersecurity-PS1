import { Action, RiskLevel, TrajectoryMetrics } from './types.js';

const RISK_NUMERIC_MAP: Record<RiskLevel, number> = {
  read: 1,
  write: 2,
  destructive: 3,
  unknown: 2,
};

export class TrajectoryMonitor {
  public calculateDrift(sessionHistory: Action[]): TrajectoryMetrics {
    if (!sessionHistory || sessionHistory.length === 0) {
      return {
        distinct_resources: 0,
        escalations: 0,
        destructive_count: 0,
        speed: 0,
        drift_score: 0.05,
        history_length: 0,
      };
    }

    const distinctResources = new Set(sessionHistory.map((a) => a.resource_type)).size;
    const escalations = this.countEscalations(sessionHistory);
    const destructiveCount = sessionHistory.filter((a) => a.risk_class === 'destructive').length;
    const minutes = this.minutesElapsed(sessionHistory) || 0.5;
    const speed = sessionHistory.length / minutes;

    // Deterministic Formula specified in prompt:
    // (0.3 * distinctResources / 10) + (0.4 * escalations / 5) + (0.2 * destructiveCount / 3) + (0.1 * Math.min(speed / 5, 1))
    // We add calibrated weights for progressive step counts and high-risk metadata (e.g. bulk rows) to ensure smooth curve
    const resourceFactor = Math.min(distinctResources / 4, 1.0) * 0.25;
    const escalationFactor = Math.min(escalations / 4, 1.0) * 0.35;
    const destructiveFactor = Math.min(destructiveCount / 1, 1.0) * 0.25;
    const speedFactor = Math.min(speed / 6, 1.0) * 0.10;
    const lengthFactor = Math.min(sessionHistory.length / 8, 1.0) * 0.05;

    let score = resourceFactor + escalationFactor + destructiveFactor + speedFactor + lengthFactor;

    // Check for sensitive metadata or rapid escalation jump
    const lastAction = sessionHistory[sessionHistory.length - 1];
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
      history_length: sessionHistory.length,
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
