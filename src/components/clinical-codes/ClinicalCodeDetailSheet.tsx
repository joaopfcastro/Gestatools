import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icon from '../Icon';

interface ClinicalCodeDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ClinicalCodeDetailSheet({
  isOpen,
  onClose,
  title,
  children,
}: ClinicalCodeDetailSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end min-[1024px]:hidden">
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 backdrop-blur-xs"
          />

          {/* Sheet / Fullscreen Drawer Content */}
          <motion.div
            key="sheet-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative z-50 w-full md:max-w-[520px] h-[calc(var(--vv-height,100dvh))] bg-background text-on-surface shadow-2xl flex flex-col pt-[calc(48px+env(safe-area-inset-top))] md:pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-6 overflow-hidden"
          >
            {/* Header with Voltar button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-variant/50 dark:border-white/5 bg-surface/80 dark:bg-black/60 backdrop-blur-md">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors cursor-pointer"
                aria-label="Voltar para a lista de códigos"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                <span>Voltar</span>
              </button>

              <span className="text-xs font-semibold text-secondary truncate max-w-[200px]">
                {title}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-surface-variant text-secondary hover:text-on-surface cursor-pointer"
                title="Fechar detalhes"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
