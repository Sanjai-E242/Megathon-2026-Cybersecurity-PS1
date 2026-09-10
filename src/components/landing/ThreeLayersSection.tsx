import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Undo2, TrendingUp, Check, X, Flame } from 'lucide-react';

export const ThreeLayersSection: React.FC = () => {
  return (
    <section id="layers" className="py-24 bg-slate-100/60 dark:bg-[#0a0d14] relative border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TRI-LAYER ENFORCEMENT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Three complementary security layers.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Authorization alone isn’t enough. Reversibility alone isn’t enough. Sentinel unifies cryptographic authorization, operation reversibility, and behavioral trajectory.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Authorization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-blue-300 dark:border-blue-500/30 hover:border-blue-500 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-500/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono mb-2">1. Authorization</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Every action is verified against the principal’s assigned cryptographic scopes. Unauthorized attempts are stopped instantly.
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div className="text-slate-500 mb-2">principal: <span className="text-cyan-700 dark:text-cyan-300 font-semibold">user_42</span></div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Check className="w-3.5 h-3.5" /> db.read</div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Check className="w-3.5 h-3.5" /> db.write</div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Check className="w-3.5 h-3.5" /> db.migrate</div>
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400"><X className="w-3.5 h-3.5" /> cloud.iam.admin</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-between">
                  <span>Unauthorized Scope</span>
                  <span className="bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/40">→ BLOCK</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Reversibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-amber-300 dark:border-amber-500/30 hover:border-amber-500 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-sm">
                <Undo2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono mb-2">2. Reversibility Gate</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Operations are classified by rollback difficulty: Read (zero side-effect), Write (recoverable), or Destructive (table drop, purge).
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">read_file:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">READ (Safe)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">update_record:</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">WRITE (Logged)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">delete_table:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> DESTRUCTIVE</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
                  <span>Destructive Gating</span>
                  <span className="bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/40">→ CONFIRM</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Trajectory Monitor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-violet-300 dark:border-violet-500/30 hover:border-violet-500 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/80 border border-violet-300 dark:border-violet-500/50 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono mb-2">3. Trajectory Monitor</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tracks cross-resource velocity, escalation count, and scope expansion across the entire session to compute behavioral drift.
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Distinct Resources:</span>
                  <span className="text-slate-800 dark:text-white font-bold">4 targets</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Escalation Count:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">2 levels</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Drift Score:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">0.84 (Critical)</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-between">
                  <span>Drift &gt; 0.75 + Destructive</span>
                  <span className="bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/40">→ BLOCK</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
