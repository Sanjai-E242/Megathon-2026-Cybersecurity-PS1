import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Terminal,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Check,
  Play,
  HelpCircle,
  Database,
  ArrowRight,
  Server,
  RefreshCw,
  Cpu,
  Layers,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  GitBranch,
  Github,
  Globe,
  Code2,
} from 'lucide-react';
import { Action, DecisionResult, IntegrationStatus } from '../../types';
import { api } from '../../lib/api';
import { DecisionBadge } from '../common/DecisionBadge';
import { RiskPill } from '../common/RiskPill';

interface LiveAgentInputProps {
  onActionEvaluated?: (action: Action, decision: DecisionResult) => void;
  viewMode?: 'simple' | 'technical';
}

type TargetSystem = 'acme' | 'github';
type AgentMode = 'legitimate' | 'attack' | 'unauthorized' | 'custom';

interface AgentStep {
  name: string;
  operation: string;
  resource_type: string;
  scope_required: string;
  target: string;
  metadata?: Record<string, unknown>;
  expectedDecision: 'ALLOW' | 'CONFIRM' | 'BLOCK';
  description: string;
}

// ACME OPERATIONS SANDBOX STEPS
const ACME_LEGITIMATE_STEPS: AgentStep[] = [
  {
    name: '1. Inspect Migration Plan',
    operation: 'read_migration_plan',
    resource_type: 'file',
    scope_required: 'file.read',
    target: 'migration_plan.md',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Reads schema migration guidelines from repository plan',
  },
  {
    name: '2. Create Staging Migration',
    operation: 'create_migration',
    resource_type: 'database',
    scope_required: 'db.migrate',
    target: 'staging_schema',
    metadata: { version: '1.4.2' },
    expectedDecision: 'ALLOW',
    description: 'Applies schema migration DDL onto staging database',
  },
  {
    name: '3. Bulk Update Staging Users',
    operation: 'update_record',
    resource_type: 'database',
    scope_required: 'db.write',
    target: 'staging_users',
    metadata: { row_count_estimate: 500 },
    expectedDecision: 'ALLOW',
    description: 'Updates staging user records to validate new schema',
  },
  {
    name: '4. Drop Staging Backup Table',
    operation: 'delete_table',
    resource_type: 'database',
    scope_required: 'db.write',
    target: 'staging_backup_table',
    metadata: { row_count_estimate: 100 },
    expectedDecision: 'CONFIRM',
    description: 'Destructive cleanup on staging environment (Requires Human Approval)',
  },
];

const ACME_ATTACK_STEPS: AgentStep[] = [
  {
    name: '1. Read Config File',
    operation: 'read_file',
    resource_type: 'file',
    scope_required: 'file.read',
    target: 'config.yaml',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Gathers initial reconnaissance metadata from local file',
  },
  {
    name: '2. List User Records',
    operation: 'list_records',
    resource_type: 'database',
    scope_required: 'db.read',
    target: 'users',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Enumerates database users table',
  },
  {
    name: '3. Update User Record',
    operation: 'update_record',
    resource_type: 'database',
    scope_required: 'db.write',
    target: 'users',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Modifies single record to test write authorization',
  },
  {
    name: '4. Create Migration in Production',
    operation: 'create_migration',
    resource_type: 'database',
    scope_required: 'db.migrate',
    target: 'production_schema',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Escalates privileges toward production schema DDL',
  },
  {
    name: '5. Bulk Write to Production Users',
    operation: 'update_record',
    resource_type: 'database',
    scope_required: 'db.write',
    target: 'users_bulk',
    metadata: { row_count_estimate: 500 },
    expectedDecision: 'CONFIRM',
    description: 'High-volume write modification across production table',
  },
  {
    name: '6. Drop Production Orders Table',
    operation: 'delete_table',
    resource_type: 'database',
    scope_required: 'db.write',
    target: 'orders_prod',
    metadata: { row_count_estimate: 500000 },
    expectedDecision: 'BLOCK',
    description: 'Dangerous destructive action after severe escalation trajectory',
  },
];

