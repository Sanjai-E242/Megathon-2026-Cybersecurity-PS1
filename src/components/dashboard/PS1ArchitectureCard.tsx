import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, RotateCcw, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Action, DecisionResult } from '../../types';
import { DecisionBadge } from '../common/DecisionBadge';

interface PS1ArchitectureCardProps {
  lastAction?: Action | null;
  lastDecision?: DecisionResult | null;
  viewMode?: 'simple' | 'technical';
}

export const PS1ArchitectureCard: React.FC<PS1ArchitectureCardProps> = ({
  lastAction,
  lastDecision,
  viewMode = 'simple',
}) => {
  const isSimple = viewMode === 'simple';

  // Fallbacks if no action evaluated yet
  const action = lastAction || {
    principal_id: 'user_42',
    operation: 'read_file',
    target: 'config.yaml',
    scope_required: 'file.read',
    risk_class: 'read',
  };

  const decision = lastDecision || {
    decision: 'ALLOW' as const,
    auth_ok: true,
    risk_class: 'read' as const,
    requires_human_confirm: false,
    drift_score: 0.05,
    confidence_score: 0.25,
    confidence_level: 'LOW' as const,
    reason: 'Within normal runtime policy',
    human_explanation: 'Allowed. The agent is authorized and the action presents low operational risk within normal behavioral patterns.',
  };

  const isBlocked = decision.decision === 'BLOCK' || decision.decision === 'DENIED';
  const isConfirm = decision.decision === 'CONFIRM';
  const isAllow = decision.decision === 'ALLOW' || decision.decision === 'APPROVED';

  const authPassed = decision.auth_ok;
  const isDestructive = decision.risk_class === 'destructive';
  const reversibilityPassed = !decision.requires_human_confirm && !isDestructive;
  const driftHigh = decision.drift_score > 0.60;
  const driftModerate = decision.drift_score > 0.35 && !driftHigh;

  const driftPct = Math.round(decision.drift_score * 100);
  const confPct = Math.round((decision.confidence_score ?? 0.45) * 100);
  const confLevel = decision.confidence_level ?? (confPct >= 70 ? 'HIGH' : confPct >= 40 ? 'MEDIUM' : 'LOW');

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 transition-colors duration-200">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {isSimple ? 'WHY DID SENTINEL MAKE THIS DECISION?' : 'PS1 THREE-LAYER ENFORCEMENT ARCHITECTURE'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-sans">
            Every proposed AI agent action is evaluated through three independent, deterministic security gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Current Verdict:</span>
          <DecisionBadge decision={decision.decision} size="sm" mode={isSimple ? 'simple' : 'technical'} />
        </div>
      </div>

      {/* Three PS1 Control Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        
        {/* CHECK 1: AUTHORIZATION BOUNDARY */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
          !authPassed
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/70 shadow-sm'
            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-500/40'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>CHECK 1: AUTHORIZATION</span>
              </span>
              {authPassed ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> FAIL
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-xs font-sans">
              "Is this agent allowed to perform this action?"
            </h3>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {authPassed
                ? `Agent identity '${action.principal_id}' has verified permission for scope '${action.scope_required}'.`
                : `Agent '${action.principal_id}' lacks required permission '${action.scope_required}'. Deterministically blocked.`}
            </p>
          </div>

          {!isSimple && (
            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
              Scope Check: <code className="text-indigo-600 dark:text-indigo-400">{action.scope_required}</code>
            </div>
          )}
        </div>

        {/* CHECK 2: REVERSIBILITY GATE */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
          decision.requires_human_confirm || isDestructive
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/70 shadow-sm'
            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-500/40'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>CHECK 2: REVERSIBILITY</span>
              </span>
              {decision.requires_human_confirm || isDestructive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> GATED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SAFE
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-xs font-sans">
              "Can this action safely be undone?"
            </h3>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {isDestructive
                ? `Destructive action (${action.operation}) modifies or destroys state. Reversibility gate requires explicit human clearance.`
                : decision.requires_human_confirm
                ? `High-impact operation (bulk update). Paused awaiting operator sign-off.`
                : `Low/reversible risk level (${decision.risk_class || 'read'}). Can proceed without manual gating.`}
            </p>
          </div>

          {!isSimple && (
            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
              Risk Class: <code className="text-amber-600 dark:text-amber-400 uppercase">{decision.risk_class || 'read'}</code>
            </div>
          )}
        </div>

        {/* CHECK 3: BEHAVIOR & TRAJECTORY */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
          driftHigh
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/70 shadow-sm'
            : driftModerate
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/70 shadow-sm'
            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-500/40'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                <span>CHECK 3: BEHAVIOR</span>
              </span>
              {driftHigh ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> HIGH DRIFT
                </span>
              ) : driftModerate ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> ELEVATED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> NORMAL
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-xs font-sans">
              "Does the agent's behavior show escalating drift?"
            </h3>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {driftHigh
                ? `Behavioral drift is ${driftPct}% (Critical). Rapid escalation from reconnaissance to high-risk tools detected.`
                : driftModerate
                ? `Behavioral drift is ${driftPct}% (Elevated). Multi-resource activity observed.`
                : `Behavioral drift is ${driftPct}% (Normal). Activity matches expected operational trajectory.`}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Evidence: <strong className="text-cyan-600 dark:text-cyan-400">{confPct}% ({confLevel})</strong></span>
            <span>Drift: <strong className="text-rose-600 dark:text-rose-400">{driftPct}%</strong></span>
          </div>
        </div>

      </div>

      {/* Human Decision Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans ${
        isBlocked
          ? 'bg-rose-100/80 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-medium'
          : isConfirm
          ? 'bg-amber-100/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium'
          : 'bg-emerald-100/80 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
      }`}>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 shrink-0">
            {isBlocked ? (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : isConfirm ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider font-mono mr-1.5">
              FINAL DECISION: {decision.decision}
            </span>
            <span>— {decision.human_explanation || decision.reason}</span>
          </div>
        </div>

        <div className="shrink-0 font-mono text-[11px] font-bold">
          {isBlocked ? '🔴 ACTION STOPPED BEFORE EXECUTION' : isConfirm ? '🟡 AWAITING HUMAN OPERATOR APPROVAL' : '🟢 CLEARED FOR EXECUTION'}
        </div>
      </div>
    </div>
  );
};
