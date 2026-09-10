import React from 'react';
import { Principal } from '../../types';
import { KeyRound, Bot, User, Check, X } from 'lucide-react';

interface PrincipalViewProps {
  principals: Principal[];
}

const COMMON_ALL_SCOPES = ['db.read', 'db.write', 'db.migrate', 'file.read', 'cloud.iam.admin', 'network.access'];

export const PrincipalView: React.FC<PrincipalViewProps> = ({ principals }) => {
  return (
    <div className="cyber-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>PRINCIPALS &amp; AUTHORIZATION SCOPES</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Role-based and cryptographic scope matrix enforced by Sentinel
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {principals.length} Configured Principals
        </span>
      </div>

      {/* Grid of Principals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {principals.map((principal) => {
          const isAgent = principal.principal_id.startsWith('agent_') || principal.principal_id.startsWith('external-');
          const scopes = principal.authorized_scopes || [];

          return (
            <div
              key={principal.principal_id}
              className="p-5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all shadow-sm"
            >
              {/* Top info */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isAgent
                      ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/40'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40'
                  }`}>
                    {isAgent ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-slate-900 dark:text-white text-sm">{principal.principal_id}</h3>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Role: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{principal.role}</span></span>
                  </div>
                </div>

                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  {scopes.length} Scopes Active
                </span>
              </div>

              {/* Scope Evaluation Matrix */}
              <div className="space-y-2 text-xs font-mono">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Scope Permissions</div>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_ALL_SCOPES.map((scope) => {
                    const isAuthorized = scopes.includes(scope);
                    return (
                      <div
                        key={scope}
                        className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                          isAuthorized
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <span className="truncate">{scope}</span>
                        {isAuthorized ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
