import { useEffect, useState, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkKeyboardAndScroll = (e?: Event) => {
      // Only apply on mobile devices (prevents altering desktop layout)
      if (window.innerWidth >= 768) {
        setIsKeyboardOpen(false);
        document.body.classList.remove('keyboard-open');
        document.documentElement.classList.remove('keyboard-open');
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isInputActive = !!activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      let kbHeight = 0;
      if (window.visualViewport) {
        const vvHeight = window.visualViewport.height;
        const winHeight = window.innerHeight;
        const diff = winHeight - vvHeight;

        document.documentElement.style.setProperty('--vv-height', `${vvHeight}px`);

        if (diff > 80 || isInputActive) {
          kbHeight = Math.max(diff, 0);
        }
      }

      const isOpen = isInputActive || kbHeight > 80;
      setIsKeyboardOpen(isOpen);
      setKeyboardHeight(kbHeight);

      if (isOpen) {
        document.body.classList.add('keyboard-open');
        document.documentElement.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
      } else {
        document.body.classList.remove('keyboard-open');
        document.documentElement.classList.remove('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      }

      // Smooth scroll focused element into view
      if (e?.type === 'focusin' && isInputActive && activeEl) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          activeEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }, 300);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      checkKeyboardAndScroll(e);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        checkKeyboardAndScroll();
      }, 150);
    };

    const handleResize = () => {
      checkKeyboardAndScroll();
    };

    const element = containerRef?.current || document;
    element.addEventListener('focusin', handleFocusIn as EventListener);
    element.addEventListener('focusout', handleFocusOut as EventListener);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Initial check
    checkKeyboardAndScroll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      element.removeEventListener('focusin', handleFocusIn as EventListener);
      element.removeEventListener('focusout', handleFocusOut as EventListener);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.body.classList.remove('keyboard-open');
      document.documentElement.classList.remove('keyboard-open');
    };
  }, [containerRef]);

  return { isKeyboardOpen, keyboardHeight };
}

