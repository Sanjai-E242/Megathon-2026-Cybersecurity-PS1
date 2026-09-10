/**
 * Sentinel Runtime - Standalone External Agent Simulator
 * 
 * Demonstrates an autonomous AI agent interacting with external infrastructure
 * through Sentinel Runtime's security middleware.
 * 
 * Usage:
 *   npx tsx external-agent/demoAgent.ts [scenario-a | scenario-b | single]
 */

import { SentinelClient, ExternalAgentAction } from './sentinelClient.js';
import { ProtectedToolExecutor } from './protectedTool.js';

const client = new SentinelClient();
const executor = new ProtectedToolExecutor(client);

// Scenario A: Legitimate Migration Workflow
export async function runLegitimateMigrationScenario() {
  const adminClient = new SentinelClient({
    apiKey: process.env.SENTINEL_ADMIN_API_KEY || 'sentinel_sec_admin_key_demo_01',
  });
  const adminExecutor = new ProtectedToolExecutor(adminClient);

  const sessionId = `sess_external_legit_${Date.now().toString().slice(-4)}`;
  console.log(`\n======================================================`);
  console.log(`  STARTING EXTERNAL AGENT DEMO: LEGITIMATE MIGRATION  `);
  console.log(`  Session ID: ${sessionId} | Principal: admin_migration_01`);
  console.log(`======================================================`);

  const actions: ExternalAgentAction[] = [
    {
      session_id: sessionId,
      principal_id: 'admin_migration_01',
      resource_type: 'file',
      operation: 'read_migration_plan',
      scope_required: 'file.read',
      target: 'migration_plan.md',
    },
    {
      session_id: sessionId,
      principal_id: 'admin_migration_01',
      resource_type: 'database',
      operation: 'create_migration',
      scope_required: 'db.migrate',
      target: 'staging_schema',
    },
    {
      session_id: sessionId,
      principal_id: 'admin_migration_01',
      resource_type: 'database',
      operation: 'update_record',
      scope_required: 'db.write',
      target: 'staging_users',
      metadata: { row_count_estimate: 500 },
    },
    {
      session_id: sessionId,
      principal_id: 'admin_migration_01',
      resource_type: 'database',
      operation: 'delete_table',
      scope_required: 'db.write',
      target: 'staging_backup_table',
      metadata: { row_count_estimate: 100 },
    },
  ];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    console.log(`\n[STEP ${i + 1}/${actions.length}] Agent proposing action: ${act.operation}`);
    const result = await adminExecutor.executeProtectedTool(act);
    
    if (result.status === 'PENDING_CONFIRMATION') {
      console.log(`[HUMAN-IN-THE-LOOP] Sentinel routed action '${act.action_id || act.operation}' to SOC Operator queue.`);
    }

    if (i < actions.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log(`\n======================================================`);
  console.log(`  LEGITIMATE MIGRATION DEMO COMPLETE                  `);
  console.log(`======================================================\n`);
}

// Scenario B: Escalation / Attack Workflow
export async function runEscalationAttackScenario() {
  const userClient = new SentinelClient({
    apiKey: process.env.SENTINEL_USER_API_KEY || 'sentinel_sec_user_key_demo_42',
  });
  const userExecutor = new ProtectedToolExecutor(userClient);

  const sessionId = `sess_external_attack_${Date.now().toString().slice(-4)}`;
  console.log(`\n======================================================`);
  console.log(`  STARTING EXTERNAL AGENT DEMO: ATTACK ESCALATION     `);
  console.log(`  Session ID: ${sessionId} | Principal: user_42`);
  console.log(`======================================================`);

  const actions: ExternalAgentAction[] = [
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'file',
      operation: 'read_file',
      scope_required: 'file.read',
      target: 'config.yaml',
    },
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'database',
      operation: 'list_records',
      scope_required: 'db.read',
      target: 'users',
    },
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'database',
      operation: 'update_record',
      scope_required: 'db.write',
      target: 'users',
    },
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'database',
      operation: 'create_migration',
      scope_required: 'db.migrate',
      target: 'production_schema',
    },
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'database',
      operation: 'update_record',
      scope_required: 'db.write',
      target: 'users_bulk',
      metadata: { row_count_estimate: 500 },
    },
    {
      session_id: sessionId,
      principal_id: 'user_42',
      resource_type: 'database',
      operation: 'delete_table',
      scope_required: 'db.write',
      target: 'orders_prod',
      metadata: { row_count_estimate: 500000 },
    },
  ];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    console.log(`\n[STEP ${i + 1}/${actions.length}] Agent proposing action: ${act.operation}`);
    const result = await userExecutor.executeProtectedTool(act);

    if (result.status === 'BLOCKED') {
      console.log(`[SUCCESSFUL INTERCEPT] High trajectory drift detected. Destructive payload BLOCKED.`);
    }

    if (i < actions.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log(`\n======================================================`);
  console.log(`  ATTACK ESCALATION DEMO COMPLETE                     `);
  console.log(`======================================================\n`);
}

// Single Action Test
export async function runSingleActionTest(operation = 'delete_table', target = 'orders_prod') {
  const sessionId = `sess_external_single_${Date.now().toString().slice(-4)}`;
  console.log(`\n--- Single Action Sentinel Check ---`);
  await executor.executeProtectedTool({
    session_id: sessionId,
    principal_id: 'external-agent-01',
    resource_type: 'database',
    operation,
    scope_required: 'db.write',
    target,
    metadata: { row_count_estimate: 1000 },
  });
}

// CLI Execution Entry Point
async function main() {
  const arg = process.argv[2]?.toLowerCase();
  try {
    if (arg === 'scenario-a' || arg === 'legit') {
      await runLegitimateMigrationScenario();
    } else if (arg === 'scenario-b' || arg === 'attack') {
      await runEscalationAttackScenario();
    } else if (arg === 'single') {
      await runSingleActionTest();
    } else {
      console.log(`Running full Sentinel External Agent demo suite...\n`);
      await runLegitimateMigrationScenario();
      await new Promise((r) => setTimeout(r, 1000));
      await runEscalationAttackScenario();
    }
  } catch (err: any) {
    console.error('[ERROR] Failed running demo agent:', err.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
