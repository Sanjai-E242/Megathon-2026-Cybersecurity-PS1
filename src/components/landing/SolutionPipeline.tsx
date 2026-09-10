import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowDown, KeyRound, Undo2, LineChart, ShieldAlert, Cpu } from 'lucide-react';

const PIPELINE_NODES = [
  { id: 'agent', icon: Bot, label: 'AI AGENT', desc: 'Autonomous tool invocation', border: 'border-indigo-300 dark:border-indigo-500/40' },
  { id: 'ingest', icon: ArrowDown, label: 'INGEST', desc: 'Interception hook & telemetry', border: 'border-cyan-300 dark:border-cyan-500/40' },
  { id: 'auth', icon: KeyRound, label: '1. AUTHORIZATION', desc: 'Principal scopes & roles validation', border: 'border-blue-300 dark:border-blue-500/40' },
  { id: 'reversibility', icon: Undo2, label: '2. REVERSIBILITY', desc: 'Read / Write / Destructive gate', border: 'border-amber-300 dark:border-amber-500/40' },
  { id: 'trajectory', icon: LineChart, label: '3. TRAJECTORY', desc: 'Rolling session drift score (0→1)', border: 'border-violet-300 dark:border-violet-500/40' },
  { id: 'decision', icon: ShieldAlert, label: 'DECISION MATRIX', desc: 'ALLOW / CONFIRM / BLOCK', border: 'border-teal-300 dark:border-teal-500/40' },
  { id: 'execution', icon: Cpu, label: 'EXECUTION TARGET', desc: 'DB, Cloud API, File System', border: 'border-slate-300 dark:border-slate-600/40' },
];

export const SolutionPipeline: React.FC = () => {
  return (
    <section id="pipeline" className="py-24 bg-white dark:bg-[#06080d] relative overflow-hidden transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>DETERMINISTIC MIDDLEWARE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security at runtime, where actions actually happen.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Sentinel sits synchronously on the execution boundary. Every tool call must pass through authorization, reversibility classification, and session trajectory scoring before reaching infrastructure.
          </p>
        </div>

        {/* Pipeline Nodes Animation */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-indigo-300 via-cyan-400 to-emerald-300 dark:from-indigo-500/30 dark:via-cyan-500/50 dark:to-emerald-500/30 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10">
            {PIPELINE_NODES.map((node, idx) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12, duration: 0.4 }}
                  className={`cyber-panel p-4 rounded-xl border ${node.border} flex flex-col items-center text-center relative group hover:border-cyan-400/80 transition-all`}
                >
                  {/* Step pill */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider mb-1">
                    {node.label}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {node.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
