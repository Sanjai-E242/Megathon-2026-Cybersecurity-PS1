import React from 'react';
import { Terminal, Play, Shield, ArrowRight } from 'lucide-react';

interface CTASectionProps {
  onOpenConsole: () => void;
  onRunAttackDemo: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenConsole, onRunAttackDemo }) => {
  return (
    <section className="py-24 bg-slate-100 dark:bg-[#080c14] relative border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 border border-cyan-400/40 mb-8">
          <Shield className="w-8 h-8" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-mono leading-tight">
          WATCH EVERY ACTION.<br />
          <span className="text-rose-600 dark:text-rose-400">STOP THE WRONG ONES.</span><br />
          <span className="text-emerald-600 dark:text-emerald-400">LET THE RIGHT ONES THROUGH.</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Runtime enforcement for AI agents — combining authorization, reversibility, and behavioral trajectory into every execution decision.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenConsole}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-mono text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-xl shadow-cyan-500/30 border border-cyan-300/50 transition-all hover:scale-105"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Security Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRunAttackDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-mono text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4" />
            <span>Run Attack Simulation</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-400">SENTINEL RUNTIME v1.4.2 — OPERATIONAL</span>
          </div>
          <div>Deterministic Runtime Security Engine for AI Agents</div>
        </div>

      </div>
    </section>
  );
};
