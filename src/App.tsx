import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { TabType, HistoryRecord, AppSettings } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import LmpCalculator from './components/LmpCalculator';
import UsgCalculator from './components/UsgCalculator';
import PercentileCalculator from './components/PercentileCalculator';
import AfiCalculator from './components/AfiCalculator';
import ClinicalCodesSkeleton from './components/clinical-codes/ClinicalCodesSkeleton';
import HistoryPanel from './components/HistoryPanel';
import ReferencesModal from './components/ReferencesModal';
import InstallAppModal from './components/InstallAppModal';
import OfflineStatusBanner from './components/OfflineStatusBanner';

const ClinicalCodesPage = lazy(() => import('./components/ClinicalCodesPage'));
import SettingsPanel from './components/SettingsPanel';
import BrandMark from './components/BrandMark';
import Icon from './components/Icon';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useShortcut } from './hooks/useShortcut';
import { useKeyboardAwareScroll } from './hooks/useKeyboardAwareScroll';
import { useGlobalResultsScroll } from './hooks/useGlobalResultsScroll';
import { hapticSelection, hapticLight } from './utils/haptics';
import { applyTheme, resolveIsDark } from './utils/theme';

const DEFAULT_SETTINGS: AppSettings = {
  defaultCycleLength: 28,
  useBiometryInMm: true,
  theme: 'system',
};

