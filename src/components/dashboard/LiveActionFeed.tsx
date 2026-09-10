import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Action } from '../../types';
import { DecisionBadge } from '../common/DecisionBadge';
import { RiskPill } from '../common/RiskPill';
import { Activity, Clock } from 'lucide-react';

interface LiveActionFeedProps {
  actions: Action[];
  onSelectAction?: (action: Action) => void;
}

export const LiveActionFeed: React.FC<LiveActionFeedProps> = ({ actions, onSelectAction }) => {
  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col h-[520px] transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">LIVE ACTION FEED</h2>
          <span className="text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded">
            REALTIME STREAM
          </span>
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing {actions.length} intercepted events
        </div>
      </div>

      {/* Feed Table Container */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 font-mono text-xs">
            <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 animate-pulse" />
            <p>Awaiting incoming agent tool actions...</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">Run a scenario or send an action from the test panel to start the live interception stream.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {actions.map((action, idx) => {
                const isBlocked = action.decision === 'BLOCK' || action.decision === 'DENIED';
                const isConfirm = action.decision === 'CONFIRM';

                return (
                  <motion.div
                    key={action.action_id || idx}
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => onSelectAction && onSelectAction(action)}
                    className={`p-3.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      isBlocked
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-500/80 shadow-md ring-1 ring-rose-400 dark:ring-rose-500/40'
                        : isConfirm
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      
                      {/* Left info: Time & Operation */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-700 dark:text-cyan-300">{action.operation}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-800 dark:text-slate-300 font-mono text-[11px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {action.target}
                          </span>
                        </div>
                      </div>

                      {/* Right info: Badges & Drift */}
                      <div className="flex items-center gap-3">
                        <RiskPill risk={action.risk_class || 'read'} size="sm" />

                        {action.drift_score !== undefined && (
                          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                            action.drift_score > 0.75 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' :
                            action.drift_score > 0.45 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                            'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}>
                            drift: {(action.drift_score * 100).toFixed(0)}%
                          </span>
                        )}

                        <DecisionBadge decision={action.decision || 'ALLOW'} size="sm" />
                      </div>

                    </div>

                    {/* Metadata & Reason footer */}
                    {(action.reason || action.principal_id) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                        <div className="flex items-center gap-2">
                          <span>Principal: <code className="text-indigo-700 dark:text-indigo-300 font-semibold">{action.principal_id}</code></span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>Scope: <code className="text-slate-700 dark:text-slate-300">{action.scope_required}</code></span>
                        </div>
                        {action.reason && (
                          <div className={`italic truncate max-w-md ${
                            isBlocked ? 'text-rose-700 dark:text-rose-300 font-medium' : isConfirm ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {action.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
