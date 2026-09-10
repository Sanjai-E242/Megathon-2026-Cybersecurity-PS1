import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Undo2, TrendingUp, Check, X, Flame } from 'lucide-react';

export const ThreeLayersSection: React.FC = () => {
  return (
    <section id="layers" className="py-24 bg-[#0a0d14] relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TRI-LAYER ENFORCEMENT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Three complementary security layers.
          </h2>
          <p className="mt-4 text-base text-slate-300">
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
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-blue-500/30 hover:border-blue-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-6 shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2">1. Authorization</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every action is verified against the principal’s assigned cryptographic scopes. Unauthorized attempts are stopped instantly.
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono">
                <div className="text-slate-400 mb-2">principal: <span className="text-cyan-300">user_42</span></div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400"><Check className="w-3.5 h-3.5" /> db.read</div>
                  <div className="flex items-center gap-2 text-emerald-400"><Check className="w-3.5 h-3.5" /> db.write</div>
                  <div className="flex items-center gap-2 text-emerald-400"><Check className="w-3.5 h-3.5" /> db.migrate</div>
                  <div className="flex items-center gap-2 text-rose-400"><X className="w-3.5 h-3.5" /> cloud.iam.admin</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-rose-400 font-semibold flex items-center justify-between">
                  <span>Unauthorized Scope</span>
                  <span className="bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">→ BLOCK</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Reversibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-6 shadow-md shadow-amber-500/20">
                <Undo2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2">2. Reversibility</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Categorizes all operations into READ, WRITE, and DESTRUCTIVE. Destructive actions cannot execute without explicit human sign-off.
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sky-300">read_file, list_records</span>
                  <span className="text-emerald-400 font-semibold">READ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300">update_record, send_email</span>
                  <span className="text-indigo-400 font-semibold">WRITE</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-red-950/40 border border-red-500/40">
                  <span className="text-red-300 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> delete_table, drop_db</span>
                  <span className="text-red-400 font-bold">DESTRUCTIVE</span>
                </div>
                <div className="text-[11px] text-amber-300/90 italic pt-1">
                  * Destructive operations require Human Approval
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Trajectory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="cyber-panel rounded-2xl p-6 sm:p-8 border border-violet-500/30 hover:border-violet-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/50 flex items-center justify-center text-violet-400 mb-6 shadow-md shadow-violet-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2">3. Trajectory</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Monitors session velocity, resource scope jumping, and risk transitions to calculate a real-time behavioral drift score (0.0 to 1.0).
              </p>

              {/* Mini Demo Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resource Diversity</span>
                  <span className="text-cyan-300">4 distinct</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Escalations</span>
                  <span className="text-amber-400">3 jumps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Session Velocity</span>
                  <span className="text-slate-300">6.2 ops/min</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-violet-300 font-bold">Drift Score</span>
                  <span className="text-rose-400 font-bold text-sm bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                    0.87 (CRITICAL)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
