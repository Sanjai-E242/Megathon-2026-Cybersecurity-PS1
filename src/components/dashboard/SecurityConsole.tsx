import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Activity,
  Zap,
  Sliders,
  Users,
  FileText,
  TrendingUp,
  ArrowLeft,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  Bot,
  Code,
  Radio,
} from 'lucide-react';
import { Action, ActiveTab, AuditLogEntry, DashboardMetrics, DecisionResult, PolicyRule, Principal, RiskLevel } from '../../types';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { TopStatusBar } from './TopStatusBar';
import { ScenarioRunner } from './ScenarioRunner';
import { LiveActionFeed } from './LiveActionFeed';
import { DriftChart } from './DriftChart';
import { SessionTrajectory } from './SessionTrajectory';
import { ConfirmationModal } from './ConfirmationModal';
import { AuditLogView } from './AuditLogView';
import { PolicyView } from './PolicyView';
import { PrincipalView } from './PrincipalView';
import { LiveAgentInput } from './LiveAgentInput';
import { DeveloperApiDocs } from './DeveloperApiDocs';

interface SecurityConsoleProps {
  onBackToLanding: () => void;
  initialScenario?: 'attack-escalation' | 'legitimate-migration' | null;
}

// Predefined Scenario actions (routed through real POST /api/actions)
const SCENARIO_A_ACTIONS = [
  {
    principal_id: 'user_42',
    resource_type: 'file',
    operation: 'read_file',
    scope_required: 'file.read',
    target: 'config.yaml',
    metadata: {},
  },
  {
    principal_id: 'user_42',
    resource_type: 'database',
    operation: 'list_records',
    scope_required: 'db.read',
    target: 'users',
    metadata: {},
  },
  {
    principal_id: 'user_42',
    resource_type: 'database',
    operation: 'update_record',
    scope_required: 'db.write',
    target: 'users',
    metadata: {},
  },
  {
    principal_id: 'user_42',
    resource_type: 'database',
    operation: 'create_migration',
    scope_required: 'db.migrate',
    target: 'production_schema',
    metadata: {},
  },
  {
    principal_id: 'user_42',
    resource_type: 'database',
    operation: 'update_record',
    scope_required: 'db.write',
    target: 'users_bulk',
    metadata: { row_count_estimate: 500 },
  },
  {
    principal_id: 'user_42',
    resource_type: 'database',
    operation: 'delete_table',
    scope_required: 'db.write',
    target: 'orders_prod',
    metadata: { row_count_estimate: 500000 },
  },
];

const SCENARIO_B_ACTIONS = [
  {
    principal_id: 'admin_migration_01',
    resource_type: 'file',
    operation: 'read_migration_plan',
    scope_required: 'file.read',
    target: 'migration_plan.md',
    metadata: {},
  },
  {
    principal_id: 'admin_migration_01',
    resource_type: 'database',
    operation: 'create_migration',
    scope_required: 'db.migrate',
    target: 'staging_schema',
    metadata: {},
  },
  {
    principal_id: 'admin_migration_01',
    resource_type: 'database',
    operation: 'update_record',
    scope_required: 'db.write',
    target: 'staging_users',
    metadata: { row_count_estimate: 500 },
  },
  {
    principal_id: 'admin_migration_01',
    resource_type: 'database',
    operation: 'delete_table',
    scope_required: 'db.write',
    target: 'staging_backup_table',
    metadata: {},
  },
];

