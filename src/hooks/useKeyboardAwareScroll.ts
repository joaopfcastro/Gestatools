import { useEffect, RefObject } from 'react';

export function useKeyboardAwareScroll(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handleFocusIn = (e: Event) => {
      // Only apply on mobile devices (prevents altering desktop layout)
      if (window.innerWidth >= 768) return;

      const target = e.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Delay ensures the virtual keyboard has animated into view
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
    if (window.innerWidth >= 768) return;

    const updateVv = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty('--vv-height', `${window.visualViewport.height}px`);
      }
    };
    
    updateVv();
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVv);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVv);
      }
    };
  }, []);
}