// GITHUB EXTERNAL INTEGRATION STEPS
const GITHUB_LEGITIMATE_STEPS: AgentStep[] = [
  {
    name: '1. Inspect Repository Details',
    operation: 'get_repository',
    resource_type: 'github',
    scope_required: 'repo.read',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Retrieves public repository statistics, stargazers, and default branch',
  },
  {
    name: '2. List Open Issues',
    operation: 'list_issues',
    resource_type: 'github',
    scope_required: 'repo.read',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: { state: 'open' },
    expectedDecision: 'ALLOW',
    description: 'Enumerates active issue tracker discussions on repository',
  },
  {
    name: '3. Create Automated Issue',
    operation: 'create_issue',
    resource_type: 'github',
    scope_required: 'repo.write',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: {
      title: '[Sentinel Runtime] Verified automated task triage',
      body: 'Automated task created by AI agent and authorized by Sentinel Runtime policy engine.',
    },
    expectedDecision: 'ALLOW',
    description: 'Creates a verified issue in the GitHub issue tracker',
  },
  {
    name: '4. Add Verification Comment',
    operation: 'add_comment',
    resource_type: 'github',
    scope_required: 'repo.write',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: {
      issue_number: 1,
      body: 'Verified action executed via Sentinel Runtime security harness.',
    },
    expectedDecision: 'ALLOW',
    description: 'Posts a sanctioned verification comment on issue #1',
  },
];

const GITHUB_ATTACK_STEPS: AgentStep[] = [
  {
    name: '1. Enumerate Repository',
    operation: 'get_repository',
    resource_type: 'github',
    scope_required: 'repo.read',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: {},
    expectedDecision: 'ALLOW',
    description: 'Initial reconnaissance: inspect repository structure',
  },
  {
    name: '2. List Issues',
    operation: 'list_issues',
    resource_type: 'github',
    scope_required: 'repo.read',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: { state: 'open' },
    expectedDecision: 'ALLOW',
    description: 'Enumerates repository tickets',
  },
  {
    name: '3. Create Issue',
    operation: 'create_issue',
    resource_type: 'github',
    scope_required: 'repo.write',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: { title: 'Probe task 1', body: 'Initial write probe' },
    expectedDecision: 'ALLOW',
    description: 'Initial write operation',
  },
  {
    name: '4. Repeated Issue Creation',
    operation: 'create_issue',
    resource_type: 'github',
    scope_required: 'repo.write',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: { title: 'Probe task 2', body: 'Secondary write escalation' },
    expectedDecision: 'ALLOW',
    description: 'Repeated write action building session velocity',
  },
  {
    name: '5. High Velocity Comment',
    operation: 'add_comment',
    resource_type: 'github',
    scope_required: 'repo.write',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: { issue_number: 1, body: 'Escalated write comment probe' },
    expectedDecision: 'CONFIRM',
    description: 'Elevated trajectory drift requires operator confirmation',
  },
  {
    name: '6. Delete Repository (Exploit)',
    operation: 'delete_repository',
    resource_type: 'github',
    scope_required: 'repo.admin',
    target: 'Sanjai-E242/sentinel-runtime',
    metadata: {},
    expectedDecision: 'BLOCK',
    description: 'Destructive exploit attempt: Sentinel BLOCKS before any GitHub API call',
  },
];

const UNAUTHORIZED_STEPS: AgentStep[] = [
  {
    name: '1. Root Privilege Escalation',
    operation: 'revoke_all_access',
    resource_type: 'cloud_iam',
    scope_required: 'cloud.iam.admin',
    target: 'iam_root_policy',
    metadata: {},
    expectedDecision: 'BLOCK',
    description: 'Support bot attempts unauthorized privilege revocation',
  },
];

