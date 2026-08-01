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
      
      const targetKey = key.toLowerCase();
      const eventKey = e.key ? e.key.toLowerCase() : '';
      const eventCode = e.code ? e.code.toLowerCase() : '';

      if (
        eventKey === targetKey ||
        eventCode === targetKey ||
        eventCode === `key${targetKey}`
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlOrMeta]);
}

