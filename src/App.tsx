import { useState, useEffect } from 'react';
import { TabType, HistoryRecord, AppSettings } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import LmpCalculator from './components/LmpCalculator';
import UsgCalculator from './components/UsgCalculator';
import PercentileCalculator from './components/PercentileCalculator';
import AfiCalculator from './components/AfiCalculator';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import Icon from './components/Icon';
import { motion, AnimatePresence } from 'motion/react';
import { useShortcut } from './hooks/useShortcut';
import { useKeyboardAwareScroll } from './hooks/useKeyboardAwareScroll';

const DEFAULT_SETTINGS: AppSettings = {
  defaultCycleLength: 28,
  useBiometryInMm: true,
  theme: 'system',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('usg');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  
  // Drawer visibility
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useShortcut('h', () => {
    setIsHistoryOpen(prev => !prev);
    if (!isHistoryOpen) setIsSettingsOpen(false);
  });

  useShortcut('/', () => {
    setIsSettingsOpen(prev => !prev);
    if (!isSettingsOpen) setIsHistoryOpen(false);
  });

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
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (theme: AppSettings['theme']) => {
      const isDark = theme === 'system' ? mediaQuery.matches : theme === 'dark';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme(currentSettings.theme);

    const handleSystemThemeChange = () => {
      setSettings(prev => {
        if (prev.theme === 'system') {
          updateTheme('system');
        }
        return prev;
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

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
    setSettings(updatedSettings);
    localStorage.setItem('gestatools_settings', JSON.stringify(updatedSettings));
    
    // Immediate theme update when settings change
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = updatedSettings.theme === 'system' ? mediaQuery.matches : updatedSettings.theme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`h-[var(--vv-height,100dvh)] md:h-screen flex overflow-hidden bg-background text-on-surface transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* TopAppBar */}
      <header className="glass-nav-top text-on-surface font-title-md fixed top-0 w-full z-50 flex justify-between items-center h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-gutter md:px-margin-desktop max-w-full left-0 transition-all">
        <div className="flex items-center gap-2">
          <span className="font-headline-lg text-[22px] md:text-title-md font-bold text-on-surface tracking-tight">GestaTools</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 relative">
          <div className="relative">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('clear-form'))}
              className="pulse-hover text-primary hover:bg-primary/10 transition-colors cursor-pointer active:scale-95 p-2 rounded-full h-11 w-11 flex items-center justify-center group"
              title="Limpar formulário (Cmd/Ctrl + L)"
            >
              <Icon name="refresh" className="group-hover:-rotate-180 transition-transform duration-500 text-[22px] md:text-[24px]" />
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => {
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

      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-grow px-2 py-0 md:p-margin-desktop overflow-y-auto md:overflow-y-auto z-10 relative pt-[calc(56px+env(safe-area-inset-top))] md:pt-20 md:pl-72 w-full h-[var(--vv-height,100dvh)] md:h-screen pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-6">
        
        <div className="max-w-6xl mx-auto min-h-full md:min-h-[calc(100vh-160px)] flex flex-col justify-between">
          <div className="w-full tab-content active flex-1 flex flex-col pt-2 md:pt-0">
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
          </div>

          {/* Disclaimer Footer */}
          <footer className="text-secondary text-[11px] w-full py-4 px-3 md:px-margin-desktop mt-auto relative z-10 flex flex-col md:flex-row justify-between items-center text-center gap-2 max-w-7xl mx-auto opacity-70">
            <p className="font-semibold text-on-surface hidden md:block">Ferramenta destinada exclusivamente a apoio de decisão clínica.</p>
            <div className="flex gap-4 md:gap-6 justify-center">
              <button onClick={() => setIsSettingsOpen(true)} className="hover:text-primary transition-colors cursor-pointer text-[11px] md:text-xs">
                Referências Bibliográficas
              </button>
            </div>
            <p className="text-[9px] md:text-[10px]">© {new Date().getFullYear()} GestaTools - Profissionais de saúde.</p>
          </footer>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Sliding Drawers for panels */}
      <AnimatePresence>
        {/* Backdrop filter */}
        {(isHistoryOpen || isSettingsOpen) && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
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
            className="fixed right-0 top-0 h-[var(--vv-height,100dvh)] w-full sm:w-[420px] glass-nav-top border-b-0 border-l shadow-2xl z-50 overflow-hidden flex flex-col"
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed right-0 top-0 h-[var(--vv-height,100dvh)] w-full sm:w-[420px] glass-nav-top border-b-0 border-l shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <SettingsPanel
              settings={settings}
              onChangeSettings={handleSaveSettings}
              onClose={() => setIsSettingsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
