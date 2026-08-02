import { useEffect, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let rafId: number | null = null;
    let targetElement: HTMLElement | null = null;

    const performScroll = () => {
      if (!targetElement || !document.contains(targetElement)) return;

      const rect = targetElement.getBoundingClientRect();
      const vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const vvTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

      // Safe areas: Header (~60px) and CalculatorActionBar (~70px)
      const topPadding = 64;
      const bottomPadding = 80;

      const visibleTop = vvTop + topPadding;
      const visibleBottom = vvTop + vvHeight - bottomPadding;

      const isObscuredTop = rect.top < visibleTop;
      const isObscuredBottom = rect.bottom > visibleBottom;

      if (isObscuredTop || isObscuredBottom) {
        targetElement.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        });
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
        const isTouch =
          window.matchMedia('(pointer: coarse)').matches || window.innerHeight < 700;
        if (!isTouch) return;

        targetElement = target;

        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        // Wait up to 2 animation frames for visualViewport / keyboard to adjust
        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            performScroll();
          });
        });
      }
    };

    const element = containerRef?.current || document;
    element.addEventListener('focusin', handleFocusIn);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      element.removeEventListener('focusin', handleFocusIn);
    };
  }, [containerRef]);

  useEffect(() => {
    const updateVv = () => {
      if (window.visualViewport) {
        const height = `${window.visualViewport.height}px`;
        document.documentElement.style.setProperty('--vv-height', height);
        document.documentElement.style.setProperty('--app-height', height);
      }
    };

    updateVv();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVv);
      window.visualViewport.addEventListener('scroll', updateVv);
    }

    window.addEventListener('resize', updateVv);
    window.addEventListener('orientationchange', updateVv);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVv);
        window.visualViewport.removeEventListener('scroll', updateVv);
      }
      window.removeEventListener('resize', updateVv);
      window.removeEventListener('orientationchange', updateVv);
    };
  }, []);
}