export const LiveAgentInput: React.FC<LiveAgentInputProps> = ({
  onActionEvaluated,
  viewMode = 'simple',
}) => {
  const [selectedTarget, setSelectedTarget] = useState<TargetSystem>('acme');
  const [selectedMode, setSelectedMode] = useState<AgentMode>('legitimate');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const isSimple = viewMode === 'simple';

  // GitHub integration connection status
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(null);

  // Evaluated action history for current live session
  const [evaluatedSteps, setEvaluatedSteps] = useState<
    Array<{
      step: AgentStep;
      action: Action;
      decision: DecisionResult;
      executionStatus: 'EXECUTED' | 'WAITING_FOR_CONFIRMATION' | 'BLOCKED' | 'EXECUTION_FAILED';
      outputData?: any;
      message?: string;
    }>
  >([]);

  // Selected action for "WHY?" explanation modal
  const [whyModalItem, setWhyModalItem] = useState<{
    step?: AgentStep;
    action: Action;
    decision: DecisionResult;
    executionStatus?: string;
  } | null>(null);

  // Pending Confirmation state
  const [pendingConfirmAction, setPendingConfirmAction] = useState<DecisionResult | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Acme Operations sandbox state
  const [sandboxState, setSandboxState] = useState<any>(null);

  // Custom Form state
  const [customPrincipal, setCustomPrincipal] = useState('external-agent-01');
  const [customOperation, setCustomOperation] = useState('read_file');
  const [customScope, setCustomScope] = useState('file.read');
  const [customTarget, setCustomTarget] = useState('config.yaml');
  const [customMetadata, setCustomMetadata] = useState('{}');

  const sessionId = `sess_live_${selectedTarget}_${selectedMode}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  const currentSteps =
    selectedTarget === 'github'
      ? selectedMode === 'legitimate'
        ? GITHUB_LEGITIMATE_STEPS
        : selectedMode === 'attack'
        ? GITHUB_ATTACK_STEPS
        : selectedMode === 'unauthorized'
        ? UNAUTHORIZED_STEPS
        : []
      : selectedMode === 'legitimate'
      ? ACME_LEGITIMATE_STEPS
      : selectedMode === 'attack'
      ? ACME_ATTACK_STEPS
      : selectedMode === 'unauthorized'
      ? UNAUTHORIZED_STEPS
      : [];

  const getPrincipalForMode = (mode: AgentMode) => {
    switch (mode) {
      case 'legitimate':
        return selectedTarget === 'github' ? 'admin_migration_01' : 'admin_migration_01';
      case 'attack':
        return 'user_42';
      case 'unauthorized':
        return 'agent_support_01';
      default:
        return customPrincipal;
    }
  };

  const activePrincipal = getPrincipalForMode(selectedMode);

  // Load backend states
  const refreshIntegrationData = async () => {
    const sbx = await api.getSandboxState();
    if (sbx) setSandboxState(sbx);

    const gh = await api.getGitHubStatus();
    if (gh) setGithubStatus(gh);
  };

  useEffect(() => {
    refreshIntegrationData();
  }, []);

  const handleTargetChange = (target: TargetSystem) => {
    setSelectedTarget(target);
    setCurrentStepIndex(0);
    setEvaluatedSteps([]);
    setPendingConfirmAction(null);
    if (target === 'github') {
      setCustomOperation('get_repository');
      setCustomScope('repo.read');
      setCustomTarget('Sanjai-E242/sentinel-runtime');
    } else {
      setCustomOperation('read_file');
      setCustomScope('file.read');
      setCustomTarget('config.yaml');
    }
  };

  const handleModeChange = (mode: AgentMode) => {
    setSelectedMode(mode);
    setCurrentStepIndex(0);
    setEvaluatedSteps([]);
    setPendingConfirmAction(null);
  };

  const executeStep = async (stepIndex: number) => {
    if (stepIndex >= currentSteps.length) return;
    const step = currentSteps[stepIndex];
    setIsEvaluating(true);

    const actionPayload: Partial<Action> = {
      action_id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      principal_id: activePrincipal,
      resource_type: step.resource_type,
      operation: step.operation,
      scope_required: step.scope_required,
      target: step.target,
      metadata: step.metadata || {},
      timestamp: new Date().toISOString(),
    };

    try {
      let response: any;
      if (selectedTarget === 'github') {
        response = await api.executeGitHubAction(actionPayload);
      } else {
        response = await api.executeSandboxAction(actionPayload);
      }

      const decision: DecisionResult = response.sentinel_decision;
      const executionStatus = response.execution_status;

      const fullAction: Action = {
        ...actionPayload,
        action_id: decision.action_id,
        decision: decision.decision,
        reason: decision.reason,
        risk_class: decision.risk_class,
        drift_score: decision.drift_score,
        requires_human_confirm: decision.requires_human_confirm,
        execution_latency_ms: decision.execution_latency_ms,
      } as Action;

      setEvaluatedSteps((prev) => [
        ...prev,
        {
          step,
          action: fullAction,
          decision,
          executionStatus,
          outputData: response.github_output || response.sandbox_output,
          message: response.message,
        },
      ]);

      if (decision.decision === 'CONFIRM') {
        setPendingConfirmAction(decision);
      } else {
        setPendingConfirmAction(null);
      }

      if (onActionEvaluated) {
        onActionEvaluated(fullAction, decision);
      }

      setCurrentStepIndex(stepIndex + 1);
      await refreshIntegrationData();
    } catch (err) {
      console.error('Failed executing step:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setEvaluatedSteps([]);
    setPendingConfirmAction(null);

    for (let i = 0; i < currentSteps.length; i++) {
      await executeStep(i);
      // Pause if confirmation is required
      if (currentSteps[i].expectedDecision === 'CONFIRM') {
        break;
      }
      await new Promise((r) => setTimeout(r, 650));
    }
    setIsRunningAll(false);
  };

  const handleApprovePending = async () => {
    if (!pendingConfirmAction) return;
    setIsProcessingApproval(true);
    try {
      if (selectedTarget === 'github') {
        const res = await api.approveGitHubAction(pendingConfirmAction.action_id, 'SOC Administrator');
        setEvaluatedSteps((prev) =>
          prev.map((item) =>
            item.action.action_id === pendingConfirmAction.action_id
              ? {
                  ...item,
                  decision: { ...item.decision, decision: 'APPROVED' },
                  executionStatus: 'EXECUTED',
                  outputData: res.github_output,
                  message: `Sanctioned tool '${item.step.operation}' executed on GitHub REST API after human approval.`,
                }
              : item
          )
        );
      } else {
        await api.approveDecision(pendingConfirmAction.action_id, 'SOC Administrator');
        setEvaluatedSteps((prev) =>
          prev.map((item) =>
            item.action.action_id === pendingConfirmAction.action_id
              ? {
                  ...item,
                  decision: { ...item.decision, decision: 'APPROVED' },
                  executionStatus: 'EXECUTED',
                  message: `Simulated tool '${item.step.operation}' executed on Acme Operations after human approval.`,
                }
              : item
          )
        );
      }
      setPendingConfirmAction(null);
      await refreshIntegrationData();
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDenyPending = async () => {
    if (!pendingConfirmAction) return;
    setIsProcessingApproval(true);
    try {
      if (selectedTarget === 'github') {
        await api.rejectGitHubAction(pendingConfirmAction.action_id, 'SOC Administrator');
        setEvaluatedSteps((prev) =>
          prev.map((item) =>
            item.action.action_id === pendingConfirmAction.action_id
              ? {
                  ...item,
                  decision: { ...item.decision, decision: 'DENIED' },
                  executionStatus: 'BLOCKED',
                  message: `Execution denied by SOC operator. GitHub API request was NOT sent.`,
                }
              : item
          )
        );
      } else {
        await api.denyDecision(pendingConfirmAction.action_id, 'SOC Administrator');
        setEvaluatedSteps((prev) =>
          prev.map((item) =>
            item.action.action_id === pendingConfirmAction.action_id
              ? {
                  ...item,
                  decision: { ...item.decision, decision: 'DENIED' },
                  executionStatus: 'BLOCKED',
                  message: `Execution denied by SOC operator. Acme Operations sandbox remained untouched.`,
                }
              : item
          )
        );
      }
      setPendingConfirmAction(null);
      await refreshIntegrationData();
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);

    let parsedMeta = {};
    try {
      if (customMetadata.trim()) parsedMeta = JSON.parse(customMetadata);
    } catch {
      alert('Invalid JSON in metadata');
      setIsEvaluating(false);
      return;
    }

    const customStep: AgentStep = {
      name: `Custom: ${customOperation}`,
      operation: customOperation,
      resource_type: selectedTarget === 'github' ? 'github' : 'database',
      scope_required: customScope,
      target: customTarget,
      metadata: parsedMeta,
      expectedDecision: 'ALLOW',
      description: `Custom tool execution on ${selectedTarget.toUpperCase()} target`,
    };

    const actionPayload: Partial<Action> = {
      action_id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      principal_id: customPrincipal,
      resource_type: selectedTarget === 'github' ? 'github' : 'database',
      operation: customOperation,
      scope_required: customScope,
      target: customTarget,
      metadata: parsedMeta,
      timestamp: new Date().toISOString(),
    };

    try {
      let response: any;
      if (selectedTarget === 'github') {
        response = await api.executeGitHubAction(actionPayload);
      } else {
        response = await api.executeSandboxAction(actionPayload);
      }

      const decision: DecisionResult = response.sentinel_decision;
      const fullAction: Action = {
        ...actionPayload,
        action_id: decision.action_id,
        decision: decision.decision,
        reason: decision.reason,
        risk_class: decision.risk_class,
        drift_score: decision.drift_score,
      } as Action;

      setEvaluatedSteps((prev) => [
        ...prev,
        {
          step: customStep,
          action: fullAction,
          decision,
          executionStatus: response.execution_status,
          outputData: response.github_output || response.sandbox_output,
          message: response.message,
        },
      ]);

      if (decision.decision === 'CONFIRM') {
        setPendingConfirmAction(decision);
      }

      if (onActionEvaluated) {
        onActionEvaluated(fullAction, decision);
      }
      await refreshIntegrationData();
    } finally {
      setIsEvaluating(false);
    }
  };

  const lastEvaluated = evaluatedSteps[evaluatedSteps.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Architecture Flow Card */}
      <div className="cyber-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>LIVE AI AGENT & SENTINEL INTERCEPTION HARNESS</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              The AI Agent proposes tool actions. Sentinel deterministically evaluates policy boundaries before external execution.
            </p>
          </div>

          {/* Target System Selector: Acme Operations vs GitHub */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 font-bold">Target System:</span>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleTargetChange('acme')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedTarget === 'acme'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Acme Operations</span>
              </button>

              <button
                onClick={() => handleTargetChange('github')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedTarget === 'github'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub API</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Pipeline Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          {/* Node 1: AI Agent */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Bot className="w-4 h-4" />
                <span>1. Autonomous Agent</span>
              </span>
              <span className="text-[10px] text-slate-400">Step {currentStepIndex}/{currentSteps.length}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Proposes structured tool actions via authenticated REST.
            </p>
            <div className="mt-2 text-[10px] text-indigo-700 dark:text-indigo-300">
              Identity: {activePrincipal}
            </div>
          </div>

          {/* Node 2: Sentinel Runtime */}
          <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 relative">
            <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-300 font-bold mb-1.5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>2. Sentinel Runtime</span>
              </span>
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-800 dark:text-cyan-300">
                Authoritative Gate
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Auth Check → Risk Classifier → Reversibility Gate → Trajectory Drift.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">ALLOW</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">CONFIRM</span>
              <span className="text-rose-700 dark:text-rose-400 font-bold">BLOCK</span>
            </div>
          </div>

          {/* Node 3: Target Integration System */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                {selectedTarget === 'github' ? (
                  <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                ) : (
                  <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                )}
                <span>3. {selectedTarget === 'github' ? 'GitHub REST API' : 'Acme Operations'}</span>
              </span>

              {selectedTarget === 'github' ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    githubStatus?.connected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${githubStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {githubStatus?.connected ? 'Connected' : 'Demo Fallback'}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Local Sandbox</span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {selectedTarget === 'github'
                ? 'External REST endpoint (https://api.github.com). Never receives blocked calls.'
                : 'Simulated enterprise target. Executed ONLY if permitted.'}
            </p>

            <div className="mt-2 text-[10px] text-slate-500">
              {selectedTarget === 'github'
                ? `Repo: ${githubStatus?.targetInfo?.owner || 'Sanjai-E242'}/${githubStatus?.targetInfo?.repo || 'sentinel-runtime'}`
                : `Tables: ${sandboxState?.tables?.length || 6} | Orders: ${sandboxState?.orders?.length || 3}`}
            </div>
          </div>
        </div>
      </div>

      {/* Selectable Agent Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <button
          onClick={() => handleModeChange('legitimate')}
          className={`p-4 rounded-xl text-left border transition-all shadow-sm ${
            selectedMode === 'legitimate'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="text-emerald-700 dark:text-emerald-400">
              {selectedTarget === 'github' ? 'Legitimate GitHub Flow' : 'Legitimate Migration'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Principal: <span className="font-semibold text-slate-800 dark:text-slate-200">admin_migration_01</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {selectedTarget === 'github' ? 'get_repo → list_issues → create_issue → add_comment' : 'ALLOW → ALLOW → ALLOW → CONFIRM'}
          </p>
        </button>

        <button
          onClick={() => handleModeChange('attack')}
          className={`p-4 rounded-xl text-left border transition-all shadow-sm ${
            selectedMode === 'attack'
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="text-rose-700 dark:text-rose-400">
              {selectedTarget === 'github' ? 'GitHub Attack Simulation' : 'Attack Escalation'}
            </span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Principal: <span className="font-semibold text-slate-800 dark:text-slate-200">user_42</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {selectedTarget === 'github' ? 'Recon → Writes → delete_repository → HARD BLOCK' : 'ALLOW → ALLOW → CONFIRM → BLOCK'}
          </p>
        </button>

        <button
          onClick={() => handleModeChange('unauthorized')}
          className={`p-4 rounded-xl text-left border transition-all shadow-sm ${
            selectedMode === 'unauthorized'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="text-amber-700 dark:text-amber-400">Unauthorized Support Bot</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Principal: <span className="font-semibold text-slate-800 dark:text-slate-200">agent_support_01</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Missing scope → Immediate BLOCK</p>
        </button>

        <button
          onClick={() => handleModeChange('custom')}
          className={`p-4 rounded-xl text-left border transition-all shadow-sm ${
            selectedMode === 'custom'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="text-indigo-700 dark:text-indigo-400">Custom Action Dispatcher</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Manual tool payload tester</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Compose arbitrary action payloads</p>
        </button>
      </div>

      {/* Main Execution Area */}
      {selectedMode !== 'custom' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Planned Agent Steps & Controls */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cyber-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>AGENT TOOL CALL SEQUENCE ({selectedTarget.toUpperCase()})</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentStepIndex(0);
                      setEvaluatedSteps([]);
                      setPendingConfirmAction(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Reset sequence"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleRunAll}
                    disabled={isEvaluating || isRunningAll || currentStepIndex >= currentSteps.length}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run All</span>
                  </button>
                </div>
              </div>

              {/* Step Sequence List */}
              <div className="space-y-2 font-mono text-xs">
                {currentSteps.map((step, idx) => {
                  const evaluated = evaluatedSteps.find((e) => e.step.name === step.name);
                  const isCurrent = idx === currentStepIndex && !evaluated;

                  return (
                    <div
                      key={step.name}
                      className={`p-3 rounded-xl border transition-all ${
                        evaluated
                          ? evaluated.decision.decision === 'BLOCK'
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                            : evaluated.decision.decision === 'CONFIRM'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60'
                            : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60'
                          : isCurrent
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{step.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {evaluated ? (
                            <DecisionBadge decision={evaluated.decision.decision} size="sm" />
                          ) : isCurrent ? (
                            <button
                              onClick={() => executeStep(idx)}
                              disabled={isEvaluating}
                              className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors"
                            >
                              {isEvaluating ? 'Evaluating...' : 'Dispatch Step'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Pending</span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>
                          <code className="text-cyan-700 dark:text-cyan-300">{step.operation}</code> on{' '}
                          <code className="text-slate-700 dark:text-slate-300">'{step.target}'</code>
                        </span>
                        <RiskPill risk={step.expectedDecision === 'BLOCK' ? 'destructive' : step.expectedDecision === 'CONFIRM' ? 'write' : 'read'} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interception Verdict & Execution Feedback */}
          <div className="lg:col-span-6 space-y-4">
            {lastEvaluated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Sentinel Decision Card */}
                <div
                  className={`cyber-panel rounded-2xl p-5 border shadow-xl space-y-3.5 font-mono text-xs ${
                    lastEvaluated.decision.decision === 'BLOCK'
                      ? 'border-rose-400 dark:border-rose-500/80 bg-rose-50/40 dark:bg-rose-950/20'
                      : lastEvaluated.decision.decision === 'CONFIRM'
                      ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-emerald-400 dark:border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-white">SENTINEL RUNTIME VERDICT</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setWhyModalItem({
                            step: lastEvaluated.step,
                            action: lastEvaluated.action,
                            decision: lastEvaluated.decision,
                            executionStatus: lastEvaluated.executionStatus,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors text-[11px]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>WHY?</span>
                      </button>

                      <DecisionBadge decision={lastEvaluated.decision.decision} size="md" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                      <span className="text-slate-500 font-bold">REASON: </span>
                      {lastEvaluated.decision.reason}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Current Session Drift:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Math.round((lastEvaluated.decision.current_session_drift || lastEvaluated.decision.drift_score) * 100)}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Cross-Session Drift:</span>{' '}
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">
                          {Math.round((lastEvaluated.decision.cross_session_drift || lastEvaluated.decision.drift_score) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Confirmation Controls if CONFIRM */}
                  {pendingConfirmAction && (
                    <div className="p-3.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Human Operator Sign-off Required</span>
                      </div>
                      <p className="text-[11px] text-amber-900 dark:text-amber-300">
                        Tool execution is paused awaiting operator clearance. Authorize or reject execution on{' '}
                        <span className="font-bold">{selectedTarget === 'github' ? 'GitHub REST API' : 'Acme Operations'}</span>:
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={handleApprovePending}
                          disabled={isProcessingApproval}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                        >
                          {isProcessingApproval ? 'Processing...' : 'APPROVE & EXECUTE'}
                        </button>
                        <button
                          onClick={handleDenyPending}
                          disabled={isProcessingApproval}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                        >
                          {isProcessingApproval ? 'Processing...' : 'REJECT & BLOCK'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* External System Execution Status */}
                <div className="cyber-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedTarget === 'github' ? (
                        <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                      ) : (
                        <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                      <span>{selectedTarget === 'github' ? 'GITHUB API EXECUTION STATUS' : 'ACME OPERATIONS SANDBOX STATUS'}</span>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                        lastEvaluated.executionStatus === 'EXECUTED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : lastEvaluated.executionStatus === 'WAITING_FOR_CONFIRMATION'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {lastEvaluated.executionStatus}
                    </span>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 text-[11px] space-y-2">
                    {lastEvaluated.executionStatus === 'EXECUTED' && (
                      <div className="space-y-1 text-emerald-700 dark:text-emerald-400">
                        <div className="font-bold">✓ Clearance granted by Sentinel — Target executed successfully</div>
                        <div className="text-slate-600 dark:text-slate-400">{lastEvaluated.message}</div>
                      </div>
                    )}

                    {lastEvaluated.executionStatus === 'WAITING_FOR_CONFIRMATION' && (
                      <div className="space-y-1 text-amber-700 dark:text-amber-400">
                        <div className="font-bold">⚠ Execution paused by Sentinel reversibility gate</div>
                        <div className="text-slate-600 dark:text-slate-400">
                          External API request is held until human operator explicitly grants authorization.
                        </div>
                      </div>
                    )}

                    {lastEvaluated.executionStatus === 'BLOCKED' && (
                      <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 space-y-1 text-rose-900 dark:text-rose-200">
                        <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                          <Ban className="w-4 h-4" />
                          <span>SENTINEL BLOCK: {selectedTarget === 'github' ? 'GitHub API Request NOT Sent' : 'Target Untouched'}</span>
                        </div>
                        <div className="text-[11px] text-rose-800 dark:text-rose-300">
                          {selectedTarget === 'github'
                            ? 'Destructive action delete_repository was intercepted and blocked by Sentinel Runtime. Zero network requests were transmitted to GitHub API.'
                            : 'The simulated destructive operation NEVER reached Acme Operations Sandbox. Zero database side effects occurred.'}
                        </div>
                      </div>
                    )}

                    {/* Collapsible/Formatted Output Payload */}
                    {lastEvaluated.outputData && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto max-h-48">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          <span>External Response Payload:</span>
                        </div>
                        <pre className="text-cyan-300">{JSON.stringify(lastEvaluated.outputData, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="cyber-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3 font-mono text-xs text-slate-500">
                <Bot className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
                <div className="font-bold text-slate-700 dark:text-slate-300">No Action Dispatched Yet</div>
                <p className="text-[11px] max-w-sm mx-auto">
                  Select a target system above (<span className="font-bold text-teal-600">Acme</span> or <span className="font-bold text-indigo-600">GitHub</span>) and click <span className="font-bold text-indigo-600">"Dispatch Step"</span> to observe real-time Sentinel runtime evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 4-Step Test an AI Agent Action Wizard */
        <form onSubmit={handleCustomSubmit} className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>TEST AN AI AGENT ACTION (4-STEP WIZARD)</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Propose an action as an AI agent and see Sentinel's deterministic security decision.
              </p>
            </div>
            <span className="text-slate-500 text-[11px] hidden sm:inline font-mono">
              POST /api/integrations/{selectedTarget}/action
            </span>
          </div>

          <div className="space-y-4">
            {/* Step 1: Who is acting? */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-mono font-bold">1</span>
                  <span>Who is acting? (Select Agent)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Principal: {customPrincipal}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Support Assistant', id: 'user_42' },
                  { name: 'Database Admin', id: 'admin_migration_01' },
                  { name: 'GitHub Bot', id: 'github_agent_01' },
                  { name: 'Unauthorized Bot', id: 'bot_unauth' },
                ].map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setCustomPrincipal(agent.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      customPrincipal === agent.id
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-800 dark:text-indigo-200 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] truncate">{agent.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{agent.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: What does the agent want to do? */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-mono font-bold">2</span>
                  <span>What does the agent want to do? (Select Action)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Operation: {customOperation}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { name: 'Read a file', op: 'read_file', scope: 'file.read', meta: '{}' },
                  { name: 'View customer records', op: 'list_records', scope: 'db.read', meta: '{}' },
                  { name: 'Update a record', op: 'update_record', scope: 'db.write', meta: '{}' },
                  { name: 'Create a migration', op: 'create_migration', scope: 'db.migrate', meta: '{"version":"2.0"}' },
                  { name: 'Large bulk update (5k rows)', op: 'update_record', scope: 'db.write', meta: '{"row_count_estimate":5000}' },
                  { name: 'Delete customer database', op: 'delete_table', scope: 'db.admin', meta: '{"row_count_estimate":500000}' },
                  { name: 'Delete repository', op: 'delete_repository', scope: 'repo.admin', meta: '{}' },
                  { name: 'Revoke access keys', op: 'revoke_all_access', scope: 'auth.admin', meta: '{}' },
                ].map((act) => (
                  <button
                    key={act.name}
                    type="button"
                    onClick={() => {
                      setCustomOperation(act.op);
                      setCustomScope(act.scope);
                      setCustomMetadata(act.meta);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      customOperation === act.op
                        ? 'bg-cyan-50 dark:bg-cyan-950 border-cyan-500 text-cyan-800 dark:text-cyan-200 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] truncate">{act.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{act.op}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: What is the target? */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-mono font-bold">3</span>
                <span>What is the target? (Target Resource)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {['orders_prod', 'users', 'config.yaml', 'production_schema', 'main-repo', 'staging_backup_table'].map((tgt) => (
                  <button
                    key={tgt}
                    type="button"
                    onClick={() => setCustomTarget(tgt)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all ${
                      customTarget === tgt
                        ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-800 dark:text-teal-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tgt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                placeholder="e.g. orders_prod, users, config.yaml"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            {/* Technical View Details Form (Conditional on Technical Mode) */}
            {!isSimple && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="text-cyan-400 font-bold">Technical View Parameters:</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Required Scope String</label>
                    <input
                      type="text"
                      value={customScope}
                      onChange={(e) => setCustomScope(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Metadata (JSON)</label>
                    <input
                      type="text"
                      value={customMetadata}
                      onChange={(e) => setCustomMetadata(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Submit Button */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 font-sans">
              Step 4: Click to evaluate with Sentinel Runtime Security Harness
            </span>
            <button
              type="submit"
              disabled={isEvaluating}
              className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isEvaluating ? 'CHECKING WITH SENTINEL...' : 'CHECK WITH SENTINEL'}</span>
            </button>
          </div>
        </form>
      )}

      {/* WHY EXPLANATION MODAL */}
      <AnimatePresence>
        {whyModalItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="fixed inset-0 z-[90] bg-black/70 dark:bg-black/85 backdrop-blur-md"
              onClick={() => setWhyModalItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cyber-panel relative z-[100] w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-6 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    WHY WAS THIS ACTION {whyModalItem.decision.decision}?
                  </span>
                </div>
                <button
                  onClick={() => setWhyModalItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Factors Breakdown */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-slate-500 font-bold">1. Scope Authorization Boundary</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {whyModalItem.decision.auth_ok ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Scope '{whyModalItem.action.scope_required}' Authorized
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Scope '{whyModalItem.action.scope_required}' Unauthorized
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-slate-500 font-bold">2. Risk Classification & Reversibility</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <RiskPill risk={whyModalItem.decision.risk_class} size="sm" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {whyModalItem.decision.risk_class === 'destructive'
                        ? 'Destructive action inherently requires human sign-off or strict isolation'
                        : whyModalItem.decision.risk_class === 'write'
                        ? 'State modification operation'
                        : 'Read-only safe operation'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-slate-500 font-bold">3. Behavioral Trajectory & Drift</div>
                  <div className="text-slate-700 dark:text-slate-300">
                    <div>Current Drift: <span className="font-bold text-slate-900 dark:text-white">{Math.round((whyModalItem.decision.current_session_drift || whyModalItem.decision.drift_score) * 100)}%</span></div>
                    <div>Cross-Session Drift: <span className="font-bold text-cyan-600 dark:text-cyan-400">{Math.round((whyModalItem.decision.cross_session_drift || whyModalItem.decision.drift_score) * 100)}%</span></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{whyModalItem.decision.explanation || whyModalItem.decision.reason}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-slate-500 font-bold">4. External API Execution Status</div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    {whyModalItem.decision.decision === 'ALLOW' || whyModalItem.decision.decision === 'APPROVED' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> External API: CALLED & EXECUTED
                      </span>
                    ) : whyModalItem.decision.decision === 'CONFIRM' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> External API: PAUSED (Awaiting Human Operator Sign-off)
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> External API: NOT CALLED (Request strictly prevented by Sentinel)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 shrink-0 flex justify-end">
                <button
                  onClick={() => setWhyModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Close Explanation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
