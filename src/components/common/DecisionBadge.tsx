import React from 'react';
import { DecisionType } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface DecisionBadgeProps {
  decision: DecisionType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  mode?: 'simple' | 'technical';
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true,
  mode = 'technical',
}) => {
  const dec = (decision || '').toUpperCase();

  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  let Icon = CheckCircle2;
  let label = dec;

  if (dec === 'ALLOW') {
    styles = 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50 shadow-sm';
    Icon = CheckCircle2;
    label = mode === 'simple' ? 'SAFE TO PROCEED' : 'ALLOW';
  } else if (dec === 'CONFIRM') {
    styles = 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/50 shadow-sm';
    Icon = AlertTriangle;
    label = mode === 'simple' ? 'HUMAN APPROVAL REQUIRED' : 'CONFIRM';
  } else if (dec === 'BLOCK') {
    styles = 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/60 shadow-md';
    Icon = XCircle;
    label = mode === 'simple' ? 'ACTION BLOCKED' : 'BLOCK';
  } else if (dec === 'APPROVED' || dec === 'EXECUTED') {
    styles = 'bg-teal-50 dark:bg-teal-950/90 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-400/60 shadow-sm';
    Icon = ShieldCheck;
    label = mode === 'simple' ? 'APPROVED BY HUMAN' : 'APPROVED';
  } else if (dec === 'DENIED') {
    styles = 'bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-400 border-red-300 dark:border-red-500/50';
    Icon = ShieldAlert;
    label = mode === 'simple' ? 'DENIED BY HUMAN' : 'DENIED';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono border uppercase tracking-wider transition-all duration-200 ${styles} ${sizeClasses}`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{label}</span>
    </span>
  );
};

