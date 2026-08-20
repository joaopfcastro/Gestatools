import { useEffect } from 'react';

/**
 * Normalizes wheel delta across different deltaModes (pixel, line, page).
 */
export function normalizeWheelDelta(event: { deltaMode: number; deltaY: number }, clientHeight: number): number {
  if (event.deltaMode === 1 /* DOM_DELTA_LINE */) {
    return event.deltaY * 16;
  }
  if (event.deltaMode === 2 /* DOM_DELTA_PAGE */) {
    return event.deltaY * clientHeight;
  }
  return event.deltaY;
}

/**
 * Checks if target element is inside a dialog, modal, or drawer that manages its own scroll.
 */
export function isExcludedTarget(target: HTMLElement | null): boolean {
  if (!target) return false;
  return Boolean(
    target.closest('[role="dialog"], [aria-modal="true"], .drawer-content')
  );
}

/**
 * Checks if target is inside the results scroll panel.
 */
export function isTargetInsideResultsPanel(target: HTMLElement | null): boolean {
  if (!target) return false;
  return Boolean(target.closest('.results-scroll-panel'));
}

/**
 * Finds the currently active (visible) results panel in the DOM.
 */
export function getActiveResultsPanel(): HTMLElement | null {
  const panels = document.querySelectorAll<HTMLElement>('.results-scroll-panel');
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    // Check if visible (not display: none or hidden parent)
    if (panel.offsetParent !== null || panel.getClientRects().length > 0) {
      return panel;
    }
  }
  return null;
}

/**
 * Checks whether a panel has vertical overflow and can be scrolled.
 */
export function canScrollPanel(panel: HTMLElement | null): boolean {
  if (!panel) return false;
  return panel.scrollHeight > panel.clientHeight;
}

/**
 * useGlobalResultsScroll
 *
 * Direct, zero-delay scroll forwarding for desktop/tablet (>= 768px).
 *
 * Rules:
 * 1. Pointer INSIDE .results-scroll-panel: Browser handles native scroll.
 *    No stopPropagation, no preventDefault, no duplicated forwarding.
 * 2. Pointer OUTSIDE .results-scroll-panel: Wheel delta is immediately forwarded
 *    to the visible results panel without smooth-scrolling or artificial delay.
 * 3. Modals and drawers maintain their own isolated scroll.
 * 4. Horizontal trackpad gestures are preserved without unwanted vertical scroll.
 * 5. Mobile (< 768px) is completely bypassed.
 */
export function useGlobalResultsScroll() {
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      // Desktop & tablet only (>= 768px). Do NOT alter mobile!
      if (window.innerWidth < 768) return;

      const target = e.target as HTMLElement | null;

      // When pointer is inside the results panel, allow native browser scroll
      if (isTargetInsideResultsPanel(target)) {
        return;
      }

      // If user is inside an open modal / dialog / drawer, preserve its own scroll
      if (isExcludedTarget(target)) {
        return;
      }

      // Do not convert predominantly horizontal gestures (e.g. trackpad swipe) into vertical scroll
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      const resultsPanel = getActiveResultsPanel();
      if (!resultsPanel || !canScrollPanel(resultsPanel)) {
        return;
      }

      const deltaY = normalizeWheelDelta(e, resultsPanel.clientHeight);
      if (deltaY === 0) return;

      // Prevent concurrent parent/window scrolling attempts
      if (e.cancelable) {
        e.preventDefault();
      }

      // Forward delta directly and immediately (instant / auto behavior)
      resultsPanel.scrollTop += deltaY;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth < 768) return;
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth < 768) return;

      const target = e.target as HTMLElement | null;

      // Inside results panel -> let native touch scroll handle it
      if (isTargetInsideResultsPanel(target)) {
        return;
      }

      if (isExcludedTarget(target)) return;

      // Don't interfere with inputs or buttons
      if (target?.closest('input, select, textarea, button, [contenteditable="true"]')) {
        return;
      }

      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;

        if (deltaY === 0) return;

        const resultsPanel = getActiveResultsPanel();
        if (resultsPanel && canScrollPanel(resultsPanel)) {
          resultsPanel.scrollTop += deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}
