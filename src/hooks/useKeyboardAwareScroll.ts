import { useEffect, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Only scroll into view if on coarse pointer or small/constrained viewport
        const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerHeight < 700;
        if (!isTouch) return;

        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      }
    };

    const element = containerRef?.current || document;
    element.addEventListener('focusin', handleFocusIn);

    return () => {
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

