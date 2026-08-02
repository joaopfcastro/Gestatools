import { RefObject, useCallback } from 'react';

export function useFieldNavigation(fields: (RefObject<HTMLElement | null> | HTMLElement | null)[]) {
  const getElements = useCallback((): (HTMLElement | null)[] => {
    return fields.map((item) => {
      if (!item) return null;
      if ('current' in item) {
        return item.current;
      }
      return item as HTMLElement;
    });
  }, [fields]);

  const isFocusable = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    if (el.getAttribute('disabled') !== null) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.offsetParent === null && el.tagName !== 'BODY') return false; // Hidden in layout
    return true;
  };

  const focusNext = useCallback((currentIndex: number) => {
    const elements = getElements();
    for (let i = currentIndex + 1; i < elements.length; i++) {
      const el = elements[i];
      if (isFocusable(el)) {
        el?.focus();
        if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
          (el as HTMLInputElement).select();
        }
        return true;
      }
    }
    return false; // Reached end
  }, [getElements]);

  const focusPrevious = useCallback((currentIndex: number) => {
    const elements = getElements();
    for (let i = currentIndex - 1; i >= 0; i--) {
      const el = elements[i];
      if (isFocusable(el)) {
        el?.focus();
        if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
          (el as HTMLInputElement).select();
        }
        return true;
      }
    }
    return false;
  }, [getElements]);

  const focusFirstInvalid = useCallback((invalidElements: (HTMLElement | null)[]) => {
    for (const el of invalidElements) {
      if (isFocusable(el)) {
        el?.focus();
        if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
          (el as HTMLInputElement).select();
        }
        return true;
      }
    }
    return false;
  }, []);

  return {
    focusNext,
    focusPrevious,
    focusFirstInvalid,
  };
}
