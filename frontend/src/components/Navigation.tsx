import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Pill,
  TrendingUp,
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';

export type TabKey =
  | 'dashboard'
  | 'map'
  | 'facilities'
  | 'inventory'
  | 'forecasting'
  | 'operations'
  | 'copilot';

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  language: Language;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  language,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const t = useTranslation(language);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { key: 'map', label: t.mapView, icon: <MapPin size={20} /> },
    { key: 'facilities', label: t.facilities, icon: <Building2 size={20} /> },
    { key: 'inventory', label: t.inventory, icon: <Pill size={20} /> },
    { key: 'forecasting', label: t.demandForecast, icon: <TrendingUp size={20} /> },
    { key: 'operations', label: t.operations, icon: <Activity size={20} /> },
    { key: 'copilot', label: t.copilot, icon: <Bot size={20} /> },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Main Navigation"
      >
        <nav role="tablist" aria-orientation="vertical" style={{ width: '100%' }}>
          <ul className="sidebar-nav-list">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <li key={tab.key}>
                  <button
                    type="button"
                    className={`sidebar-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.key)}
                    aria-selected={isActive}
                    role="tab"
                    title={isCollapsed ? tab.label : undefined}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {tab.icon}
                    </span>
                    {!isCollapsed && (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
            <button
              type="button"
              className="sidebar-collapse-toggle"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!isCollapsed && (
                <span>{language === 'hi' ? 'साइडबार समेटें' : 'Collapse Sidebar'}</span>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (<768px, No Horizontal Scrollbar) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {tabs.slice(0, 5).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={`mobile_${tab.key}`}
              type="button"
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Mobile ${tab.label}`}
            >
              {tab.icon}
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
