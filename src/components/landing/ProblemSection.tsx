import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, ListOrdered, Edit, Database, Flame, ArrowRight, ShieldAlert } from 'lucide-react';

const ESCALATION_STEPS = [
  { icon: FileText, label: 'READ', sub: 'config.yaml', risk: 'Low', status: 'ALLOW' },
  { icon: ListOrdered, label: 'LIST', sub: 'users table', risk: 'Low', status: 'ALLOW' },
  { icon: Edit, label: 'UPDATE', sub: 'single row', risk: 'Medium', status: 'ALLOW' },
  { icon: Database, label: 'MIGRATE', sub: 'schema change', risk: 'Medium', status: 'CONFIRM' },
  { icon: Database, label: 'BULK UPDATE', sub: '500 rows', risk: 'High', status: 'CONFIRM' },
  { icon: Flame, label: 'DELETE', sub: 'orders_prod', risk: 'Critical', status: 'BLOCK' },
];

export const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="py-24 bg-[#080b12] relative border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono mb-4">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>THE BEHAVIORAL DRIFT PROBLEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI agents don’t need to be malicious to become dangerous.
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Traditional AI security focuses heavily on prompt injection, jailbreaks, and fine-tuning alignment. But autonomous agents operating in production cause catastrophic drift through sequences of <em>individually reasonable actions</em>.
          </p>
        </div>

        {/* Escalation Step Diagram */}
        <div className="mt-16 bg-slate-950/80 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-6 flex items-center justify-between">
            <span>Progressive Session Escalation Flow</span>
            <span className="text-rose-400 flex items-center gap-1 font-semibold">
              <ShieldAlert className="w-4 h-4" /> DRIFT SCORE: 0.10 → 0.87
            </span>
          </div>

          {/* Stepped Visual Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative">
            {ESCALATION_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isFinal = idx === ESCALATION_STEPS.length - 1;
              const isWarning = idx >= 3 && !isFinal;

              return (
                <motion.div
                  key={step.label + idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border flex flex-col items-center text-center relative transition-all ${
                    isFinal
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/60 ring-1 ring-rose-500/40'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-500 mb-2">STEP 0{idx + 1}</div>
                  <div className={`p-2.5 rounded-lg mb-2 ${
                    isFinal ? 'bg-rose-900/60 text-rose-300' : isWarning ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-800 text-cyan-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-white font-mono text-sm">{step.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{step.sub}</div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Risk: {step.risk}</span>
                    <span className={`font-bold ${
                      step.status === 'ALLOW' ? 'text-emerald-400' : step.status === 'CONFIRM' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Punchline Banner */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 text-center">
            <p className="text-base sm:text-lg font-mono font-bold text-white">
              <span className="text-slate-300">Individually reasonable.</span>{' '}
              <span className="text-rose-400 uppercase underline decoration-rose-500 decoration-2 underline-offset-4">
                Collectively dangerous.
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto font-sans">
              Without trajectory awareness, traditional tools evaluate step 6 in isolation and execute catastrophic drops. Sentinel detects behavioral escalation across steps.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
