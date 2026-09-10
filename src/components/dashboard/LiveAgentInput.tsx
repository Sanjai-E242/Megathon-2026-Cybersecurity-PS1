import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, Terminal, Zap, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Sparkles, Layers } from 'lucide-react';
import { Action, DecisionResult, RiskLevel } from '../../types';
import { api } from '../../lib/api';
import { DecisionBadge } from '../common/DecisionBadge';
import { RiskPill } from '../common/RiskPill';

interface LiveAgentInputProps {
  onActionEvaluated?: (action: Action, decision: DecisionResult) => void;
}

const PRESETS = [
  {
    name: 'Attack: Drop Production Table (500k rows)',
    principal_id: 'user_42',
    session_id: 'sess_live_attack_01',
    resource_type: 'database',
    operation: 'delete_table',
    scope_required: 'db.write',
    target: 'orders_prod',
    metadata: { row_count_estimate: 500000 },
  },
  {
    name: 'Legit: Staging Cleanup (Requires Confirm)',
    principal_id: 'admin_migration_01',
    session_id: 'sess_live_legit_02',
    resource_type: 'database',
    operation: 'delete_table',
    scope_required: 'db.write',
    target: 'staging_backup_table',
    metadata: { row_count_estimate: 100 },
  },
  {
    name: 'Safe: Read System Config',
    principal_id: 'agent_support_01',
    session_id: 'sess_live_safe_03',
    resource_type: 'file',
    operation: 'read_file',
    scope_required: 'file.read',
    target: 'config.yaml',
    metadata: {},
  },
  {
    name: 'Unauthorized: IAM Privilege Escalation',
    principal_id: 'agent_support_01',
    session_id: 'sess_live_unauth_04',
    resource_type: 'cloud_iam',
    operation: 'revoke_all_access',
    scope_required: 'cloud.iam.admin',
    target: 'iam_root_policy',
    metadata: {},
  },
];

export const LiveAgentInput: React.FC<LiveAgentInputProps> = ({ onActionEvaluated }) => {
  const [principalId, setPrincipalId] = useState('user_42');
  const [sessionId, setSessionId] = useState('sess_live_stream_01');
  const [resourceType, setResourceType] = useState('database');
  const [operation, setOperation] = useState('delete_table');
  const [scopeRequired, setScopeRequired] = useState('db.write');
  const [target, setTarget] = useState('orders_prod');
  const [metadataStr, setMetadataStr] = useState('{\n  "row_count_estimate": 500000\n}');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<DecisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPrincipalId(preset.principal_id);
    setSessionId(preset.session_id);
    setResourceType(preset.resource_type);
    setOperation(preset.operation);
    setScopeRequired(preset.scope_required);
    setTarget(preset.target);
    setMetadataStr(JSON.stringify(preset.metadata, null, 2));
    setLastResult(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let parsedMetadata: Record<string, unknown> = {};
      try {
        if (metadataStr.trim()) {
          parsedMetadata = JSON.parse(metadataStr);
        }
      } catch (jsonErr) {
        setErrorMsg('Invalid JSON in metadata field');
        setIsSubmitting(false);
        return;
      }

      const payload: Partial<Action> = {
        action_id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        session_id: sessionId.trim() || `sess_${Date.now()}`,
        principal_id: principalId.trim(),
        resource_type: resourceType.trim(),
        operation: operation.trim(),
        scope_required: scopeRequired.trim(),
        target: target.trim(),
        metadata: parsedMetadata,
        timestamp: new Date().toISOString(),
      };

      const result = await api.submitAction(payload);
      setLastResult(result);

      if (onActionEvaluated) {
        onActionEvaluated(
          {
            ...payload,
            action_id: result.action_id,
            timestamp: result.created_at,
            decision: result.decision,
            reason: result.reason,
            risk_class: result.risk_class,
            drift_score: result.drift_score,
            requires_human_confirm: result.requires_human_confirm,
            execution_latency_ms: result.execution_latency_ms,
          } as Action,
          result
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit action to Sentinel engine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>LIVE AGENT INPUT DISPATCHER</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject real-time tool calls directly from an external AI agent or custom simulator
          </p>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
          <Terminal className="w-3.5 h-3.5" />
          <span>ENDPOINT: POST /api/actions</span>
        </div>
      </div>

      {/* Preset Action Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Scenario Presets</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono transition-all text-slate-300 hover:text-white"
            >
              <div className="font-semibold text-cyan-300 truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {p.operation} → {p.target}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Principal ID */}
          <div>
            <label className="block text-slate-400 mb-1">Principal ID</label>
            <input
              type="text"
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              placeholder="e.g. user_42 or agent_01"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Session ID */}
          <div>
            <label className="block text-slate-400 mb-1">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g. sess_live_01"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-slate-400 mb-1">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="database">database</option>
              <option value="file">file</option>
              <option value="cloud_iam">cloud_iam</option>
              <option value="payment_gateway">payment_gateway</option>
              <option value="network">network</option>
            </select>
          </div>

          {/* Operation */}
          <div>
            <label className="block text-slate-400 mb-1">Operation</label>
            <input
              type="text"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              placeholder="e.g. delete_table, read_file"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Scope Required */}
          <div>
            <label className="block text-slate-400 mb-1">Scope Required</label>
            <input
              type="text"
              value={scopeRequired}
              onChange={(e) => setScopeRequired(e.target.value)}
              placeholder="e.g. db.write, file.read"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Target Resource */}
          <div>
            <label className="block text-slate-400 mb-1">Target Resource</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. orders_prod, schema.sql"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

        </div>

        {/* Metadata JSON Field */}
        <div>
          <label className="block text-slate-400 mb-1">Metadata (JSON)</label>
          <textarea
            value={metadataStr}
            onChange={(e) => setMetadataStr(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500 resize-y"
            placeholder='{ "row_count_estimate": 500000 }'
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            Action will be deterministically routed through Authorization, Reversibility, Trajectory, and Decision matrix.
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/25 border border-indigo-400/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'SEND TO SENTINEL'}</span>
          </button>
        </div>
      </form>

      {/* Live Evaluated Result Box */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
            lastResult.decision === 'BLOCK'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50'
              : lastResult.decision === 'CONFIRM'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/50'
              : 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/50'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Action ID:</span>
              <span className="text-white font-bold">{lastResult.action_id}</span>
            </div>

            <div className="flex items-center gap-3">
              <RiskPill risk={lastResult.risk_class} size="sm" />
              <span className="text-slate-300 font-bold">
                DRIFT: {(lastResult.drift_score * 100).toFixed(0)}%
              </span>
              <DecisionBadge decision={lastResult.decision} size="md" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 font-bold">REASON: </span>
              <span>{lastResult.reason}</span>
            </div>
            <div className="text-slate-400">
              Evaluation Latency: <span className="text-cyan-400 font-semibold">{lastResult.execution_latency_ms || 10}ms</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
