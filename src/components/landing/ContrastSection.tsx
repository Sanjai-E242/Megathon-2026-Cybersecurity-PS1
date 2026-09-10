import React from 'react';
import { motion } from 'framer-motion';
import { ShieldX, ShieldCheck, DoorOpen, CheckCircle2, XCircle, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { DecisionBadge } from '../common/DecisionBadge';

interface ContrastSectionProps {
  onRunAttack: () => void;
  onRunLegit: () => void;
}

export const ContrastSection: React.FC<ContrastSectionProps> = ({ onRunAttack, onRunLegit }) => {
  return (
    <section id="comparison" className="py-24 bg-[#06080d] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Metaphor Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <DoorOpen className="w-4 h-4" />
            <span>A WALL WITH A DOOR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Runtime security shouldn’t block everything unusual.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            It should stop what’s dangerous and let legitimate work through — even when that work is itself unusual and destructive.
          </p>
          <div className="mt-3 text-xs font-mono text-cyan-400 font-semibold tracking-wider">
            SAME ESCALATION PATTERN. DIFFERENT CONTEXT. CORRECTLY DIFFERENT OUTCOME.
          </div>
        </div>

        {/* Side by side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Attack Escalation Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="cyber-panel-danger rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/60 flex items-center justify-center text-rose-400">
                    <ShieldX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-white text-base">Scenario A: Escalation Attack</h3>
                    <p className="text-xs text-rose-300/80 font-mono">Principal: user_42 (Drift: 0.87)</p>
                  </div>
                </div>
                <DecisionBadge decision="BLOCK" size="lg" />
              </div>

              {/* Action Steps */}
              <div className="space-y-2 text-xs font-mono mb-6">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">01. read_file (config.yaml)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">02. list_records (users)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">03. update_record (users)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-950/30 border border-amber-500/30">
                  <span className="text-amber-200">04. create_migration (production)</span>
                  <span className="text-amber-400">CONFIRM</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-rose-950/60 border border-rose-500/60 font-bold">
                  <span className="text-rose-200">06. delete_table (orders_prod)</span>
                  <span className="text-rose-400">BLOCKED</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-200">
                <div className="font-bold mb-0.5">Enforcement Reason:</div>
                <div>Destructive action detected on production after high behavioral drift trajectory.</div>
              </div>
            </div>

            <button
              onClick={onRunAttack}
              className="mt-6 w-full py-2.5 rounded-xl font-mono text-xs font-bold text-rose-200 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-500/50 transition-all flex items-center justify-center gap-2"
            >
              <span>Simulate Attack Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Legitimate Admin Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="cyber-panel-amber rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-white text-base">Scenario B: Sanctioned Migration</h3>
                    <p className="text-xs text-amber-300/80 font-mono">Principal: admin_migration_01 (Staging)</p>
                  </div>
                </div>
                <DecisionBadge decision="CONFIRM" size="lg" />
              </div>

              {/* Action Steps */}
              <div className="space-y-2 text-xs font-mono mb-6">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">01. read_migration_plan (plan.md)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">02. create_migration (staging)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">03. bulk_update (staging_users)</span>
                  <span className="text-emerald-400">ALLOW</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-950/40 border border-amber-500/40 font-semibold">
                  <span className="text-amber-200">04. delete_table (staging_backup)</span>
                  <span className="text-amber-400">CONFIRM → APPROVE</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-teal-950/60 border border-teal-500/60 text-teal-300 font-bold">
                  <span>Result after Human Sign-off</span>
                  <span>EXECUTED ✓</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono text-amber-200">
                <div className="font-bold mb-0.5">Enforcement Reason:</div>
                <div>Principal authorized (`db.migrate`), staging target, sanctioned context. Requested human sign-off instead of blocking.</div>
              </div>
            </div>

            <button
              onClick={onRunLegit}
              className="mt-6 w-full py-2.5 rounded-xl font-mono text-xs font-bold text-amber-200 bg-amber-900/40 hover:bg-amber-900/70 border border-amber-500/50 transition-all flex items-center justify-center gap-2"
            >
              <span>Simulate Admin Migration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
