import React from 'react';
import { Shield, Terminal, ArrowRight, Play } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onOpenConsole: () => void;
  onRunAttackDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsole, onRunAttackDemo }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#06080d]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-slate-900 dark:text-white font-mono">SENTINEL</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 px-1.5 py-0.5 rounded">RUNTIME</span>
            </div>
          </div>
        </div>

        {/* Links & Quick CTAs */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-slate-600 dark:text-slate-300">
          <a href="#problem" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">The Problem</a>
          <a href="#pipeline" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Architecture</a>
          <a href="#layers" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Three Layers</a>
          <a href="#comparison" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Attack vs Admin</a>
        </nav>

        {/* Action Buttons & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={onRunAttackDemo}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Attack Sim</span>
          </button>

          <button
            onClick={onOpenConsole}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-500/25 border border-cyan-400/50 transition-all hover:scale-105"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
