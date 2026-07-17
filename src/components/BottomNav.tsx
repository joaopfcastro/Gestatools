import { TabType } from '../types';
import Icon from './Icon';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const menuItems = [
    { id: 'dum' as TabType, label: 'DUM', icon: 'calendar_today' },
    { id: 'usg' as TabType, label: 'USG', icon: 'image_search' },
    { id: 'peso' as TabType, label: 'Peso', icon: 'monitor_weight' },
    { id: 'ila' as TabType, label: 'ILA', icon: 'water_drop' },
  ];

  return (
    <nav className="glass-nav-bottom text-on-surface font-label-caps text-[10px] fixed bottom-0 w-full z-50 md:hidden flex justify-around items-center h-[calc(72px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-btn flex flex-col items-center justify-center rounded-xl px-1 py-1 w-16 sm:w-16 h-14 sm:h-16 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface ${
              isActive
                ? 'text-primary'
                : 'text-secondary hover:text-primary'
            }`}
            data-tab={item.id}
          >
            <Icon
              name={item.icon}
              filled={isActive}
              className="mb-1 text-[24px] sm:text-[28px]"
            />
            <span className={`text-[9px] sm:text-[11px] truncate w-full text-center ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
