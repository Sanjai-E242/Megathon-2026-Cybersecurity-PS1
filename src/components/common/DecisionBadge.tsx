import React from 'react';
import { DecisionType } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface DecisionBadgeProps {
  decision: DecisionType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true,
}) => {
  const dec = (decision || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = CheckCircle2;
  let label = dec;

  if (dec === 'ALLOW') {
    styles = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/20';
    Icon = CheckCircle2;
    label = 'ALLOW';
  } else if (dec === 'CONFIRM') {
    styles = 'bg-amber-950/80 text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/20 animate-pulse';
    Icon = AlertTriangle;
    label = 'CONFIRM';
  } else if (dec === 'BLOCK') {
    styles = 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-md shadow-rose-500/30';
    Icon = XCircle;
    label = 'BLOCK';
  } else if (dec === 'APPROVED' || dec === 'EXECUTED') {
    styles = 'bg-teal-950/90 text-teal-300 border-teal-400/60 shadow-sm shadow-teal-500/20';
    Icon = ShieldCheck;
    label = 'APPROVED';
  } else if (dec === 'DENIED') {
    styles = 'bg-red-950/90 text-red-400 border-red-500/50';
    Icon = ShieldAlert;
    label = 'DENIED';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
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