export default function App() {
  const mainContainerRef = useRef<HTMLElement>(null);
  useKeyboardAwareScroll(mainContainerRef);
  useGlobalResultsScroll();

  const [isInitialThemeReload] = useState(() => {
    try {
      return sessionStorage.getItem('gestatools_theme_reloading') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const savedTab = sessionStorage.getItem('gestatools_active_tab');
      if (savedTab && ['usg', 'dum', 'peso', 'ila', 'codes'].includes(savedTab)) {
        return savedTab as TabType;
      }
    } catch (e) {}
    return 'usg';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    let currentSettings = DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('gestatools_settings');
      if (saved) {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return currentSettings;
  });

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  
  // Drawer visibility
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    try {
      return sessionStorage.getItem('gestatools_open_settings') === 'true';
    } catch (e) {}
    return false;
  });
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [themeTransitionBg, setThemeTransitionBg] = useState('');
  const [themeTransitionLabel, setThemeTransitionLabel] = useState('Alternando tema...');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      let theme = DEFAULT_SETTINGS.theme;
      const saved = localStorage.getItem('gestatools_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) theme = parsed.theme;
      }
      return resolveIsDark(theme);
    } catch (e) {
      return false;
    }
  });

  useShortcut('h', () => {
    setIsHistoryOpen(prev => !prev);
    if (!isHistoryOpen) setIsSettingsOpen(false);
  });

  useShortcut('/', () => {
    setIsSettingsOpen(prev => !prev);
    if (!isSettingsOpen) setIsHistoryOpen(false);
  });

  // Handle post-reload curtain fadeout
  useEffect(() => {
    try {
      const isReloading = sessionStorage.getItem('gestatools_theme_reloading');
      if (isReloading === 'true') {
        sessionStorage.removeItem('gestatools_theme_reloading');
        sessionStorage.removeItem('gestatools_open_settings');
        sessionStorage.removeItem('gestatools_active_tab');
        sessionStorage.removeItem('gestatools_theme_label');

        const curtain = document.getElementById('theme-curtain');
        if (curtain) {
          setTimeout(() => {
            requestAnimationFrame(() => {
              curtain.style.opacity = '0';
              setTimeout(() => {
                curtain.remove();
              }, 250);
            });
          }, 120);
        }
      }
    } catch (e) {}
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    let currentSettings = DEFAULT_SETTINGS;
    const savedSettings = localStorage.getItem('gestatools_settings');
    if (savedSettings) {
      try {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }

    setSettings(currentSettings);
    
    const savedRecords = localStorage.getItem('gestatools_history');
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          let changed = false;
          const sanitized = parsed.map((rec: any, index: number) => {
            let id = rec.id;
            if (!id || typeof id !== 'string' || seenIds.has(id)) {
              id = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11) + '-' + index;
              changed = true;
            }
            seenIds.add(id);
            return { ...rec, id };
          });
          setRecords(sanitized);
          if (changed) {
            localStorage.setItem('gestatools_history', JSON.stringify(sanitized));
          }
        }
      } catch (e) {
        console.error('Error parsing history', e);
      }
    }
  }, []);

  // Sync theme based on settings.theme and system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      const isDark = applyTheme(settings.theme);
      setIsDarkMode(isDark);
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [settings.theme]);

  // Save records when updated
  const saveRecordsToStorage = (updatedRecords: HistoryRecord[]) => {
    setRecords(updatedRecords);
    localStorage.setItem('gestatools_history', JSON.stringify(updatedRecords));
  };

  const handleSaveRecord = (newRecord: Omit<HistoryRecord, 'id' | 'date'>) => {
    const recordId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : (Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11) + '-' + Math.random().toString(36).substring(2, 5));

    const record: HistoryRecord = {
      ...newRecord,
      id: recordId,
      date: new Date().toISOString(),
    };
    
    setRecords((prev) => {
      // Avoid duplicate saving of identical record
      if (prev.length > 0 && prev[0].summary === record.summary && prev[0].patientName === record.patientName) {
        return prev;
      }
      const updated = [record, ...prev];
      localStorage.setItem('gestatools_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleFavorite = (id: string) => {
    setRecords((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r);
      localStorage.setItem('gestatools_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('gestatools_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    localStorage.setItem('gestatools_history', JSON.stringify([]));
  };

  const handleSaveSettings = (updatedSettings: AppSettings) => {
    const isThemeChanged = updatedSettings.theme !== settings.theme;
    const targetIsDark = resolveIsDark(updatedSettings.theme);
    const targetBg = targetIsDark ? '#000000' : '#F2F2F7';

    setSettings(updatedSettings);
    localStorage.setItem('gestatools_settings', JSON.stringify(updatedSettings));

    if (isThemeChanged) {
      hapticSelection();
      const label = updatedSettings.theme === 'dark'
        ? 'Alternando para Modo Escuro...'
        : updatedSettings.theme === 'light'
        ? 'Alternando para Modo Claro...'
        : 'Aplicando Tema do Sistema...';

      setThemeTransitionLabel(label);

      try {
        sessionStorage.setItem('gestatools_theme_reloading', 'true');
        sessionStorage.setItem('gestatools_theme_label', label);
        sessionStorage.setItem('gestatools_open_settings', isSettingsOpen ? 'true' : 'false');
        sessionStorage.setItem('gestatools_active_tab', activeTab);
      } catch (e) {}

      // Immediately apply theme in DOM & set transition curtain
      applyTheme(updatedSettings.theme);
      setIsDarkMode(targetIsDark);
      setThemeTransitionBg(targetBg);
      setIsThemeTransitioning(true);

      // Perform seamless reload after soft fade
      setTimeout(() => {
        window.location.reload();
      }, 120);
    } else {
      const isDark = applyTheme(updatedSettings.theme);
      setIsDarkMode(isDark);
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-background text-on-surface transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* TopAppBar */}
      <header className="glass-nav-top text-on-surface font-title-md shrink-0 w-full z-40 flex justify-between items-center h-[calc(48px+env(safe-area-inset-top))] md:h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-3 md:px-6 min-[1366px]:px-margin-desktop max-w-full left-0 transition-all">
        <div className="flex items-center gap-2 min-w-0">
          <BrandMark size={26} className="w-[26px] h-[26px] md:w-[28px] md:h-[28px]" />
          <span className="font-headline-lg text-[20px] md:text-title-md font-bold text-on-surface tracking-tight truncate">GestaTools</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 relative">
          <div className="relative">
            <button 
              onClick={() => {
                hapticLight();
                window.dispatchEvent(new CustomEvent('clear-form'));
              }}
              className="pulse-hover text-primary hover:bg-primary/10 transition-colors cursor-pointer active:scale-95 p-2 rounded-full h-11 w-11 flex items-center justify-center group"
              title="Limpar formulário (Cmd/Ctrl + L)"
            >
              <Icon name="refresh" className="group-hover:-rotate-180 transition-transform duration-500 text-[22px] md:text-[24px]" />
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                hapticLight();
                setIsHistoryOpen(true);
                setIsSettingsOpen(false);
              }}
              className="pulse-hover text-primary hover:bg-primary/10 transition-colors cursor-pointer active:scale-95 p-2 rounded-full h-11 w-11 flex items-center justify-center"
              title="Histórico (Cmd/Ctrl + H)"
            >
              <Icon name="history" className="text-[22px] md:text-[24px]" />
              {records.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 border border-white dark:border-[#1C1C1E] rounded-full bg-tertiary" />
              )}
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                hapticLight();
                setIsSettingsOpen(true);
                setIsHistoryOpen(false);
              }}
              className="pulse-hover text-primary hover:bg-primary/10 transition-colors cursor-pointer active:scale-95 p-2 rounded-full h-11 w-11 flex items-center justify-center"
              title="Configurações (Cmd/Ctrl + /)"
            >
              <Icon name="settings" className="text-[22px] md:text-[24px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Sidebar (Desktop/Tablet) + Main Content */}
      <div className="flex-1 flex min-h-0 min-w-0 w-full overflow-hidden relative">
        {/* Sidebar for Desktop & Tablet */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main
          ref={mainContainerRef}
          className="app-main flex-1 min-h-0 min-w-0 w-full md:w-auto px-3 sm:px-4 md:px-5 min-[1024px]:px-6 min-[1366px]:px-margin-desktop overflow-y-auto md:overflow-hidden overflow-x-hidden overscroll-contain z-10 relative pt-2 sm:pt-3 md:pt-3 min-[1366px]:pt-5 pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-3 flex flex-col md:h-full"
        >
          
          <div className="max-w-6xl min-[1366px]:max-w-7xl mx-auto w-full min-h-full flex flex-col flex-1 min-w-0 overflow-x-hidden md:h-full md:min-h-0">
            <div className="w-full tab-content active flex-1 min-w-0 overflow-x-hidden flex flex-col md:min-h-0">
              {activeTab === 'usg' && (
                <UsgCalculator onSaveRecord={handleSaveRecord} />
              )}
              {activeTab === 'dum' && (
                <LmpCalculator
                  onSaveRecord={handleSaveRecord}
                  defaultCycleLength={settings.defaultCycleLength}
                />
              )}
              {activeTab === 'peso' && (
                <PercentileCalculator onSaveRecord={handleSaveRecord} />
              )}
              {activeTab === 'ila' && (
                <AfiCalculator onSaveRecord={handleSaveRecord} />
              )}
              {activeTab === 'codes' && (
                <Suspense fallback={<ClinicalCodesSkeleton />}>
                  <ClinicalCodesPage />
                </Suspense>
              )}
            </div>

            {/* Disclaimer Footer - Exibido apenas em tablets e desktops (md:flex), oculto no mobile */}
            <footer className="hidden md:flex flex-row justify-between items-center w-full mt-2 md:mt-3 pt-2.5 md:pt-3 pb-1 md:pb-1.5 border-t border-surface-variant/40 text-secondary text-xs relative z-10 shrink-0 text-left gap-4">
              <p className="font-semibold text-on-surface/90 text-xs">
                {activeTab === 'codes'
                  ? 'Fonte dos dados: SIGTAP/DATASUS — Competência 07/2026.'
                  : 'Ferramenta destinada exclusivamente a apoio de decisão clínica.'}
              </p>
              <div className="flex gap-4 justify-center items-center">
                <button 
                  onClick={() => setIsReferencesOpen(true)} 
                  className="hover:text-primary transition-colors cursor-pointer text-xs font-medium text-secondary/90 hover:underline underline-offset-4"
                >
                  Referências Bibliográficas
                </button>
              </div>
              <p className="text-[11px] text-secondary/80">
                © {new Date().getFullYear()} GestaTools - Profissionais de saúde.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Offline and connection status banner */}
      <OfflineStatusBanner />

      {/* References Modal */}
      <ReferencesModal 
        isOpen={isReferencesOpen} 
        onClose={() => setIsReferencesOpen(false)} 
      />

      {/* Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Sliding Drawers for panels */}
      <AnimatePresence>
        {/* Backdrop filter */}
        {(isHistoryOpen || isSettingsOpen) && (
          <motion.div
            key="drawer-backdrop"
            initial={isInitialThemeReload ? { opacity: 0.4 } : { opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={isInitialThemeReload ? { duration: 0 } : undefined}
            onClick={() => {
              setIsHistoryOpen(false);
              setIsSettingsOpen(false);
            }}
            className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
          />
        )}

        {/* History Panel Drawer */}
        {isHistoryOpen && (
          <motion.div
            key="history-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed right-0 top-0 h-dvh w-full sm:w-[420px] glass-nav-top border-b-0 border-l border-surface-variant/50 dark:border-white/5 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <HistoryPanel
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAllRecords}
              onClose={() => setIsHistoryOpen(false)}
              onToggleFavorite={handleToggleFavorite}
            />
          </motion.div>
        )}

        {/* Settings Panel Drawer */}
        {isSettingsOpen && (
          <motion.div
            key="settings-drawer"
            initial={isInitialThemeReload ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={isInitialThemeReload ? { duration: 0 } : { type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed right-0 top-0 h-dvh w-full sm:w-[420px] glass-nav-top border-b-0 border-l border-surface-variant/50 dark:border-white/5 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <SettingsPanel
              settings={settings}
              onChangeSettings={handleSaveSettings}
              onClose={() => setIsSettingsOpen(false)}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              onOpenReferences={() => setIsReferencesOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seamless Theme Transition Curtain (Pre-reload) */}
      <AnimatePresence>
        {isThemeTransitioning && (
          <motion.div
            key="theme-transition-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
            style={{ backgroundColor: themeTransitionBg }}
            className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center"
          >
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.18)] text-[#1C1C1E] dark:text-[#F2F2F7]">
              <Loader2 className="w-7 h-7 animate-spin text-sky-600 dark:text-sky-400" />
              <span className="text-[13px] font-semibold tracking-tight">{themeTransitionLabel}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install PWA Modal (rendered on top of drawers) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
