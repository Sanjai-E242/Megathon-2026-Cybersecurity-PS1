import { Action, GateResult, RiskLevel } from './types.js';

export const DEFAULT_RISK_TABLE: Record<string, RiskLevel> = {
  read_file: 'read',
  list_records: 'read',
  read_migration_plan: 'read',
  read_plan: 'read',
  get_status: 'read',
  fetch_config: 'read',
  get_repository: 'read',
  list_issues: 'read',
  send_email: 'write',
  update_record: 'write',
  create_migration: 'write',
  create_staging_migration: 'write',
  insert_record: 'write',
  bulk_update: 'write',
  bulk_update_staging: 'write',
  create_issue: 'write',
  add_comment: 'write',
  delete_table: 'destructive',
  drop_database: 'destructive',
  delete_staging_backup: 'destructive',
  transfer_funds: 'destructive',
  revoke_all_access: 'destructive',
  flush_redis: 'destructive',
  delete_repository: 'destructive',
};

export class RiskClassifier {
  private policies: Map<string, RiskLevel>;

  constructor(initialPolicies?: Record<string, RiskLevel>) {
    this.policies = new Map(Object.entries(initialPolicies || DEFAULT_RISK_TABLE));
  }

  public classifyRisk(operation: string): RiskLevel {
    const normalized = operation.toLowerCase().trim();
    return this.policies.get(normalized) || 'unknown';
  }

  public evaluateGate(action: Action, riskClass: RiskLevel): GateResult {
    // Destructive actions inherently require human confirmation/gating
    if (riskClass === 'destructive') {
      return {
        requires_confirm: true,
        reason: 'Destructive operation requires human sign-off',
      };
    }

    // High impact bulk writes can also trigger confirmation
    const rowCount = action.metadata?.row_count_estimate as number | undefined;
    if (rowCount && rowCount >= 500 && riskClass === 'write') {
      return {
        requires_confirm: true,
        reason: `High-volume write operation (${rowCount} rows affected) requires sign-off`,
      };
    }

    return {
      requires_confirm: false,
    };
  }

  public getPolicies(): Record<string, RiskLevel> {
    return Object.fromEntries(this.policies.entries());
  }

  public updatePolicy(operation: string, riskLevel: RiskLevel): void {
    this.policies.set(operation.toLowerCase().trim(), riskLevel);
  }

  public deletePolicy(operation: string): boolean {
    return this.policies.delete(operation.toLowerCase().trim());
  }
}
