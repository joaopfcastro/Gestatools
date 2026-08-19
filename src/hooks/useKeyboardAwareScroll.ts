import { useEffect, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let rafId: number | null = null;
    let scrollTimeout: NodeJS.Timeout | null = null;

    const lockWindowScroll = () => {
      if (typeof window === 'undefined') return;
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
      if (document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
    };

    const setKeyboardState = (isOpen: boolean) => {
      if (typeof document === 'undefined') return;
      if (isOpen) {
        document.documentElement.setAttribute('data-keyboard-open', 'true');
        document.body.setAttribute('data-keyboard-open', 'true');
      } else {
        document.documentElement.removeAttribute('data-keyboard-open');
        document.body.removeAttribute('data-keyboard-open');
      }
    };

    const performScroll = (targetElement: HTMLElement) => {
      if (!targetElement || !document.contains(targetElement)) return;

      const container =
        containerRef?.current ||
        targetElement.closest('main') ||
        (targetElement.closest('.overflow-y-auto') as HTMLElement | null);

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const topPadding = 12;
        const bottomPadding = 56;

        if (
          targetRect.top < containerRect.top + topPadding ||
          targetRect.bottom > containerRect.bottom - bottomPadding
        ) {
          const relativeTop = targetRect.top - containerRect.top;
          const targetScroll = container.scrollTop + relativeTop - topPadding;
          container.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth',
          });
        }
      }

      lockWindowScroll();
    };

    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;

      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        setKeyboardState(true);

        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        // Multiple frames to catch iOS Safari / Android virtual keyboard animation
        rafId = requestAnimationFrame(() => {
          lockWindowScroll();
          rafId = requestAnimationFrame(() => {
            performScroll(target);
            lockWindowScroll();
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              lockWindowScroll();
              performScroll(target);
            }, 300);
          });
        });
      }
    };

    const handleFocusOut = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const active = document.activeElement;
        const isInputActive =
          active &&
          (active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT');

        if (!isInputActive) {
          setKeyboardState(false);
        }
        lockWindowScroll();
      }, 100);
    };

    const handleVisualViewportResize = () => {
      if (typeof window === 'undefined') return;
      const vv = window.visualViewport;
      if (vv) {
        const isKeyboard = window.innerHeight - vv.height > 100;
        if (isKeyboard) {
          setKeyboardState(true);
        } else {
          const active = document.activeElement;
          const isInputActive =
            active &&
            (active.tagName === 'INPUT' ||
              active.tagName === 'TEXTAREA' ||
              active.tagName === 'SELECT');
          if (!isInputActive) {
            setKeyboardState(false);
          }
        }
      }
      lockWindowScroll();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If the touch is not inside a scrollable area, prevent dragging the whole viewport
      if (!target.closest('main, .overflow-y-auto, .overflow-auto, textarea, input, select')) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleWindowScroll = () => {
      lockWindowScroll();
    };

    const element = containerRef?.current || document;
    element.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('scroll', handleWindowScroll, { passive: false });
    document.addEventListener('scroll', handleWindowScroll, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      window.visualViewport.addEventListener('scroll', lockWindowScroll);
    }

    // Initial lock
    lockWindowScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      element.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('scroll', handleWindowScroll);
      document.removeEventListener('scroll', handleWindowScroll);
      document.removeEventListener('touchmove', handleTouchMove);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        window.visualViewport.removeEventListener('scroll', lockWindowScroll);
      }
    };
  }, [containerRef]);

  useEffect(() => {
    document.documentElement.style.setProperty('--vv-height', '100dvh');
    document.documentElement.style.setProperty('--app-height', '100dvh');
  }, []);
}

