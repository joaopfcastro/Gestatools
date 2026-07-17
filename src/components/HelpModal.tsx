import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icon from './Icon';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose, title, children }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-md bg-surface rounded-[24px] shadow-xl overflow-hidden border border-surface-variant/50"
          >
            <div className="flex justify-between items-center p-5 border-b border-surface-variant/50">
              <h3 className="font-title-md font-bold text-on-surface text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 text-secondary hover:bg-surface-variant/30 rounded-full transition-colors cursor-pointer"
              >
                <Icon name="close" className="text-[24px]" />
              </button>
            </div>
            <div className="p-6 text-[15px] text-secondary leading-relaxed max-h-[calc(var(--vv-height,100dvh)-env(safe-area-inset-top)-env(safe-area-inset-bottom)-120px)] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
