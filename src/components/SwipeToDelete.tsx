import React, { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import Icon from './Icon';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  key?: React.Key;
}

export default function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const controls = useAnimation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDeleting) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -80 || velocity < -500) {
      setIsDeleting(true);
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.2 } });
      onDelete();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 w-full bg-error flex items-center justify-end px-6 rounded-xl">
        <Icon name="delete" className="text-white text-[24px]" />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ right: 0, left: -500 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-surface z-10 w-full rounded-xl touch-pan-y"
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
