import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { DecisionBadge } from '../common/DecisionBadge';
import { RiskPill } from '../common/RiskPill';
import { ShieldCheck, Download, Search, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (decisionFilter !== 'ALL' && log.decision !== decisionFilter) return false;
    if (riskFilter !== 'ALL' && log.risk_class !== riskFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        log.session_id.toLowerCase().includes(q) ||
        log.principal_id.toLowerCase().includes(q) ||
        (log.operation && log.operation.toLowerCase().includes(q)) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Log ID', 'Session', 'Principal', 'Operation', 'Target', 'Risk', 'Decision', 'Reason', 'Actor'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.id}"`,
      `"${l.session_id}"`,
      `"${l.principal_id}"`,
      `"${l.operation || ''}"`,
      `"${l.target || ''}"`,
      `"${l.risk_class || ''}"`,
      `"${l.decision || l.event_type}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.actor}"`,
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sentinel_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-700 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>ENTERPRISE SECURITY AUDIT TRAIL</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable runtime telemetry and human confirmation logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search principal, session, target, or operation..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Decision Filter */}
        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Decisions</option>
          <option value="ALLOW">ALLOW</option>
          <option value="CONFIRM">CONFIRM</option>
          <option value="BLOCK">BLOCK</option>
          <option value="APPROVED">APPROVED</option>
          <option value="DENIED">DENIED</option>
        </select>

        {/* Risk Filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="read">READ</option>
          <option value="write">WRITE</option>
          <option value="destructive">DESTRUCTIVE</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Principal</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No security events matching current criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-indigo-300 font-semibold">
                    {log.principal_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {log.session_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-cyan-300">
                    {log.operation || log.event_type}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                    {log.target || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.risk_class ? <RiskPill risk={log.risk_class} size="sm" /> : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DecisionBadge decision={log.decision || log.event_type} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={log.reason}>
                    {log.reason || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                    {log.actor}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
