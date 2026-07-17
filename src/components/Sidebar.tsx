import { TabType } from '../types';
import Icon from './Icon';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dum' as TabType, label: 'Idade Gestacional DUM', icon: 'calendar_today' },
    { id: 'usg' as TabType, label: 'Idade Gestacional USG', icon: 'image_search' },
    { id: 'peso' as TabType, label: 'Peso Fetal / Percentil', icon: 'monitor_weight' },
    { id: 'ila' as TabType, label: 'ILA / MBV', icon: 'water_drop' },
  ];

  return (
    <nav className="glass-nav text-on-surface font-body-lg hidden md:flex flex-col h-screen w-72 fixed left-0 top-16 overflow-y-auto z-40">
      <div className="p-6 mb-2">
        <h2 className="font-label-caps text-label-caps font-semibold text-on-surface-variant uppercase tracking-wider">
          Calculadoras
        </h2>
        <p className="text-body-sm text-secondary mt-1">
          Assistência Obstétrica
        </p>
      </div>

      <ul className="flex flex-col gap-1 py-2 px-4" id="desktop-nav">
        {menuItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              className="animate-nav-item"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <button
                onClick={() => setActiveTab(item.id)}
                className={`nav-btn w-full text-left rounded-xl cursor-pointer px-4 py-3 mb-1 flex items-center gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface ${
                  isActive
                    ? 'bg-primary text-white font-medium shadow-sm'
                    : 'text-on-surface hover:bg-surface-variant'
                }`}
                data-tab={item.id}
              >
                <Icon
                  name={item.icon}
                  filled={isActive}
                  className={isActive ? 'text-white' : 'text-primary'}
                />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
