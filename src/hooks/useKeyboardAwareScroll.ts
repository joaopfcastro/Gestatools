import { useEffect, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let rafId: number | null = null;

    const performScroll = (targetElement: HTMLElement) => {
      if (!targetElement || !document.contains(targetElement)) return;

      const container =
        targetElement.closest('main') ||
        targetElement.closest('.overflow-y-auto') ||
        containerRef?.current;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const topPadding = 64;
        const bottomPadding = 80;

        if (targetRect.top < containerRect.top + topPadding || targetRect.bottom > containerRect.bottom - bottomPadding) {
          const relativeTop = targetRect.top - containerRect.top;
          container.scrollBy({
            top: relativeTop - topPadding - 10,
            behavior: 'smooth',
          });
        }
      }

      // Keep top-level window scroll strictly at 0 for iOS Safari
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;

      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            performScroll(target);
          });
        });
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      }, 100);
    };

    const element = containerRef?.current || document;
    element.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      element.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [containerRef]);

  useEffect(() => {
    document.documentElement.style.setProperty('--vv-height', '100dvh');
    document.documentElement.style.setProperty('--app-height', '100dvh');
  }, []);
}
