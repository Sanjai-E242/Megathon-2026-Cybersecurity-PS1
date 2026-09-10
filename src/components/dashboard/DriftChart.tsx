import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, ShieldAlert, AlertTriangle, ShieldCheck, Info, Sparkles, HelpCircle } from 'lucide-react';
import { Action } from '../../types';

interface DriftChartProps {
  actions: Action[];
  currentDriftScore: number;
  currentConfidenceScore?: number;
  viewMode?: 'simple' | 'technical';
}

export const DriftChart: React.FC<DriftChartProps> = ({
  actions,
  currentDriftScore,
  currentConfidenceScore = 0.45,
  viewMode = 'simple',
}) => {
  const isSimple = viewMode === 'simple';

  // Format data for dual-metric trajectory chart
  const data = actions.map((action, idx) => {
    const driftPct = action.drift_score !== undefined ? Math.round(action.drift_score * 100) : 5;
    const confidencePct =
      action.confidence_score !== undefined
        ? Math.round(action.confidence_score * 100)
        : Math.min(Math.round((idx + 1) * 14 + 15), 95);

    return {
      step: `Step ${idx + 1}`,
      shortStep: `S${idx + 1}`,
      name: `${idx + 1}. ${action.operation}`,
      drift: driftPct,
      confidence: confidencePct,
      operation: action.operation,
      target: action.target,
      risk: action.risk_class || 'read',
      decision: action.decision || 'ALLOW',
      human_explanation: action.human_explanation || action.reason,
    };
  });

  const chartData =
    data.length > 0
      ? data
      : [
          {
            step: 'Baseline',
            shortStep: 'S0',
            name: 'Initial Baseline',
            drift: 5,
            confidence: 20,
            operation: 'baseline',
            target: 'none',
            risk: 'read',
            decision: 'ALLOW',
            human_explanation: 'Normal baseline activity pattern.',
          },
        ];

  const isCritical = currentDriftScore > 0.75;
  const isElevated = currentDriftScore > 0.45 && !isCritical;
  const confidenceLevel =
    currentConfidenceScore >= 0.70 ? 'HIGH' : currentConfidenceScore >= 0.40 ? 'MEDIUM' : 'LOW';

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col h-[560px] transition-colors duration-200">
      {/* Header with Dual Metric Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
            {isSimple ? 'BEHAVIOR & CONFIDENCE GRAPH' : 'BEHAVIORAL DRIFT TRAJECTORY'}
          </h2>
        </div>

        {/* Dual Live Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Drift Score Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs border ${
              isCritical
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/60 text-rose-700 dark:text-rose-300 shadow-sm animate-pulse font-bold'
                : isElevated
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-sm font-semibold'
                : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-semibold'
            }`}
          >
            {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : isElevated ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>Behavior Risk: {Math.round(currentDriftScore * 100)}%</span>
            <span className="text-[10px] uppercase font-bold">
              ({isCritical ? 'CRITICAL' : isElevated ? 'ELEVATED' : 'NORMAL'})
            </span>
          </div>

          {/* Confidence Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs border bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evidence Confidence: {Math.round(currentConfidenceScore * 100)}%</span>
            <span className="text-[10px] font-bold uppercase">({confidenceLevel})</span>
          </div>
        </div>
      </div>

      {/* Chart Legend with Explanatory Hints */}
      <div className="flex flex-wrap items-center justify-between text-xs font-sans text-slate-600 dark:text-slate-400 my-3 gap-3">
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-400">
            <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
            Behavioral Drift (0% → 100%)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-cyan-700 dark:text-cyan-400">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
            Trajectory Confidence (0% → 100%)
          </span>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Threshold: &gt;75% triggers policy block</span>
        </div>
      </div>

      {/* Recharts Dual Area & Line Chart */}
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="driftAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#8b5cf6'} stopOpacity={0.4} />
                <stop offset="95%" stopColor={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#8b5cf6'} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />

            <XAxis
              dataKey="shortStep"
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
                        {pt.name}
                      </div>
                      <div>Target: <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{pt.target}</span></div>
                      <div>Risk Class: <span className="text-amber-700 dark:text-amber-300 font-semibold uppercase">{pt.risk}</span></div>
                      <div>Behavior Drift: <span className="text-rose-600 dark:text-rose-400 font-bold">{pt.drift}%</span></div>
                      <div>Evidence Confidence: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{pt.confidence}%</span></div>
                      <div>Decision: <span className="text-slate-900 dark:text-white font-bold">{pt.decision}</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={75}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'BLOCK THRESHOLD (75%)',
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <ReferenceLine
              y={45}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'ELEVATED RISK (45%)',
                fill: '#f59e0b',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Trajectory Confidence Score Line & Area */}
            <Area
              type="monotone"
              dataKey="confidence"
              name="Trajectory Confidence"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#confAreaGrad)"
              animationDuration={400}
            />

            {/* Behavioral Drift Score Line & Area */}
            <Area
              type="monotone"
              dataKey="drift"
              name="Behavioral Drift"
              stroke={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#8b5cf6'}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#driftAreaGrad)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Action Sequence Progression Bar */}
      {actions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>RECENT ACTION ESCALATION SEQUENCE</span>
            <span>{actions.length} steps tracked</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {actions.map((act, i) => {
              const isDestructive = act.risk_class === 'destructive';
              const isWrite = act.risk_class === 'write';
              const isBlocked = act.decision === 'BLOCK' || act.decision === 'DENIED';

              return (
                <div key={act.action_id || i} className="flex items-center gap-1 shrink-0">
                  <div
                    className={`px-2 py-1 rounded text-[10px] font-mono font-semibold border ${
                      isBlocked
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/80 shadow-sm'
                        : isDestructive
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/60'
                        : isWrite
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {act.operation.toUpperCase().replace('_', ' ')}
                  </div>
                  {i < actions.length - 1 && <span className="text-slate-400 text-xs">→</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plain-English Concept Explanations Below Chart */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-start gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
          <p>
            <strong className="text-slate-900 dark:text-white font-semibold">Drift Score:</strong> Measures how far the agent's recent behavior has moved from its normal activity pattern.
          </p>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
          <p>
            <strong className="text-slate-900 dark:text-white font-semibold">Confidence Score:</strong> Measures how much behavioral evidence Sentinel has to support that assessment.
          </p>
        </div>
      </div>
    </div>
  );
};
