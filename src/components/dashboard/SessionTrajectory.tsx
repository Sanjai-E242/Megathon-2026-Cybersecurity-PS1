import React from 'react';
import { motion } from 'framer-motion';
import { Action } from '../../types';
import { RiskPill } from '../common/RiskPill';
import { DecisionBadge } from '../common/DecisionBadge';
import { GitCommit, ArrowRight, ShieldCheck, ShieldAlert, CheckCircle2, Flame, Eye, Edit3 } from 'lucide-react';

interface SessionTrajectoryProps {
  actions: Action[];
}

export const SessionTrajectory: React.FC<SessionTrajectoryProps> = ({ actions }) => {
  if (actions.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl text-center text-slate-500 font-mono text-xs py-12">
        <GitCommit className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p>No active trajectory path.</p>
        <p className="text-[11px] text-slate-600 mt-1">Execute a scenario to visualize behavioral escalation nodes.</p>
      </div>
    );
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold font-mono text-white">SESSION TRAJECTORY ESCALATION GRAPH</h2>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {actions.length} Linked Nodes
        </div>
      </div>

      {/* Linked Nodes Timeline */}
      <div className="flex items-center gap-3 min-w-max pb-4">
        {actions.map((action, idx) => {
          const isDestructive = action.risk_class === 'destructive';
          const isWrite = action.risk_class === 'write';
          const isBlocked = action.decision === 'BLOCK';
          const isLast = idx === actions.length - 1;

          let Icon = Eye;
          if (isDestructive) Icon = Flame;
          else if (isWrite) Icon = Edit3;

          return (
            <React.Fragment key={action.action_id || idx}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl border flex flex-col items-center text-center w-48 relative ${
                  isBlocked
                    ? 'bg-rose-950/60 border-rose-500/80 shadow-lg shadow-rose-950/50'
                    : isDestructive
                    ? 'bg-amber-950/40 border-amber-500/60'
                    : isWrite
                    ? 'bg-indigo-950/30 border-indigo-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Node index */}
                <div className="text-[10px] font-mono text-slate-500 mb-1">NODE 0{idx + 1}</div>

                {/* Icon */}
                <div className={`p-2 rounded-lg mb-2 ${
                  isBlocked ? 'bg-rose-900 text-rose-300' :
                  isDestructive ? 'bg-red-900/50 text-red-300' :
                  isWrite ? 'bg-indigo-900/40 text-indigo-300' :
                  'bg-slate-800 text-cyan-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="font-bold text-white font-mono text-xs truncate max-w-full">
                  {action.operation}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">
                  {action.target}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 w-full flex items-center justify-between">
                  <RiskPill risk={action.risk_class || 'read'} size="sm" />
                  <DecisionBadge decision={action.decision || 'ALLOW'} size="sm" />
                </div>
              </motion.div>

              {/* Connecting Animated Line */}
              {!isLast && (
                <div className="flex items-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-cyan-500/60 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
