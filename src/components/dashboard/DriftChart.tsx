import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Action } from '../../types';

interface DriftChartProps {
  actions: Action[];
  currentDriftScore: number;
}

export const DriftChart: React.FC<DriftChartProps> = ({ actions, currentDriftScore }) => {
  // Format data for chart
  const data = actions.map((action, idx) => ({
    step: `S${idx + 1}`,
    name: `Step ${idx + 1}: ${action.operation}`,
    score: action.drift_score !== undefined ? Number(action.drift_score.toFixed(2)) : 0.05,
    operation: action.operation,
    target: action.target,
    decision: action.decision || 'ALLOW',
  }));

  // If no actions yet, provide baseline initial point
  const chartData = data.length > 0 ? data : [{ step: 'S0', name: 'Baseline', score: 0.05, operation: 'init', target: 'none', decision: 'ALLOW' }];

  const isCritical = currentDriftScore > 0.75;
  const isElevated = currentDriftScore > 0.45 && !isCritical;

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold font-mono text-white">BEHAVIORAL DRIFT TRAJECTORY</h2>
        </div>

        {/* Live Drift Score Pill */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs border ${
          isCritical
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-lg shadow-rose-950/50 animate-pulse'
            : isElevated
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-sm'
            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
        }`}>
          {isCritical ? <ShieldAlert className="w-4 h-4" /> : isElevated ? <AlertTriangle className="w-4 h-4" /> : null}
          <span className="font-bold">LIVE DRIFT: {currentDriftScore.toFixed(2)}</span>
          <span className="text-[10px] uppercase font-semibold">
            ({isCritical ? 'CRITICAL' : isElevated ? 'ELEVATED' : 'NORMAL'})
          </span>
        </div>
      </div>

      {/* Chart Zone Legend */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 my-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /> Normal (&lt;0.45)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" /> Elevated (0.45–0.75)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" /> Critical (&gt;0.75)
          </span>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#06b6d4'} stopOpacity={0.6} />
                <stop offset="95%" stopColor={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#06b6d4'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            
            <XAxis
              dataKey="step"
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            
            <YAxis
              domain={[0, 1]}
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono">
                      <div className="font-bold text-white mb-1">{dataPoint.name}</div>
                      <div className="text-slate-400">Target: <span className="text-cyan-300">{dataPoint.target}</span></div>
                      <div className="text-slate-400">Drift Score: <span className="text-rose-400 font-bold">{dataPoint.score}</span></div>
                      <div className="text-slate-400">Decision: <span className="text-white font-bold">{dataPoint.decision}</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'CRITICAL (0.75)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={0.45} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'ELEVATED (0.45)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />

            <Area
              type="monotone"
              dataKey="score"
              stroke={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#06b6d4'}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#driftGradient)"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
