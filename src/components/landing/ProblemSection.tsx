import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, ListOrdered, Edit, Database, Flame, ShieldAlert } from 'lucide-react';

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
    <section id="problem" className="py-24 bg-slate-100/70 dark:bg-[#080b12] relative border-t border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono mb-4">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>THE BEHAVIORAL DRIFT PROBLEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI agents don’t need to be malicious to become dangerous.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Traditional AI security focuses heavily on prompt injection, jailbreaks, and fine-tuning alignment. But autonomous agents operating in production cause catastrophic drift through sequences of <em>individually reasonable actions</em>.
          </p>
        </div>

        {/* Escalation Step Diagram */}
        <div className="mt-16 bg-white dark:bg-slate-950/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-colors duration-200">
          
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center justify-between">
            <span>Progressive Session Escalation Flow</span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
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
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/60 shadow-md ring-1 ring-rose-400 dark:ring-rose-500/40'
                      : isWarning
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-2">
                    STEP 0{idx + 1}
                  </div>

                  <div className={`p-2.5 rounded-lg mb-2 ${
                    isFinal ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300' :
                    isWarning ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' :
                    'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="font-bold text-slate-900 dark:text-white font-mono text-xs truncate max-w-full">
                    {step.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full mt-0.5">
                    {step.sub}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 w-full flex items-center justify-center">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      step.status === 'BLOCK' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' :
                      step.status === 'CONFIRM' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                      'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-300 text-center">
            💡 <strong>The Sentinel Insight:</strong> Every individual action looks legitimate in isolation. Only a trajectory-aware middleware can detect the cumulative escalation pattern before catastrophic execution.
          </div>

        </div>

      </div>
    </section>
  );
};
