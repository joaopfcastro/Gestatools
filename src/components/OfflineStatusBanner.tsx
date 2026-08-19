import { useState, useEffect } from 'react';
import Icon from './Icon';

export default function OfflineStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      id="connection-status-pill"
      className={`fixed top-[calc(56px+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300 flex items-center gap-2 max-w-[90vw] truncate ${
        isOffline
          ? 'bg-amber-500/90 text-white border border-amber-400/40'
          : 'bg-emerald-600/90 text-white border border-emerald-400/40'
      }`}
    >
      <Icon
        name={isOffline ? 'cloud_off' : 'cloud_done'}
        className="text-[16px] shrink-0"
      />
      <span className="truncate">
        {isOffline
          ? 'Modo Offline: todas as calculadoras continuam ativas'
          : 'Conexão restabelecida'}
      </span>
    </div>
  );
}