export const SecurityConsole: React.FC<SecurityConsoleProps> = ({
  onBackToLanding,
  initialScenario,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // State
  const [actions, setActions] = useState<Action[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<'live' | 'disconnected' | 'reconnecting'>('live');

  // Simulation execution state
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'attack-escalation' | 'legitimate-migration' | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [lastDecision, setLastDecision] = useState<DecisionResult | null>(null);

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTargetAction, setConfirmTargetAction] = useState<Action | null>(null);

  // Initial Data Loader
  const loadInitialData = async () => {
    const [fetchedLogs, fetchedPolicies, fetchedPrincipals] = await Promise.all([
      api.getAuditLogs(),
      api.getPolicies(),
      api.getPrincipals(),
    ]);
    setAuditLogs(fetchedLogs);
    setPolicies(fetchedPolicies);
    setPrincipals(fetchedPrincipals);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // REALTIME STREAM SUBSCRIPTION (Supabase Realtime + Server-Sent Events SSE Fallback)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setRealtimeStatus('live');
        };

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'ACTION_EVALUATED') {
              const { action, decision } = parsed.data;
              setActions((prev) => {
                const exists = prev.some((a) => a.action_id === action.action_id);
                if (exists) return prev;
                return [...prev, action];
              });
              setLastDecision(decision);

              // If action requires human confirmation, trigger modal automatically
              if (decision.decision === 'CONFIRM') {
                setConfirmTargetAction(action);
                setIsConfirmOpen(true);
              }
            } else if (parsed.type === 'DECISION_UPDATED') {
              const { action_id, decision } = parsed.data;
              setActions((prev) =>
                prev.map((a) =>
                  a.action_id === action_id
                    ? {
                        ...a,
                        decision: decision.decision,
                        reason: decision.reason,
                        approved_by: decision.approved_by,
                        approved_at: decision.approved_at,
                      }
                    : a
                )
              );
            } else if (parsed.type === 'AUDIT_LOGGED') {
              const logEntry = parsed.data;
              setAuditLogs((prev) => {
                const exists = prev.some((l) => l.id === logEntry.id);
                if (exists) return prev;
                return [logEntry, ...prev];
              });
            } else if (parsed.type === 'DEMO_RESET') {
              setActions([]);
              setLastDecision(null);
              setActiveScenario(null);
              setCurrentStepIndex(0);
              setTotalSteps(0);
              loadInitialData();
            }
          } catch (e) {
            // Heartbeat or malformed JSON
          }
        };

        eventSource.onerror = () => {
          setRealtimeStatus('reconnecting');
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimeout = setTimeout(setupSSE, 3000);
        };
      } catch (err) {
        setRealtimeStatus('disconnected');
      }
    };

    setupSSE();

    // Also connect to Supabase Realtime channel if available
    let supabaseChannel: any = null;
    if (supabase) {
      try {
        supabaseChannel = supabase
          .channel('sentinel-realtime-room')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'actions' },
            (payload) => {
              const newAction = payload.new as Action;
              setActions((prev) => {
                if (prev.some((a) => a.action_id === newAction.action_id)) return prev;
                return [...prev, newAction];
              });
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'decisions' },
            (payload) => {
              const updated = payload.new as DecisionResult;
              setActions((prev) =>
                prev.map((a) =>
                  a.action_id === updated.action_id
                    ? {
                        ...a,
                        decision: updated.decision,
                        reason: updated.reason,
                        approved_by: updated.approved_by,
                        approved_at: updated.approved_at,
                      }
                    : a
                )
              );
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[SUPABASE_REALTIME_ERR]', e);
      }
    }

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (supabase && supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, []);

  // Trigger initial scenario if passed from landing
  useEffect(() => {
    if (initialScenario === 'attack-escalation') {
      handleRunAttackScenario();
    } else if (initialScenario === 'legitimate-migration') {
      handleRunLegitimateScenario();
    }
  }, [initialScenario]);

  // Derived Metrics
  const metrics: DashboardMetrics = {
    totalIntercepted: actions.length,
    allowedCount: actions.filter((a) => a.decision === 'ALLOW' || a.decision === 'APPROVED').length,
    pendingCount: actions.filter((a) => a.decision === 'CONFIRM').length,
    blockedCount: actions.filter((a) => a.decision === 'BLOCK' || a.decision === 'DENIED').length,
    activeSessions: new Set(actions.map((a) => a.session_id)).size || 1,
    currentDriftScore: lastDecision ? lastDecision.drift_score : 0.05,
    avgLatencyMs: lastDecision?.execution_latency_ms || 10,
  };

  // Run Scenario A through real POST /api/actions
  const handleRunAttackScenario = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveScenario('attack-escalation');
    setTotalSteps(SCENARIO_A_ACTIONS.length);
    setCurrentStepIndex(0);

    const sessionId = `sess_attack_${Date.now().toString().slice(-4)}`;

    for (let i = 0; i < SCENARIO_A_ACTIONS.length; i++) {
      setCurrentStepIndex(i + 1);
      const template = SCENARIO_A_ACTIONS[i];
      const payload: Partial<Action> = {
        ...template,
        session_id: sessionId,
        action_id: `act_${sessionId}_0${i + 1}`,
        timestamp: new Date().toISOString(),
      };

      const res = await api.submitAction(payload);
      setLastDecision(res);

      if (i < SCENARIO_A_ACTIONS.length - 1) {
        await new Promise((r) => setTimeout(r, 750));
      }
    }

    setIsRunning(false);
    loadInitialData();
  };

  // Run Scenario B through real POST /api/actions
  const handleRunLegitimateScenario = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveScenario('legitimate-migration');
    setTotalSteps(SCENARIO_B_ACTIONS.length);
    setCurrentStepIndex(0);

    const sessionId = `sess_legit_${Date.now().toString().slice(-4)}`;

    for (let i = 0; i < SCENARIO_B_ACTIONS.length; i++) {
      setCurrentStepIndex(i + 1);
      const template = SCENARIO_B_ACTIONS[i];
      const payload: Partial<Action> = {
        ...template,
        session_id: sessionId,
        action_id: `act_${sessionId}_0${i + 1}`,
        timestamp: new Date().toISOString(),
      };

      const res = await api.submitAction(payload);
      setLastDecision(res);

      if (i < SCENARIO_B_ACTIONS.length - 1) {
        await new Promise((r) => setTimeout(r, 750));
      }
    }

    setIsRunning(false);
    loadInitialData();
  };

  // Approve action handler
  const handleApproveAction = async (actionId: string) => {
    await api.approveDecision(actionId, 'SOC Operator Alpha');
    loadInitialData();
  };

  // Deny action handler
  const handleDenyAction = async (actionId: string) => {
    await api.denyDecision(actionId, 'SOC Operator Alpha');
    loadInitialData();
  };

  // Reset demo state
  const handleResetDemo = async () => {
    await api.resetDemo();
    setActions([]);
    setLastDecision(null);
    setActiveScenario(null);
    setCurrentStepIndex(0);
    setTotalSteps(0);
    loadInitialData();
  };

  // Update policy handler
  const handleUpdatePolicy = async (operation: string, risk_level: RiskLevel, description?: string) => {
    await api.updatePolicy(operation, risk_level, description);
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#06080d]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Return */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white border border-cyan-400/40 shadow-md">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider text-white font-mono">SENTINEL</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded ml-2">
                  SOC CONSOLE
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('live-agent')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'live-agent'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Live Agent Input</span>
            </button>
            <button
              onClick={() => setActiveTab('developer-api')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'developer-api'
                  ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>External API</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'audit'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'policies'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Policy Matrix
            </button>
            <button
              onClick={() => setActiveTab('principals')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'principals'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Principals
            </button>
          </nav>

          {/* Quick Scenario Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAttackScenario}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-rose-300 bg-rose-950/50 border border-rose-500/40 hover:bg-rose-900/50 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Attack</span>
            </button>

            <button
              onClick={handleRunLegitimateScenario}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/40 hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Legitimate</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={isRunning}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Reset Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Console Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Metric & Status Bar */}
        <TopStatusBar
          metrics={metrics}
          activeSessionId={actions[actions.length - 1]?.session_id}
          isSimulating={isRunning}
          realtimeStatus={realtimeStatus}
        />

        {/* Tab Content Views */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Quick Live Dispatcher & Scenario Runner Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <ScenarioRunner
                  isRunning={isRunning}
                  activeScenario={activeScenario}
                  currentStepIndex={currentStepIndex}
                  totalSteps={totalSteps}
                  onRunAttack={handleRunAttackScenario}
                  onRunLegitimate={handleRunLegitimateScenario}
                  onReset={handleResetDemo}
                  lastDecision={lastDecision}
                />
              </div>

              <div className="lg:col-span-5">
                <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <h3 className="font-mono font-bold text-white text-sm flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span>External AI Agent Connector</span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Route actions from any autonomous AI agent (LangChain, AutoGen, CrewAI, or Python/cURL scripts) to Sentinel Runtime in real time.
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-1 mb-4">
                      <div className="text-slate-500">Method: <span className="text-cyan-400 font-bold">POST</span></div>
                      <div className="text-slate-500">URL: <span className="text-slate-200">http://localhost:3001/api/actions</span></div>
                      <div className="text-slate-500">Realtime Push: <span className="text-emerald-400">Automatic (SSE + Supabase)</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('live-agent')}
                      className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all text-center"
                    >
                      Open Live Agent Input
                    </button>
                    <button
                      onClick={() => setActiveTab('developer-api')}
                      className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 transition-all"
                    >
                      View cURL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Split View: Live Feed & Behavioral Drift Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6">
                <LiveActionFeed
                  actions={actions}
                  onSelectAction={(a) => {
                    if (a.decision === 'CONFIRM') {
                      setConfirmTargetAction(a);
                      setIsConfirmOpen(true);
                    }
                  }}
                />
              </div>

              <div className="lg:col-span-6">
                <DriftChart
                  actions={actions}
                  currentDriftScore={metrics.currentDriftScore}
                />
              </div>
            </div>

            {/* Session Trajectory Escalation Graph */}
            <SessionTrajectory actions={actions} />

          </div>
        )}

        {activeTab === 'live-agent' && (
          <LiveAgentInput
            onActionEvaluated={(action, decision) => {
              if (decision.decision === 'CONFIRM') {
                setConfirmTargetAction(action);
                setIsConfirmOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'developer-api' && (
          <DeveloperApiDocs />
        )}

        {activeTab === 'audit' && (
          <AuditLogView logs={auditLogs} onRefresh={loadInitialData} />
        )}

        {activeTab === 'policies' && (
          <PolicyView
            policies={policies}
            onUpdatePolicy={handleUpdatePolicy}
          />
        )}

        {activeTab === 'principals' && (
          <PrincipalView principals={principals} />
        )}

      </main>

      {/* Human Approval Required Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        action={confirmTargetAction}
        onApprove={handleApproveAction}
        onDeny={handleDenyAction}
        onClose={() => setIsConfirmOpen(false)}
      />

    </div>
  );
};
