import React from 'react';
import { RiskLevel } from '../../types';
import { Eye, Edit3, Flame, HelpCircle } from 'lucide-react';

interface RiskPillProps {
  risk: RiskLevel | string;
  size?: 'sm' | 'md';
}

export const RiskPill: React.FC<RiskPillProps> = ({ risk, size = 'md' }) => {
  const r = (risk || '').toLowerCase();

  let styles = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let Icon = HelpCircle;
  let label = 'UNKNOWN';

  if (r === 'read') {
    styles = 'bg-sky-950/60 text-sky-400 border-sky-500/30';
    Icon = Eye;
    label = 'READ';
  } else if (r === 'write') {
    styles = 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30';
    Icon = Edit3;
    label = 'WRITE';
  } else if (r === 'destructive') {
    styles = 'bg-red-950/80 text-red-400 border-red-500/50 shadow-sm shadow-red-500/20';
    Icon = Flame;
    label = 'DESTRUCTIVE';
  }

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-0.5 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded font-mono uppercase tracking-wider border ${styles} ${sizeClasses}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
