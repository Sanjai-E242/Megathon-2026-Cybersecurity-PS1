import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Activity, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

export const MobileHeroFallback: React.FC = () => {
  return (
    <div className="relative w-full py-8 px-4 flex flex-col items-center justify-center">
      {/* Animated Glowing Ring */}
      <div className="relative w-56 h-56 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-950/20 backdrop-blur-md">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40"
        />

        {/* Core Shield */}
        <div className="relative z-10 w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-900/60 to-slate-900 border border-cyan-400/50 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-10 h-10 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-wider text-cyan-300 font-semibold mt-1">SENTINEL</span>
        </div>

        {/* Orbiting Decision Badges */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ALLOW</span>
        </motion.div>

        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-3 bg-amber-950/90 border border-amber-500/60 text-amber-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-amber-500/20"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>CONFIRM</span>
        </motion.div>

        <motion.div
          animate={{ x: [4, -4, 4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-3 bg-rose-950/90 border border-rose-500/60 text-rose-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-rose-500/20"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>BLOCK</span>
        </motion.div>
      </div>

      {/* Action Pipeline Stream */}
      <div className="mt-8 flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
        <span className="text-indigo-400">AI AGENT</span>
        <ArrowRight className="w-3 h-3 text-slate-500" />
        <span className="text-cyan-400 font-semibold">SENTINEL</span>
        <ArrowRight className="w-3 h-3 text-slate-500" />
        <span className="text-emerald-400">DATABASE</span>
      </div>
    </div>
  );
};
