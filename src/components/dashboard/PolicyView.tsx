import React, { useState } from 'react';
import { PolicyRule, RiskLevel } from '../../types';
import { RiskPill } from '../common/RiskPill';
import { Sliders, Plus, Edit2, Trash2, Check, X, ShieldAlert, Save } from 'lucide-react';

interface PolicyViewProps {
  policies: PolicyRule[];
  onUpdatePolicy: (operation: string, risk_level: RiskLevel, description?: string) => Promise<void>;
  onDeletePolicy?: (operation: string) => Promise<void>;
}

export const PolicyView: React.FC<PolicyViewProps> = ({
  policies,
  onUpdatePolicy,
  onDeletePolicy,
}) => {
  const [editingOp, setEditingOp] = useState<string | null>(null);
  const [editRisk, setEditRisk] = useState<RiskLevel>('read');
  const [editDesc, setEditDesc] = useState<string>('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newOp, setNewOp] = useState('');
  const [newRisk, setNewRisk] = useState<RiskLevel>('write');
  const [newDesc, setNewDesc] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEdit = (policy: PolicyRule) => {
    setEditingOp(policy.operation);
    setEditRisk(policy.risk_level);
    setEditDesc(policy.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingOp) return;
    await onUpdatePolicy(editingOp, editRisk, editDesc);
    setEditingOp(null);
    showToast(`Policy for '${editingOp}' updated successfully.`);
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOp.trim()) return;
    await onUpdatePolicy(newOp.trim().toLowerCase(), newRisk, newDesc.trim());
    setNewOp('');
    setNewDesc('');
    setIsAdding(false);
    showToast(`Policy for '${newOp}' added successfully.`);
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>RUNTIME RISK POLICY MATRIX</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure reversibility gates and operational risk tiers
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/80 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Cancel' : 'Add Custom Rule'}</span>
        </button>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Policy Form */}
      {isAdding && (
        <form onSubmit={handleAddPolicy} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-4">
          <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase">New Operation Policy</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Operation Name</label>
              <input
                type="text"
                value={newOp}
                onChange={(e) => setNewOp(e.target.value)}
                placeholder="e.g. purge_cache"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Risk Level</label>
              <select
                value={newRisk}
                onChange={(e) => setNewRisk(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="read">READ</option>
                <option value="write">WRITE</option>
                <option value="destructive">DESTRUCTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional policy note"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md transition-all"
            >
              Save Policy
            </button>
          </div>
        </form>
      )}

      {/* Policy Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Operation Target</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {policies.map((policy) => {
              const isEditing = editingOp === policy.operation;

              return (
                <tr key={policy.operation} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-cyan-300">
                    {policy.operation}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editRisk}
                        onChange={(e) => setEditRisk(e.target.value as RiskLevel)}
                        className="px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-white focus:outline-none"
                      >
                        <option value="read">READ</option>
                        <option value="write">WRITE</option>
                        <option value="destructive">DESTRUCTIVE</option>
                      </select>
                    ) : (
                      <RiskPill risk={policy.risk_level} size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      policy.description || 'Standard runtime classification'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/40"
                          title="Save"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingOp(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(policy)}
                        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
                        title="Edit policy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
