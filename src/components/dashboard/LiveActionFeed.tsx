import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Action } from '../../types';
import { DecisionBadge } from '../common/DecisionBadge';
import { RiskPill } from '../common/RiskPill';
import {
  Activity,
  Clock,
  User,
  Shield,
  Target,
  Gauge,
  Info,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface LiveActionFeedProps {
  actions: Action[];
  onSelectAction?: (action: Action) => void;
  viewMode?: 'simple' | 'technical';
}

export const LiveActionFeed: React.FC<LiveActionFeedProps> = ({
  actions,
  onSelectAction,
  viewMode = 'simple',
}) => {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const isSimple = viewMode === 'simple';

  const toggleExpand = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedActionId((prev) => (prev === actionId ? null : actionId));
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col min-h-[560px] lg:h-[600px] transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
            {isSimple ? 'LIVE SAFETY MONITOR' : 'LIVE ACTION FEED'}
          </h2>
          <span className="text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded font-semibold">
            {isSimple ? 'REAL-TIME' : 'STREAM'}
          </span>
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {actions.length} {isSimple ? 'actions evaluated' : 'intercepted events'}
        </div>
      </div>

      {/* Feed Container */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 font-mono text-xs">
            <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 animate-pulse" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">Awaiting AI agent actions...</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              {isSimple
                ? 'When an AI agent proposes an action, Sentinel intercepts it here, evaluates risk, and stops harmful commands before they happen.'
                : 'Run a scenario or submit an action to trigger the runtime security pipeline.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {actions.map((action, idx) => {
              const isBlocked = action.decision === 'BLOCK' || action.decision === 'DENIED';
              const isConfirm = action.decision === 'CONFIRM';
              const isExpanded = expandedActionId === action.action_id;

              const driftPct =
                action.drift_score !== undefined
                  ? Math.round(action.drift_score * 100)
                  : 5;
              const confidencePct =
                action.confidence_score !== undefined
                  ? Math.round(action.confidence_score * 100)
                  : 45;
              const confidenceLevel = action.confidence_level || (confidencePct >= 70 ? 'HIGH' : confidencePct >= 40 ? 'MEDIUM' : 'LOW');

              return (
                <motion.div
                  key={action.action_id || idx}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelectAction && onSelectAction(action)}
                  className={`p-4 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    isBlocked
                      ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-500/80 shadow-md ring-1 ring-rose-400 dark:ring-rose-500/40'
                      : isConfirm
                      ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Top Bar: WHO, WHAT, WHERE, DECISION */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Left: Agent & Action */}
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] max-w-[140px] truncate" title={action.principal_id}>
                        <User className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{action.principal_id}</span>
                      </div>

                      <span className="text-slate-400">→</span>

                      <span className="font-bold text-slate-900 dark:text-cyan-300 text-xs bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60 truncate max-w-[160px]" title={action.operation}>
                        {action.operation}
                      </span>

                      <span className="text-slate-400">on</span>

                      <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 truncate max-w-[140px]" title={action.target}>
                        {action.target}
                      </span>
                    </div>

                    {/* Right: Risk, Drift, Confidence, Decision */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RiskPill risk={action.risk_class || 'read'} size="sm" />

                      {/* Behavioral Drift Indicator */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                          driftPct > 75
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                            : driftPct > 45
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                        title="Behavioral Drift: How far this action deviates from normal patterns"
                      >
                        Drift: {driftPct}%
                      </span>

                      {/* Evidence Confidence Indicator */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                          confidenceLevel === 'HIGH'
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40'
                            : confidenceLevel === 'MEDIUM'
                            ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                        title="Evidence Confidence: Strength of session history and corroborating signals supporting this assessment"
                      >
                        Conf: {confidencePct}% ({confidenceLevel})
                      </span>

                      <DecisionBadge
                        decision={action.decision || 'ALLOW'}
                        size="sm"
                        mode={isSimple ? 'simple' : 'technical'}
                      />
                    </div>
                  </div>

                  {/* Human Explanation Banner */}
                  <div
                    className={`mt-2.5 p-2.5 rounded-lg text-xs font-sans leading-relaxed border ${
                      isBlocked
                        ? 'bg-rose-100/70 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 font-medium'
                        : isConfirm
                        ? 'bg-amber-100/70 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 font-medium'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                        <span>{action.human_explanation || action.reason || 'Operation evaluated by Sentinel safety policies.'}</span>
                      </div>

                      {/* Technical Details Collapsible Toggle */}
                      <button
                        onClick={(e) => toggleExpand(action.action_id, e)}
                        className="text-[11px] font-mono font-semibold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Expandable Technical Details Drawer */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-slate-400">Action ID:</span>{' '}
                            <code className="text-slate-800 dark:text-slate-200">{action.action_id}</code>
                          </div>
                          <div>
                            <span className="text-slate-400">Session ID:</span>{' '}
                            <code className="text-slate-800 dark:text-slate-200">{action.session_id}</code>
                          </div>
                          <div>
                            <span className="text-slate-400">Required Scope:</span>{' '}
                            <code className="text-indigo-700 dark:text-indigo-300">{action.scope_required}</code>
                          </div>
                          <div>
                            <span className="text-slate-400">Risk Class:</span>{' '}
                            <code className="text-amber-700 dark:text-amber-300 font-semibold">{action.risk_class}</code>
                          </div>
                          <div>
                            <span className="text-slate-400">Drift Score:</span>{' '}
                            <code className="text-rose-700 dark:text-rose-300 font-semibold">{action.drift_score ?? '0.05'}</code>
                          </div>
                          <div>
                            <span className="text-slate-400">Confidence Score:</span>{' '}
                            <code className="text-cyan-700 dark:text-cyan-300 font-semibold">{action.confidence_score ?? '0.45'} ({confidenceLevel})</code>
                          </div>
                        </div>

                        {action.technical_explanation && (
                          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 italic">
                            Technical: {action.technical_explanation}
                          </div>
                        )}

                        {action.metadata && Object.keys(action.metadata).length > 0 && (
                          <div className="mt-1 bg-slate-100 dark:bg-slate-900 p-2 rounded text-[10px] overflow-x-auto">
                            Metadata: {JSON.stringify(action.metadata)}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
