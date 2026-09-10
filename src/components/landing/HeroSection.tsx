import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Play, ArrowRight, Zap, CheckCircle2, AlertTriangle, XCircle, Database } from 'lucide-react';
import { SecurityCore3D } from '../3d/SecurityCore3D';
import { MobileHeroFallback } from '../3d/MobileHeroFallback';

interface HeroSectionProps {
  onOpenConsole: () => void;
  onRunAttackDemo: () => void;
}

const SAMPLE_INTERCEPTIONS = [
  { agent: 'agent_sql_runner', op: 'read_file', target: 'schema.sql', decision: 'ALLOW', color: 'text-emerald-400' },
  { agent: 'user_42', op: 'update_record', target: 'customers_bulk', decision: 'CONFIRM', color: 'text-amber-400' },
  { agent: 'agent_drift_09', op: 'delete_table', target: 'orders_prod', decision: 'BLOCK', color: 'text-rose-400' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenConsole, onRunAttackDemo }) => {
  const [activeInterceptionIdx, setActiveInterceptionIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInterceptionIdx((prev) => (prev + 1) % SAMPLE_INTERCEPTIONS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentSample = SAMPLE_INTERCEPTIONS[activeInterceptionIdx];

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background radial glow & laser line */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 text-center lg:text-left">
            
            {/* Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-6 shadow-sm shadow-cyan-500/20"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-semibold">RUNTIME SECURITY FOR AI AGENTS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
            >
              Watch every action.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                Stop the wrong ones.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              A deterministic security middleware layer sitting between AI agents and execution tools. Enforce authorization, detect behavioral drift, and intercept dangerous operations before execution.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={onOpenConsole}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl font-mono text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-xl shadow-cyan-500/25 border border-cyan-300/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Terminal className="w-4 h-4" />
                <span>Launch Security Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onRunAttackDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-sm font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                <span>Run Attack Simulation</span>
              </button>
            </motion.div>

            {/* Trust Statement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-xs font-mono text-slate-400"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deterministic runtime enforcement. No model retraining required.</span>
            </motion.div>
          </div>

          {/* Right 3D Security Core Simulation */}
          <div className="lg:col-span-6 relative">
            <div className="cyber-panel rounded-2xl p-2 relative overflow-hidden border border-slate-700/60 shadow-2xl">
              
              {/* Header Bar of 3D Panel */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 rounded-t-xl border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-semibold">RUNTIME INTERCEPTOR CORE</span>
                </div>
                <span className="text-[11px] text-cyan-400">LATENCY: ~12ms</span>
              </div>

              {/* 3D Scene Desktop vs 2D Mobile Fallback */}
              <div className="hidden md:block">
                <SecurityCore3D />
              </div>
              <div className="block md:hidden">
                <MobileHeroFallback />
              </div>

              {/* Dynamic Live Action Interception Ticker */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md rounded-xl p-3.5 border border-slate-800 text-xs font-mono shadow-xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Live Interception Stream</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSample.op + currentSample.target}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-indigo-400">{currentSample.agent}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-cyan-300 font-semibold">{currentSample.op}</span>
                      <span className="text-slate-500">({currentSample.target})</span>
                    </div>
                    <span className={`font-bold tracking-wider px-2 py-0.5 rounded text-[11px] border ${
                      currentSample.decision === 'ALLOW' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' :
                      currentSample.decision === 'CONFIRM' ? 'bg-amber-950/80 text-amber-400 border-amber-500/50' :
                      'bg-rose-950/90 text-rose-300 border-rose-500/60'
                    }`}>
                      {currentSample.decision}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
