import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'amber';
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  variant = 'default',
  maxWidth = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const borderVariant = {
    default: 'border-cyan-400 dark:border-cyan-500/30 shadow-cyan-950/20',
    amber: 'border-amber-400 dark:border-amber-500/40 shadow-amber-950/20',
    danger: 'border-rose-400 dark:border-rose-500/40 shadow-rose-950/20',
  }[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 dark:bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white dark:bg-[#0c101a] border rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 z-[100] transition-colors duration-200 ${borderVariant}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-mono">
                  {title}
                </h3>
                {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body with Internal Scroll */}
            <div className="flex-1 overflow-y-auto pr-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
