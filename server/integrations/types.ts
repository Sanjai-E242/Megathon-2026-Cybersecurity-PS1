import { Action, DecisionResult } from '../engine/types.js';

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  configured: boolean;
  targetInfo: {
    owner?: string;
    repo?: string;
    environment?: string;
    [key: string]: any;
  };
  reason?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  output: any;
  message: string;
  status?: number;
  error?: string;
}

export interface ExternalIntegrationAdapter {
  readonly id: string;
  readonly name: string;
  getStatus(): Promise<IntegrationStatus> | IntegrationStatus;
  executeTool(
    toolName: string,
    target: string,
    params?: Record<string, unknown>,
    context?: {
      action_id: string;
      session_id: string;
      principal_id: string;
      decision: string;
    }
  ): Promise<ToolExecutionResult>;
}
