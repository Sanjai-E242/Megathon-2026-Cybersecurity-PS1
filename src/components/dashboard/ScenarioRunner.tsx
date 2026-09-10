import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Zap } from 'lucide-react';
import { DecisionResult } from '../../types';
import { DecisionBadge } from '../common/DecisionBadge';

interface ScenarioRunnerProps {
  isRunning: boolean;
  activeScenario: 'attack-escalation' | 'legitimate-migration' | null;
  currentStepIndex: number;
  totalSteps: number;
  onRunAttack: () => void;
  onRunLegitimate: () => void;
  onReset: () => void;
  lastDecision?: DecisionResult | null;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  isRunning,
  activeScenario,
  currentStepIndex,
  totalSteps,
  onRunAttack,
  onRunLegitimate,
  onReset,
  lastDecision,
}) => {
  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>SCENARIO EXECUTION RUNNER</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Test the runtime enforcement engine with real sequential agent tool call streams
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Two Scenario Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Scenario A: Escalation Attack */}
        <div className={`p-4 rounded-xl border transition-all ${
          activeScenario === 'attack-escalation'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/80 shadow-md ring-1 ring-rose-400 dark:ring-rose-500/50'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/40 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/30 px-2 py-0.5 rounded uppercase font-semibold">
                SCENARIO A • 6 STEPS
              </span>
              <h3 className="font-mono font-bold text-slate-900 dark:text-white text-base mt-2">Behavioral Escalation Attack</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Principal: <code className="text-cyan-700 dark:text-cyan-300">user_42</code> → Stepped privilege creep from config read to production table drop.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Outcome: <span className="text-rose-600 dark:text-rose-400 font-bold">BLOCK</span>
            </span>

            <button
              onClick={onRunAttack}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning && activeScenario === 'attack-escalation' ? 'Streaming...' : 'Run Attack Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Scenario B: Legitimate Admin Migration */}
        <div className={`p-4 rounded-xl border transition-all ${
          activeScenario === 'legitimate-migration'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/80 shadow-md ring-1 ring-amber-400 dark:ring-amber-500/50'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded uppercase font-semibold">
                SCENARIO B • 4 STEPS
              </span>
              <h3 className="font-mono font-bold text-slate-900 dark:text-white text-base mt-2">Sanctioned Admin Migration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Principal: <code className="text-amber-700 dark:text-amber-300">admin_migration_01</code> → Authorized staging schema upgrade & backup cleanup.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Outcome: <span className="text-amber-700 dark:text-amber-400 font-bold">CONFIRM → APPROVE</span>
            </span>

            <button
              onClick={onRunLegitimate}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning && activeScenario === 'legitimate-migration' ? 'Streaming...' : 'Run Legitimate Scenario'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Stepping Progress Indicator */}
      {activeScenario && (
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-2">
            <span>
              Scenario Progress: Step <strong className="text-slate-900 dark:text-white">{currentStepIndex}</strong> of {totalSteps}
            </span>
            <span className="text-cyan-700 dark:text-cyan-400">
              {isRunning ? 'Streaming Action (750ms cadence)...' : 'Simulation Complete'}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                activeScenario === 'attack-escalation'
                  ? 'bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentStepIndex / totalSteps) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Last Evaluated Step Banner */}
          {lastDecision && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                lastDecision.decision === 'BLOCK'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-200'
                  : lastDecision.decision === 'CONFIRM'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/60 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">Latest Action:</span>
                <span>{lastDecision.action_id}</span>
                <span className="text-slate-400">|</span>
                <span className="italic">{lastDecision.reason}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Drift: {(lastDecision.drift_score * 100).toFixed(0)}%</span>
                <DecisionBadge decision={lastDecision.decision} size="sm" />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
