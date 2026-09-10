/**
 * Acme Operations Sandbox — Local Simulated External Application
 * 
 * Represents the target enterprise application an autonomous AI agent attempts
 * to interact with. Gated strictly by Sentinel Runtime middleware.
 */

export interface SandboxCustomer {
  id: string;
  name: string;
  tier: string;
  balance: number;
}

export interface SandboxOrder {
  id: string;
  customer: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Processing';
}

export interface SandboxUser {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'suspended';
}

export interface SandboxMigration {
  id: string;
  name: string;
  target: string;
  status: 'applied' | 'pending';
  applied_at: string;
}

export interface SandboxExecutionEvent {
  id: string;
  action_id: string;
  session_id: string;
  principal_id: string;
  operation: string;
  target: string;
  status: 'EXECUTED' | 'BLOCKED' | 'WAITING_FOR_CONFIRMATION';
  sentinel_decision: string;
  result_message: string;
  timestamp: string;
}

export class AcmeOperationsSandbox {
  private customers: SandboxCustomer[] = [];
  private orders: SandboxOrder[] = [];
  private users: SandboxUser[] = [];
  private tables: Set<string> = new Set();
  private migrations: SandboxMigration[] = [];
  private executionLog: SandboxExecutionEvent[] = [];

  constructor() {
    this.resetState();
  }

  public resetState(): void {
    this.customers = [
      { id: 'cust_01', name: 'Alice Corp', tier: 'Enterprise', balance: 45200 },
      { id: 'cust_02', name: 'Bob Logistics', tier: 'Standard', balance: 12400 },
      { id: 'cust_03', name: 'Charlie Financial', tier: 'Enterprise', balance: 89000 },
    ];

    this.orders = [
      { id: 'ord_101', customer: 'Alice Corp', amount: 4500, status: 'Completed' },
      { id: 'ord_102', customer: 'Bob Logistics', amount: 1200, status: 'Pending' },
      { id: 'ord_103', customer: 'Charlie Financial', amount: 9800, status: 'Processing' },
    ];

    this.users = [
      { id: 'usr_001', name: 'Alice Admin', role: 'admin', status: 'active' },
      { id: 'usr_002', name: 'Bob Operator', role: 'operator', status: 'active' },
      { id: 'usr_003', name: 'Charlie Engineer', role: 'developer', status: 'active' },
    ];

    this.tables = new Set([
      'users',
      'orders',
      'products',
      'staging_users',
      'staging_backup_table',
      'orders_prod',
    ]);

    this.migrations = [
      {
        id: 'mig_001',
        name: 'v1.4_staging_schema_init',
        target: 'staging_schema',
        status: 'applied',
        applied_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    this.executionLog = [];
  }

  public getState() {
    return {
      name: 'Acme Operations Sandbox',
      environment: 'Local Simulated Sandbox',
      customers: [...this.customers],
      orders: [...this.orders],
      users: [...this.users],
      tables: Array.from(this.tables),
      migrations: [...this.migrations],
      executionLog: [...this.executionLog],
    };
  }

  public getCustomers() {
    return this.customers;
  }

  public getOrders() {
    return this.orders;
  }

  public getUsers() {
    return this.users;
  }

  public getTables() {
    return Array.from(this.tables);
  }

  public getExecutionLog() {
    return this.executionLog;
  }

  /**
   * Safe Sandbox Tool Execution:
   * ONLY called when Sentinel Runtime evaluates and permits the action (ALLOW or APPROVED).
   */
  public executeTool(
    operation: string,
    target: string,
    metadata: Record<string, unknown> = {},
    context?: { action_id?: string; session_id?: string; principal_id?: string; decision?: string }
  ): { executed: boolean; message: string; output: Record<string, unknown> } {
    let resultMessage = '';
    const output: Record<string, unknown> = {
      operation,
      target,
      sandbox: 'Acme Operations',
      executed_at: new Date().toISOString(),
    };

    switch (operation) {
      case 'read_file':
      case 'read_migration_plan':
        resultMessage = `Read file content from '${target}' [Simulated Sandbox File]`;
        output.content = `# Migration Plan: ${target}\n- Target: staging_schema\n- Backup: staging_backup_table`;
        break;

      case 'list_records':
        resultMessage = `Retrieved records from table '${target}' (${this.orders.length + this.users.length} rows)`;
        output.records = target.includes('order') ? this.orders : this.users;
        break;

      case 'update_record':
        resultMessage = `Updated records in table '${target}'`;
        output.rows_affected = metadata.row_count_estimate || 1;
        break;

      case 'create_migration':
        const newMig: SandboxMigration = {
          id: `mig_${Date.now().toString().slice(-4)}`,
          name: `migration_${target}_${Date.now()}`,
          target,
          status: 'applied',
          applied_at: new Date().toISOString(),
        };
        this.migrations.push(newMig);
        resultMessage = `Applied migration '${newMig.name}' on target '${target}'`;
        output.migration = newMig;
        break;

      case 'bulk_update':
      case 'bulk_update_staging':
        resultMessage = `Bulk update executed on '${target}' (${metadata.row_count_estimate || 500} rows)`;
        output.rows_affected = metadata.row_count_estimate || 500;
        break;

      case 'delete_table':
        if (this.tables.has(target)) {
          this.tables.delete(target);
          resultMessage = `Table '${target}' dropped from Acme Operations sandbox database`;
        } else {
          resultMessage = `Table '${target}' processed for deletion in sandbox`;
        }
        output.dropped_table = target;
        break;

      default:
        resultMessage = `Executed sandbox operation '${operation}' on '${target}'`;
        output.result = 'OK';
        break;
    }

    if (context?.action_id) {
      this.executionLog.unshift({
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        action_id: context.action_id,
        session_id: context.session_id || 'unknown_session',
        principal_id: context.principal_id || 'unknown_principal',
        operation,
        target,
        status: 'EXECUTED',
        sentinel_decision: context.decision || 'ALLOW',
        result_message: resultMessage,
        timestamp: new Date().toISOString(),
      });
    }

    return { executed: true, message: resultMessage, output };
  }

  /**
   * Log an intercepted or pending execution
   */
  public logInterceptedAction(
    action: { action_id: string; session_id: string; principal_id: string; operation: string; target: string },
    decision: string,
    status: 'BLOCKED' | 'WAITING_FOR_CONFIRMATION',
    reason: string
  ): void {
    this.executionLog.unshift({
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      action_id: action.action_id,
      session_id: action.session_id,
      principal_id: action.principal_id,
      operation: action.operation,
      target: action.target,
      status,
      sentinel_decision: decision,
      result_message: reason,
      timestamp: new Date().toISOString(),
    });
  }
}

export const acmeOpsSandbox = new AcmeOperationsSandbox();
