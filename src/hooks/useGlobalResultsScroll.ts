import { useEffect } from 'react';

/**
 * useGlobalResultsScroll
 *
 * High-performance hook for handling scroll events on desktop/tablet (>= 768px).
 *
 * Key Optimizations:
 * 1. Target Detection: Efficiently checks if the event target originates within a `.results-scroll-panel`
 *    and triggers `stopPropagation()` strictly when the target is inside the results panel.
 * 2. requestAnimationFrame Scheduling: Batches and throttles external wheel and touch deltas using rAF,
 *    eliminating layout thrashing and preventing CPU/event loop overhead.
 * 3. Scope Discipline: Completely bypasses mobile (< 768px) and interactive elements (dialogs, sidebars, inputs).
 */
export function useGlobalResultsScroll() {
  useEffect(() => {
    let touchStartY = 0;
    let pendingWheelDeltaY = 0;
    let pendingTouchDeltaY = 0;
    let rafWheelId: number | null = null;
    let rafTouchId: number | null = null;

    // Fast cached helper to find the active results panel
    const getActiveResultsPanel = (): HTMLElement | null => {
      const panels = document.querySelectorAll<HTMLElement>('.results-scroll-panel');
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        if (panel.offsetParent !== null) {
          return panel;
        }
      }
      return null;
    };

    const isExcluded = (target: HTMLElement | null): boolean => {
      if (!target) return false;
      return Boolean(
        target.closest(
          '.app-sidebar, [role="dialog"], [aria-modal="true"], .glass-nav-top, .drawer-content'
        )
      );
    };

    const flushWheelScroll = () => {
      rafWheelId = null;
      if (pendingWheelDeltaY === 0) return;

      const resultsPanel = getActiveResultsPanel();
      if (resultsPanel && resultsPanel.scrollHeight > resultsPanel.clientHeight) {
        resultsPanel.scrollTop += pendingWheelDeltaY;
      }
      pendingWheelDeltaY = 0;
    };

    const flushTouchScroll = () => {
      rafTouchId = null;
      if (pendingTouchDeltaY === 0) return;

      const resultsPanel = getActiveResultsPanel();
      if (resultsPanel && resultsPanel.scrollHeight > resultsPanel.clientHeight) {
        resultsPanel.scrollTop += pendingTouchDeltaY;
      }
      pendingTouchDeltaY = 0;
    };

    const handleWheel = (e: WheelEvent) => {
      // Desktop & tablet only (>= 768px). Do NOT alter mobile!
      if (window.innerWidth < 768) return;

      const target = e.target as HTMLElement | null;
      const isTargetInResultsPanel = Boolean(target?.closest('.results-scroll-panel'));

      // Fire stopPropagation strictly when the target is within the results panel
      if (isTargetInResultsPanel) {
        e.stopPropagation();
        return;
      }

      // If user is inside an open popup modal / sidebar dialog, do not forward
      if (isExcluded(target)) {
        return;
      }

      // Accumulate delta and schedule through requestAnimationFrame to avoid main-thread overload
      pendingWheelDeltaY += e.deltaY;
      if (rafWheelId === null) {
        rafWheelId = requestAnimationFrame(flushWheelScroll);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth < 768) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.results-scroll-panel')) {
        e.stopPropagation();
      }
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth < 768) return;

      const target = e.target as HTMLElement | null;
      const isTargetInResultsPanel = Boolean(target?.closest('.results-scroll-panel'));

      // Stop propagation strictly if touch target is inside the results panel
      if (isTargetInResultsPanel) {
        e.stopPropagation();
        return;
      }

      if (isExcluded(target)) return;

      if (target?.closest('input, select, textarea, button, [contenteditable="true"]')) {
        return;
      }

      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;

        pendingTouchDeltaY += deltaY;
        if (rafTouchId === null) {
          rafTouchId = requestAnimationFrame(flushTouchScroll);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      if (rafWheelId !== null) {
        cancelAnimationFrame(rafWheelId);
      }
      if (rafTouchId !== null) {
        cancelAnimationFrame(rafTouchId);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}
