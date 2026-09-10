import React from 'react';
import { motion } from 'framer-motion';
import { Action } from '../../types';
import { RiskPill } from '../common/RiskPill';
import { DecisionBadge } from '../common/DecisionBadge';
import { GitCommit, ArrowRight, Flame, Eye, Edit3, ShieldAlert, Sparkles, History, Layers, UserCheck } from 'lucide-react';

interface SessionTrajectoryProps {
  actions: Action[];
  viewMode?: 'simple' | 'technical';
}

export const SessionTrajectory: React.FC<SessionTrajectoryProps> = ({
  actions,
  viewMode = 'simple',
}) => {
  const isSimple = viewMode === 'simple';

  // Group actions by session_id to show cross-session behavior
  const sessionMap = new Map<string, Action[]>();
  actions.forEach((act) => {
    const sess = act.session_id || 'default_session';
    if (!sessionMap.has(sess)) {
      sessionMap.set(sess, []);
    }
    sessionMap.get(sess)!.push(act);
  });

  const sessionEntries = Array.from(sessionMap.entries());

  if (actions.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl text-center text-slate-400 dark:text-slate-500 font-mono text-xs py-12 transition-colors duration-200">
        <GitCommit className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No active trajectory path.</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {isSimple
            ? 'Start a demo scenario or submit test actions to see the step-by-step risk escalation path.'
            : 'Execute a scenario to visualize behavioral escalation nodes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {isSimple ? 'ACTION ESCALATION TIMELINE & CROSS-SESSION TRAJECTORY' : 'SESSION TRAJECTORY ESCALATION GRAPH'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-sans">
            Sentinel evaluates behavioral patterns across sessions instead of treating every session as completely independent.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>{actions.length} {isSimple ? 'steps' : 'Nodes'}</span>
          <span>•</span>
          <span>{sessionEntries.length} {sessionEntries.length === 1 ? 'Session' : 'Sessions'}</span>
        </div>
      </div>

      {/* Cross-Session Trajectory Streams */}
      <div className="space-y-6 min-w-0 max-w-full">
        {sessionEntries.map(([sessionId, sessionActions], sIdx) => {
          const maxDrift = Math.max(...sessionActions.map((a) => a.drift_score ?? 0.05));
          const hasBlock = sessionActions.some((a) => a.decision === 'BLOCK' || a.decision === 'DENIED');
          const hasConfirm = sessionActions.some((a) => a.decision === 'CONFIRM');

          return (
            <div
              key={sessionId}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-3 min-w-0 max-w-full overflow-hidden"
            >
              {/* Session Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isSimple ? `Session ${sIdx + 1}:` : `Session Context:`}
                  </span>
                  <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 text-[11px] truncate max-w-[200px]" title={sessionId}>
                    {sessionId}
                  </code>
                  <span className="text-slate-400 font-sans text-[11px] truncate">
                    (Principal: <strong className="text-slate-700 dark:text-slate-300 font-mono">{sessionActions[0]?.principal_id}</strong>)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] shrink-0">
                  <span>Peak Drift: <strong className="text-rose-600 dark:text-rose-400">{Math.round(maxDrift * 100)}%</strong></span>
                  <span className="text-slate-400">•</span>
                  <span className={`font-semibold ${
                    hasBlock ? 'text-rose-700 dark:text-rose-400' : hasConfirm ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {hasBlock ? '🔴 BLOCKED AT HIGH DRIFT' : hasConfirm ? '🟡 GATED FOR CONFIRMATION' : '🟢 NORMAL OPERATION'}
                  </span>
                </div>
              </div>

              {/* Step Sequence for this session */}
              <div className="overflow-x-auto pb-2 pt-1 max-w-full min-w-0 scrollbar-thin">
                <div className="flex items-center gap-3 w-max">
                {sessionActions.map((action, idx) => {
                  const isDestructive = action.risk_class === 'destructive';
                  const isWrite = action.risk_class === 'write';
                  const isBlocked = action.decision === 'BLOCK' || action.decision === 'DENIED';
                  const isLast = idx === sessionActions.length - 1;

                  let Icon = Eye;
                  if (isDestructive) Icon = Flame;
                  else if (isWrite) Icon = Edit3;

                  const driftPct = action.drift_score !== undefined ? Math.round(action.drift_score * 100) : 5;
                  const confidencePct = action.confidence_score !== undefined ? Math.round(action.confidence_score * 100) : Math.min(Math.round((idx + 1) * 15 + 15), 95);

                  return (
                    <React.Fragment key={action.action_id || idx}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-3.5 rounded-xl border flex flex-col items-center text-center w-48 relative shadow-sm ${
                          isBlocked
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/80 shadow-md ring-1 ring-rose-400 dark:ring-rose-500/50'
                            : isDestructive
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/60'
                            : isWrite
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/40'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Step index */}
                        <div className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 mb-1">
                          STEP 0{idx + 1}
                        </div>

                        {/* Icon */}
                        <div
                          className={`p-1.5 rounded-lg mb-1.5 ${
                            isBlocked
                              ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                              : isDestructive
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                              : isWrite
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="font-bold text-slate-900 dark:text-white font-mono text-xs truncate max-w-full">
                          {action.operation}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full mt-0.5 font-mono">
                          {action.target}
                        </div>

                        {/* Drift & Confidence Indicators */}
                        <div className="mt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">Drift: {driftPct}%</span>
                          <span>•</span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">Conf: {confidencePct}%</span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 w-full flex items-center justify-between">
                          <RiskPill risk={action.risk_class || 'read'} size="sm" />
                          <DecisionBadge
                            decision={action.decision || 'ALLOW'}
                            size="sm"
                            mode={isSimple ? 'simple' : 'technical'}
                          />
                        </div>
                      </motion.div>

                      {/* Connecting Animated Line */}
                      {!isLast && (
                        <div className="flex items-center text-slate-400 dark:text-slate-600">
                          <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-500/60 animate-pulse" />
                        </div>
                      )}
                    </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
