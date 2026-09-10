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
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-950/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-950/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-950/10',
    indigo: 'border-indigo-500/20 text-indigo-400 bg-indigo-950/10',
  }[color];

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${colorStyles} hover:border-opacity-40`}>
      <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
        <span>{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1">
        <span>{displayValue}</span>
      </div>
      {sublabel && <div className="text-[11px] text-slate-500 mt-1">{sublabel}</div>}
    </div>
  );
};
