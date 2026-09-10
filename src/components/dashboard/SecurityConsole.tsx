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
  Sparkles,
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
import { ThemeToggle } from '../common/ThemeToggle';
import { PS1ArchitectureCard } from './PS1ArchitectureCard';

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

const SCENARIO_C_ACTIONS = [
  {
    principal_id: 'bot_unauth',
    resource_type: 'file',
    operation: 'read_file',
    scope_required: 'file.read',
    target: 'public_docs.md',
    metadata: {},
  },
  {
    principal_id: 'bot_unauth',
    resource_type: 'cloud_iam',
    operation: 'revoke_all_access',
    scope_required: 'cloud.iam.admin',
    target: 'production_iam_policies',
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
  const [activeScenario, setActiveScenario] = useState<'attack-escalation' | 'legitimate-migration' | 'unauthorized-bot' | null>(null);
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

  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');

  // Load initial state
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

  // Run Scenario C: Unauthorized Bot through real POST /api/actions
  const handleRunUnauthorizedScenario = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveScenario('unauthorized-bot');
    setTotalSteps(SCENARIO_C_ACTIONS.length);
    setCurrentStepIndex(0);

    const sessionId = `sess_unauth_${Date.now().toString().slice(-4)}`;

    for (let i = 0; i < SCENARIO_C_ACTIONS.length; i++) {
      setCurrentStepIndex(i + 1);
      const template = SCENARIO_C_ACTIONS[i];
      const payload: Partial<Action> = {
        ...template,
        session_id: sessionId,
        action_id: `act_${sessionId}_0${i + 1}`,
        timestamp: new Date().toISOString(),
      };

      const res = await api.submitAction(payload);
      setLastDecision(res);

      if (i < SCENARIO_C_ACTIONS.length - 1) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#06080d] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200 transition-colors duration-200">
      
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#06080d]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Return */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white border border-cyan-400/40 shadow-md">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider text-slate-900 dark:text-white font-mono">SENTINEL</span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/30 px-1.5 py-0.5 rounded ml-2">
                  SOC CONSOLE
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('live-agent')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'live-agent'
                  ? 'bg-white dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-indigo-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agent Test Panel</span>
            </button>
            <button
              onClick={() => setActiveTab('developer-api')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'developer-api'
                  ? 'bg-white dark:bg-teal-600/30 text-teal-700 dark:text-teal-300 border border-slate-300 dark:border-teal-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>API & SDK</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'policies'
                  ? 'bg-white dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Policy Matrix
            </button>
            <button
              onClick={() => setActiveTab('principals')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'principals'
                  ? 'bg-white dark:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Principals
            </button>
          </nav>

          {/* Quick Scenario Buttons & View Mode & Theme Toggle in Header */}
          <div className="flex items-center gap-2">
            {/* Simple vs Technical View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <button
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'simple'
                    ? 'bg-white dark:bg-cyan-600 text-cyan-800 dark:text-white shadow-sm font-bold border border-slate-200 dark:border-cyan-400/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-200" />
                <span className="hidden sm:inline">Simple View</span>
                <span className="sm:hidden">Simple</span>
              </button>
              <button
                onClick={() => setViewMode('technical')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'technical'
                    ? 'bg-white dark:bg-cyan-600 text-cyan-800 dark:text-white shadow-sm font-bold border border-slate-200 dark:border-cyan-400/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-200" />
                <span className="hidden sm:inline">Technical View</span>
                <span className="sm:hidden">Tech</span>
              </button>
            </div>

            <ThemeToggle />

            <button
              onClick={handleRunAttackScenario}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Attack</span>
            </button>

            <button
              onClick={handleRunLegitimateScenario}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Legitimate</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={isRunning}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Reset Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>


      {/* Main Console Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Simple View Header Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-900/10 via-indigo-900/10 to-teal-900/10 dark:from-cyan-950/40 dark:via-indigo-950/40 dark:to-teal-950/40 border border-cyan-200/80 dark:border-cyan-800/50 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                  SENTINEL RUNTIME
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  REAL-TIME SAFETY CONTROL
                </span>
              </div>
              <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                Real-time safety control for AI agents
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                Sentinel watches what AI agents try to do, checks whether they're allowed to do it, evaluates behavioral risk & evidence confidence, and stops dangerous actions before execution.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Mode:</span>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                {viewMode === 'simple' ? '✨ Simple View (Recommended)' : '⚙ Technical View'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Metric & Status Bar */}
        <TopStatusBar
          metrics={metrics}
          activeSessionId={actions[actions.length - 1]?.session_id}
          isSimulating={isRunning}
          realtimeStatus={realtimeStatus}
          viewMode={viewMode}
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
                  onRunUnauthorized={handleRunUnauthorizedScenario}
                  onReset={handleResetDemo}
                  lastDecision={lastDecision}
                  viewMode={viewMode}
                />
              </div>

              <div className="lg:col-span-5">
                <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between h-full transition-colors duration-200">

                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                      <h3 className="font-mono font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>External Agent Integration</span>
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        <span>CONNECTED</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      Sentinel sits as a deterministic security harness between autonomous agents (LangChain, AutoGen, CrewAI, Python SDK) and execution tools.
                    </p>

                    {/* Live Agent Status Metadata Grid */}
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Agent Identity:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{actions[actions.length - 1]?.principal_id || 'external-agent-01'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active Session:</span>
                        <span className="text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 text-[11px] truncate max-w-[180px]">
                          {actions[actions.length - 1]?.session_id || 'session_external_001'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Last Action:</span>
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold">{actions[actions.length - 1]?.operation || 'delete_table'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Sentinel Decision:</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          (lastDecision?.decision || actions[actions.length - 1]?.decision) === 'BLOCK'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40'
                            : (lastDecision?.decision || actions[actions.length - 1]?.decision) === 'CONFIRM'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                        }`}>
                          {lastDecision?.decision || actions[actions.length - 1]?.decision || 'BLOCK'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('live-agent')}
                      className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all text-center"
                    >
                      Open Agent Test Panel
                    </button>
                    <button
                      onClick={() => setActiveTab('developer-api')}
                      className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-500/40 transition-all"
                    >
                      View API & SDK
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PS1 Three-Layer Enforcement Architecture Card */}
            <PS1ArchitectureCard
              lastAction={actions[actions.length - 1]}
              lastDecision={lastDecision}
              viewMode={viewMode}
            />

            {/* Split View: Live Feed & Behavioral Drift Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6">
                <LiveActionFeed
                  actions={actions}
                  viewMode={viewMode}
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
                  currentConfidenceScore={lastDecision?.confidence_score ?? 0.45}
                  viewMode={viewMode}
                />
              </div>
            </div>

            {/* Session Trajectory Escalation Graph */}
            <SessionTrajectory actions={actions} viewMode={viewMode} />

          </div>
        )}

        {activeTab === 'live-agent' && (
          <LiveAgentInput
            viewMode={viewMode}
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
