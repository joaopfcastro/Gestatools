import { useState, useEffect } from 'react';
import Icon from './Icon';
import BrandMark from './BrandMark';
import { hapticSuccess, hapticSelection, hapticLight } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    hapticSelection();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        hapticSuccess();
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="install-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              hapticLight();
              onClose();
            }}
          />

          {/* Modal Card */}
          <motion.div
            id="install-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 overflow-hidden text-on-surface bg-surface border border-surface-variant dark:bg-[#1C1C1E] dark:border-white/10 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/50">
              <div className="flex items-center gap-3">
                <BrandMark size={36} className="w-9 h-9 rounded-xl shadow-xs shrink-0" />
                <div>
                  <h2 className="font-title-md font-bold text-base md:text-lg">Instalar GestaTools</h2>
                  <p className="text-xs text-secondary">Experiência 100% nativa e offline</p>
                </div>
              </div>
              <button
                id="close-install-modal-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticLight();
                  onClose();
                }}
                className="p-2 rounded-full hover:bg-surface-variant text-secondary transition-colors cursor-pointer"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="py-5 space-y-4 text-sm leading-relaxed">
              {isStandalone ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                  <Icon name="check_circle" className="text-2xl shrink-0" />
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider">Modo Nativo Ativo</p>
                    <p className="text-xs mt-0.5">O GestaTools já está instalado e rodando em tela cheia como aplicativo no seu dispositivo.</p>
                  </div>
                </div>
              ) : isIOS ? (
                <div className="space-y-3.5">
                  <p className="text-xs text-secondary font-medium">
                    Siga estes 2 passos no Safari para fixar o ícone oficial na sua tela de início:
                  </p>

                  <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl flex items-start gap-3 border border-surface-variant/40">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-on-surface">Toque no botão Compartilhar</p>
                      <p className="text-[11px] text-secondary mt-0.5 flex items-center gap-1 flex-wrap">
                        Toque no ícone <Icon name="ios_share" className="text-sm text-primary inline-block" /> na barra inferior do Safari.
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl flex items-start gap-3 border border-surface-variant/40">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-on-surface">Adicionar à Tela de Início</p>
                      <p className="text-[11px] text-secondary mt-0.5">
                        Role a lista de ações e toque em <strong>"Adicionar à Tela de Início"</strong>. Depois confirme em <strong>"Adicionar"</strong> no topo direito.
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-[11px] text-secondary flex items-center gap-2">
                    <Icon name="offline_pin" className="text-primary text-base shrink-0" />
                    <span>O app abrirá com ícone oficial, tela cheia sem barras e 100% offline.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-secondary">
                    Instale o GestaTools para abrir instantaneamente da tela de início com suporte offline completo.
                  </p>

                  {deferredPrompt ? (
                    <button
                      id="pwa-install-action-btn"
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 flex items-center justify-center gap-2 cursor-pointer transition-transform"
                    >
                      <Icon name="download" className="text-lg" />
                      <span>Instalar Aplicativo Agora</span>
                    </button>
                  ) : (
                    <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl space-y-2.5 border border-surface-variant/40">
                      <p className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                        <Icon name="touch_app" className="text-primary text-sm" />
                        Passo a passo no Chrome / Android / Desktop:
                      </p>
                      <p className="text-[11px] text-secondary leading-relaxed">
                        1. Toque no menu do navegador (três pontinhos <Icon name="more_vert" className="inline text-xs" /> no canto superior direito).<br />
                        2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.<br />
                        3. Confirme a instalação.
                      </p>
                    </div>
                  )}

                  {installSuccess && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center">
                      Aplicativo instalado com sucesso!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-surface-variant/50 flex justify-end">
              <button
                id="dismiss-install-modal-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticLight();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-surface-variant/70 hover:bg-surface-variant text-on-surface text-xs font-semibold cursor-pointer transition-colors"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
