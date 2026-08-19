import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Icon from './Icon';
import { hapticLight } from '../utils/haptics';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose, title, children }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed bottom-0 md:bottom-auto left-0 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[160] w-full md:w-[90%] md:max-w-md bg-surface rounded-t-[24px] md:rounded-[24px] shadow-xl overflow-hidden border-t md:border border-surface-variant/50 flex flex-col max-h-[85dvh] md:max-h-[80vh]"
          >
            <header className="flex justify-between items-center p-5 border-b border-surface-variant/50 shrink-0">
              <h3 className="font-title-md font-bold text-on-surface text-lg">{title}</h3>
              <button
                onClick={() => {
                  hapticLight();
                  onClose();
                }}
                className="p-2 min-w-11 min-h-11 md:p-2 md:min-w-0 md:min-h-0 flex items-center justify-center text-secondary hover:bg-surface-variant/30 rounded-full transition-colors cursor-pointer"
              >
                <Icon name="close" className="icon-inline" />
              </button>
            </header>
            <div className="p-6 text-[15px] text-secondary leading-relaxed flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {children}
            </div>
            {/* Safe area spacing for mobile bottom sheet */}
            <div className="md:hidden pb-[var(--safe-bottom,0px)] shrink-0 bg-surface"></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
