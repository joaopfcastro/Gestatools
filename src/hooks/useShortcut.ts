import { useEffect } from 'react';

export function useShortcut(
  key: string,
  callback: () => void,
  ctrlOrMeta: boolean = true
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ctrlOrMeta && !(e.ctrlKey || e.metaKey)) {
        return;
      }
      
      if (e.key === key || e.code === key) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlOrMeta]);
}
