import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface SkeletonProps {
  className?: string;
  type?: 'pulse' | 'spinner' | 'dots';
}

export default function Skeleton({ className = '', type = 'pulse' }: SkeletonProps) {
  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-primary opacity-50" />
        </motion.div>
      </div>
    );
  }
  
  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-1.5 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`animate-pulse bg-surface-variant/80 rounded-md ${className}`}></div>
  );
}
