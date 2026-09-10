/**
 * Sentinel Runtime - Protected Tool Demo Executor
 * 
 * Demonstrates the core security harness principle:
 * Tools NEVER execute before Sentinel evaluates and permits the action.
 */

import { SentinelClient, ExternalAgentAction, SentinelDecision } from './sentinelClient.js';

export interface ToolExecutionResult {
  status: 'EXECUTED' | 'BLOCKED' | 'PENDING_CONFIRMATION';
  decision: SentinelDecision;
  toolOutput?: Record<string, unknown>;
  message: string;
}

export class ProtectedToolExecutor {
  private client: SentinelClient;

  constructor(client?: SentinelClient) {
    this.client = client || new SentinelClient();
  }

  /**
   * Evaluates the action with Sentinel and executes the protected tool ONLY if permitted.
   */
  async executeProtectedTool(
    action: ExternalAgentAction,
    mockExecutionFn?: () => Promise<Record<string, unknown>>
  ): Promise<ToolExecutionResult> {
    console.log(`\n[AGENT -> SENTINEL] Proposing action: ${action.operation} on target '${action.target}' (Principal: ${action.principal_id})`);

    // 1. Mandatory Sentinel Evaluation Gating
    const decision = await this.client.checkWithSentinel(action);

    console.log(`[SENTINEL -> AGENT] Decision: [${decision.decision}] | Risk: [${decision.risk_class}] | Drift: [${decision.drift_score.toFixed(2)}]`);
    console.log(`[SENTINEL REASON] "${decision.reason}"`);

    // 2. Decision Handling
    if (decision.decision === 'ALLOW' || decision.decision === 'APPROVED') {
      console.log(`>>> [TOOL EXECUTION] PERMITTED: Executing '${action.operation}' on '${action.target}'`);
      
      const toolOutput = mockExecutionFn
        ? await mockExecutionFn()
        : {
            success: true,
            operation: action.operation,
            target: action.target,
            affected_rows: (action.metadata?.row_count_estimate as number) || 1,
            executed_at: new Date().toISOString(),
          };

      return {
        status: 'EXECUTED',
        decision,
        toolOutput,
        message: `Operation '${action.operation}' executed successfully after Sentinel ALLOW clearance.`,
      };
    }

    if (decision.decision === 'CONFIRM') {
      console.warn(`>>> [TOOL EXECUTION] PAUSED: Human approval required by Sentinel SOC policies.`);
      return {
        status: 'PENDING_CONFIRMATION',
        decision,
        message: `Operation '${action.operation}' paused for human confirmation (Action ID: ${decision.action_id}).`,
      };
    }

    // BLOCK or DENIED
    console.error(`>>> [TOOL EXECUTION] INTERCEPTED & BLOCKED: Tool NOT called.`);
    return {
      status: 'BLOCKED',
      decision,
      message: `Operation '${action.operation}' blocked by Sentinel Runtime. Reversible state protected.`,
    };
  }
}
