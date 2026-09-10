import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SENTINEL_ERROR_BOUNDARY] Uncaught frontend exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#06080d] text-slate-100 flex items-center justify-center p-6 font-mono">
          <div className="max-w-lg w-full p-8 rounded-2xl bg-[#0e1320] border border-rose-500/50 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-3">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>RUNTIME EXCEPTION CAUGHT</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                SENTINEL RUNTIME
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Application initialization caught a runtime boundary error.
              </p>
            </div>

            {/* Error Message */}
            {this.state.error && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 overflow-x-auto">
                <div className="text-rose-400 font-bold">Error Message:</div>
                <div className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                  {this.state.error.message}
                </div>
              </div>
            )}

            {/* Recovery Action */}
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application Console</span>
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
