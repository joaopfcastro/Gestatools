import { TabType } from '../types';
import Icon from './Icon';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const calculatorItems = [
    { id: 'dum' as TabType, label: 'Idade Gestacional DUM', icon: 'calendar_today' },
    { id: 'usg' as TabType, label: 'Idade Gestacional USG', icon: 'monitor_heart' },
    { id: 'peso' as TabType, label: 'Peso Fetal / Percentil', icon: 'monitor_weight' },
    { id: 'ila' as TabType, label: 'ILA / MBV', icon: 'water_drop' },
  ];

  const consultationItems = [
    { id: 'codes' as TabType, label: 'CID-10 e SIGTAP', icon: 'clinical_notes' },
  ];

  const renderNavGroup = (
    items: { id: TabType; label: string; icon: string }[],
    baseDelayOffset: number
  ) => {
    return items.map((item, index) => {
      const isActive = activeTab === item.id;
      return (
        <li
          key={item.id}
          className="animate-nav-item"
          style={{ animationDelay: `${baseDelayOffset + index * 0.05}s` }}
        >
          <button
            onClick={() => setActiveTab(item.id)}
            className={`nav-btn w-full text-left rounded-xl cursor-pointer px-2.5 py-2.5 min-[1366px]:px-4 min-[1366px]:py-3 mb-1 inline-flex items-center gap-2 min-[1366px]:gap-3 text-xs sm:text-sm min-[1366px]:text-body-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface ${
              isActive
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'text-on-surface hover:bg-surface-variant'
            }`}
            data-tab={item.id}
          >
            <Icon
              name={item.icon}
              filled={isActive}
              className={`icon-nav flex-shrink-0 ${isActive ? 'text-white' : 'text-primary'}`}
            />
            <span className="leading-snug">{item.label}</span>
          </button>
        </li>
      );
    });
  };

  return (
    <nav className="app-sidebar glass-nav text-on-surface font-body-lg hidden md:flex flex-col h-[calc(var(--vv-height,100dvh)-56px)] fixed left-0 top-[calc(48px+env(safe-area-inset-top))] md:top-[calc(56px+env(safe-area-inset-top))] overflow-y-auto z-40">
      <div className="p-4 min-[1366px]:p-6 mb-1 min-[1366px]:mb-2 pb-0">
        <h2 className="font-label-caps text-label-caps font-semibold text-on-surface-variant uppercase tracking-wider text-[11px] min-[1366px]:text-xs">
          Calculadoras
        </h2>
        <p className="text-body-sm text-secondary mt-0.5 min-[1366px]:mt-1 text-xs min-[1366px]:text-sm">
          Assistência Obstétrica
        </p>
      </div>

      <ul className="flex flex-col gap-1 py-1 min-[1366px]:py-2 px-2 min-[1366px]:px-4" id="desktop-nav-calc">
        {renderNavGroup(calculatorItems, 0.1)}
      </ul>

      <div className="mx-4 my-2 border-t border-surface-variant/70 dark:border-white/5" />

      <div className="px-4 min-[1366px]:px-6 mb-1">
        <h2 className="font-label-caps text-label-caps font-semibold text-on-surface-variant uppercase tracking-wider text-[11px] min-[1366px]:text-xs">
          Consulta Clínica
        </h2>
        <p className="text-body-sm text-secondary mt-0.5 min-[1366px]:mt-1 text-xs min-[1366px]:text-sm">
          CID e procedimentos
        </p>
      </div>

      <ul className="flex flex-col gap-1 py-1 min-[1366px]:py-2 px-2 min-[1366px]:px-4" id="desktop-nav-consult">
        {renderNavGroup(consultationItems, 0.35)}
      </ul>
    </nav>
  );
}
