import React from 'react';
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  Video, 
  PlaySquare, 
  Sliders,
  Shield,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'alerts' | 'incidents' | 'video-analysis' | 'simulator' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openIncidentsCount: number;
  unacknowledgedAlertsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openIncidentsCount,
  unacknowledgedAlertsCount,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="w-4 h-4" />,
      badge: unacknowledgedAlertsCount > 0 ? unacknowledgedAlertsCount : undefined
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: <FileText className="w-4 h-4" />,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined
    },
    {
      id: 'video-analysis',
      label: 'Video Analysis',
      icon: <Video className="w-4 h-4" />
    },
    {
      id: 'simulator',
      label: 'Scenario Simulator',
      icon: <PlaySquare className="w-4 h-4" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Sliders className="w-4 h-4" />
    }
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-stone-50 border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-stone-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                Threat Prevention
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                CODE//CONNECT'26
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 md:hidden rounded-md hover:bg-stone-200"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            Operations
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-stone-200/70 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-neutral-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span 
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                      isActive 
                        ? 'bg-neutral-800 text-stone-200' 
                        : 'bg-stone-200 text-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-stone-200 text-[11px] text-neutral-500 space-y-1 bg-stone-100/60">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-700">Environment</span>
            <span className="font-mono text-neutral-600">Localhost</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-700">Pipeline Stage</span>
            <span className="font-mono text-neutral-600">Stage 2 (Backend)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
