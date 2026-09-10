import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface MetricCounterProps {
  value: number;
  label: string;
  sublabel?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  icon?: React.ReactNode;
  formatter?: (val: number) => string;
}

export const MetricCounter: React.FC<MetricCounterProps> = ({
  value,
  label,
  sublabel,
  color = 'cyan',
  icon,
  formatter = (v) => Math.round(v).toLocaleString(),
}) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => formatter(current));
  const [displayValue, setDisplayValue] = useState<string>('0');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  const colorStyles = {
    cyan: 'border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 bg-white/90 dark:bg-cyan-950/10 shadow-sm',
    emerald: 'border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-white/90 dark:bg-emerald-950/10 shadow-sm',
    amber: 'border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 bg-white/90 dark:bg-amber-950/10 shadow-sm',
    rose: 'border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 bg-white/90 dark:bg-rose-950/10 shadow-sm',
    indigo: 'border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 bg-white/90 dark:bg-indigo-950/10 shadow-sm',
  }[color];

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${colorStyles} hover:border-opacity-60 flex flex-col justify-between h-full min-h-[105px]`}>
      <div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono mb-1">
          <span className="font-semibold truncate max-w-[130px]" title={label}>{label}</span>
          {icon && <div className="text-slate-400 dark:text-slate-400 shrink-0">{icon}</div>}
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1">
          <span>{displayValue}</span>
        </div>
      </div>
      {sublabel && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={sublabel}>{sublabel}</div>}
    </div>
  );
};
