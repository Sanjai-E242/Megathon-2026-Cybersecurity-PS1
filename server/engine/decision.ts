import { Action, AuthResult, DecisionType, GateResult, Principal, RiskLevel } from './types.js';

export interface DecisionEvaluation {
  decision: DecisionType;
  reason: string;
  requires_human_confirm: boolean;
}

export class DecisionEngine {
  public decide(
    action: Action,
    principal: Principal,
    authResult: AuthResult,
    riskClass: RiskLevel,
    gateResult: GateResult,
    driftScore: number
  ): DecisionEvaluation {
    // 1. Hard Authorization Check
    if (!authResult.auth_ok) {
      return {
        decision: 'BLOCK',
        reason: authResult.reason || 'Unauthorized scope for principal',
        requires_human_confirm: false,
      };
    }

    const isStaging = (action.target || '').toLowerCase().includes('staging');
    const isProd = (action.target || '').toLowerCase().includes('prod') || (action.target || '').toLowerCase().includes('production');
    const isMigrationAdmin = principal.role === 'migration_admin' || principal.principal_id.includes('admin_migration');

    // 2. High Trajectory Drift + Destructive Operation Check
    // If it's a destructive action combined with significant trajectory drift (> 0.60) on production or unsanctioned context
    if (riskClass === 'destructive') {
      if (driftScore > 0.60 && (!isStaging || !isMigrationAdmin)) {
        return {
          decision: 'BLOCK',
          reason: 'Destructive action detected after significant trajectory escalation',
          requires_human_confirm: false,
        };
      }

      // If legitimate admin in staging environment, allow human confirmation rather than hard block
      return {
        decision: 'CONFIRM',
        reason: isStaging 
          ? 'Destructive action on staging environment requires human confirmation' 
          : 'Destructive operation requires human sign-off',
        requires_human_confirm: true,
      };
    }

    // 3. Elevated Drift Trajectory Threshold (> 0.75) for non-destructive actions
    if (driftScore > 0.75) {
      return {
        decision: 'CONFIRM',
        reason: `Elevated behavioral drift (${(driftScore * 100).toFixed(0)}%) detected in session trajectory`,
        requires_human_confirm: true,
      };
    }

    // 4. Reversibility Gate (e.g. bulk modifications or schema migrations)
    if (gateResult.requires_confirm) {
      return {
        decision: 'CONFIRM',
        reason: gateResult.reason || 'Action requires human approval',
        requires_human_confirm: true,
      };
    }

    // 5. Default ALLOW
    return {
      decision: 'ALLOW',
      reason: 'Within normal runtime policy and authorized scope limits',
      requires_human_confirm: false,
    };
  }
}
