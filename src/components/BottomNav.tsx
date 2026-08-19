import { TabType } from '../types';
import Icon from './Icon';
import { hapticSelection } from '../utils/haptics';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const menuItems = [
    { id: 'dum' as TabType, label: 'DUM', icon: 'calendar_today' },
    { id: 'usg' as TabType, label: 'USG', icon: 'monitor_heart' },
    { id: 'peso' as TabType, label: 'Peso', icon: 'monitor_weight' },
    { id: 'ila' as TabType, label: 'ILA', icon: 'water_drop' },
    { id: 'codes' as TabType, label: 'Códigos', icon: 'clinical_notes' },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="glass-nav-bottom text-on-surface fixed bottom-0 left-0 right-0 w-full z-40 md:hidden flex justify-evenly items-center h-[calc(52px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-none transition-[height,padding,transform,opacity] duration-200"
    >
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              hapticSelection();
              setActiveTab(item.id);
            }}
            className={`nav-btn flex flex-col items-center justify-center rounded-xl px-1 py-0.5 flex-1 min-w-0 h-[44px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                : 'text-secondary hover:text-primary active:bg-surface-variant/40'
            }`}
            data-tab={item.id}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              name={item.icon}
              filled={isActive}
              className={`icon-nav ${isActive ? 'text-primary' : 'text-secondary'} text-[19px] min-[390px]:text-[21px]`}
            />
            <span className={`text-[10px] min-[390px]:text-[11px] leading-none truncate w-full text-center mt-0.5 ${isActive ? 'font-bold text-primary' : 'font-semibold'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
