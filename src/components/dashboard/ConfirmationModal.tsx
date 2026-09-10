import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../common/Modal';
import { Action, DecisionResult } from '../../types';
import { ShieldAlert, CheckCircle2, XCircle, Flame, UserCheck, Check, KeyRound, Cpu } from 'lucide-react';
import { RiskPill } from '../common/RiskPill';

interface ConfirmationModalProps {
  isOpen: boolean;
  action: Action | null;
  onApprove: (actionId: string) => Promise<void>;
  onDeny: (actionId: string) => Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  action,
  onApprove,
  onDeny,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalState, setApprovalState] = useState<'idle' | 'approved' | 'denied'>('idle');

  if (!action) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(action.action_id);
      setApprovalState('approved');
      setTimeout(() => {
        setApprovalState('idle');
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      await onDeny(action.action_id);
      setApprovalState('denied');
      setTimeout(() => {
        setApprovalState('idle');
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Human Approval Required"
      subtitle="Autonomous execution paused pending Security Operations Center confirmation"
      variant="amber"
    >
      <div className="space-y-5 text-xs font-mono">
        
        {/* State Banner */}
        <AnimatePresence mode="wait">
          {approvalState === 'approved' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-teal-950/80 border border-teal-500/80 text-teal-200 flex items-center justify-between shadow-lg shadow-teal-950/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal-400 animate-bounce" />
                <div>
                  <div className="font-bold text-sm">✓ ACTION APPROVED &amp; SANCTIONED</div>
                  <div className="text-[11px] text-teal-300">Dispatching tool call to target infrastructure...</div>
                </div>
              </div>
              <span className="font-bold text-xs bg-teal-900/60 px-2.5 py-1 rounded border border-teal-400">
                EXECUTED
              </span>
            </motion.div>
          ) : approvalState === 'denied' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <div>
                  <div className="font-bold text-sm">✕ ACTION REJECTED</div>
                  <div className="text-[11px] text-rose-300">Execution aborted. Interception recorded in audit trail.</div>
                </div>
              </div>
              <span className="font-bold text-xs bg-rose-900/60 px-2.5 py-1 rounded border border-rose-400">
                BLOCKED
              </span>
            </motion.div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                Runtime Reversibility Gate intercepted a sensitive operation. Verify scope and context before permitting execution.
              </span>
            </div>
          )}
        </AnimatePresence>

        {/* Structured Details Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Operation:</span>
            <span className="text-white font-bold text-sm text-cyan-300">{action.operation}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Target Resource:</span>
            <span className="text-amber-300 font-mono font-semibold">{action.target}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Principal:</span>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="font-semibold">{action.principal_id}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Risk Classification:</span>
            <RiskPill risk={action.risk_class || 'destructive'} size="sm" />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Trajectory Drift Score:</span>
            <span className="text-amber-400 font-bold">
              {action.drift_score !== undefined ? (action.drift_score * 100).toFixed(0) : 62}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Scope Authorization:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{action.scope_required} (Authorized)</span>
            </span>
          </div>

        </div>

        {/* Policy Reason */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
          <span className="text-slate-500 font-bold block mb-1">EVALUATION REASON:</span>
          <span>{action.reason || 'Destructive operation requires explicit human sign-off.'}</span>
        </div>

        {/* Action Buttons */}
        {approvalState === 'idle' && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleDeny}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Deny Action</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 border border-emerald-400/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Action</span>
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
};
