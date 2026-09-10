import React from 'react';
import { ShieldCheck, Cpu, Zap, Activity, CheckCircle2, AlertTriangle, XCircle, Users, Radio, Wifi, WifiOff } from 'lucide-react';
import { MetricCounter } from '../common/MetricCounter';
import { DashboardMetrics } from '../../types';

interface TopStatusBarProps {
  metrics: DashboardMetrics;
  activeSessionId?: string;
  isSimulating?: boolean;
  realtimeStatus?: 'live' | 'disconnected' | 'reconnecting';
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  metrics,
  activeSessionId,
  isSimulating,
  realtimeStatus = 'live',
}) => {
  return (
    <div className="space-y-4">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-sm transition-colors duration-200">
        
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wider">RUNTIME PROTECTION ACTIVE</span>
          </div>

          {/* Realtime Stream Connection Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all ${
            realtimeStatus === 'live'
              ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-500/50 text-cyan-700 dark:text-cyan-300 shadow-sm'
              : realtimeStatus === 'reconnecting'
              ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {realtimeStatus === 'live' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
                <span>REALTIME CONNECTION ● LIVE</span>
              </>
            ) : realtimeStatus === 'reconnecting' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-spin" />
                <span>REALTIME RECONNECTING...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>REALTIME CONNECTION ○ DISCONNECTED</span>
              </>
            )}
          </div>

          {isSimulating && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
              <span>SIMULATION STREAMING</span>
            </div>
          )}
        </div>

        {/* Runtime Engine Metadata */}
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Policy Engine:</span>
            <span className="text-slate-900 dark:text-white font-semibold">v1.4.2</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Engine Latency:</span>
            <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{metrics.avgLatencyMs || 10}ms</span>
          </div>
          {activeSessionId && (
            <div className="hidden lg:flex items-center gap-1.5">
              <span>Active Session:</span>
              <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">
                {activeSessionId}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCounter
          label="Actions Intercepted"
          value={metrics.totalIntercepted}
          color="cyan"
          icon={<Activity className="w-4 h-4" />}
          sublabel="Total evaluated tool calls"
        />
        <MetricCounter
          label="Allowed"
          value={metrics.allowedCount}
          color="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
          sublabel="Safe & authorized"
        />
        <MetricCounter
          label="Pending Approval"
          value={metrics.pendingCount}
          color="amber"
          icon={<AlertTriangle className="w-4 h-4" />}
          sublabel="Destructive / Gated"
        />
        <MetricCounter
          label="Blocked"
          value={metrics.blockedCount}
          color="rose"
          icon={<XCircle className="w-4 h-4" />}
          sublabel="High drift / unauthorized"
        />
        <MetricCounter
          label="Active Sessions"
          value={metrics.activeSessions}
          color="indigo"
          icon={<Users className="w-4 h-4" />}
          sublabel="Monitored AI contexts"
        />
      </div>
    </div>
  );
};
