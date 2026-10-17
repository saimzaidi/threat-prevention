import React from 'react';
import { Menu, Video, Server, User, RefreshCw } from 'lucide-react';
import { NavTab } from './Sidebar';
import { BackendHealthState } from '../api/client';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onNavigateToUpload: () => void;
  backendState: BackendHealthState;
  onRefreshBackend: () => void;
}

const TAB_META: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Operations Overview',
    subtitle: 'System readiness, active threats, and response status'
  },
  alerts: {
    title: 'Detection Alerts',
    subtitle: 'Incoming signal alerts prioritized by severity and source'
  },
  incidents: {
    title: 'Incident Management',
    subtitle: 'Review evidence, record operator decisions, and resolve cases'
  },
  'video-analysis': {
    title: 'Video Analysis Pipeline',
    subtitle: 'Local video inspection, frame sampling, and AI inference validation'
  },
  simulator: {
    title: 'Scenario Simulator',
    subtitle: 'Controlled scenario injection for operator workflow demonstrations'
  },
  settings: {
    title: 'System Architecture & Settings',
    subtitle: 'Local processing boundaries, model configuration, and pipeline parameters'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onNavigateToUpload,
  backendState,
  onRefreshBackend
}) => {
  const meta = TAB_META[currentTab];

  return (
    <header className="h-16 px-4 md:px-8 border-b border-stone-200 bg-white/80 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between">
      {/* Left zone: Mobile toggle & contextual title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-lg md:hidden hover:bg-stone-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-semibold text-neutral-900 tracking-tight leading-tight">
            {meta.title}
          </h1>
          <p className="text-[11px] text-neutral-500 hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right zone: Backend connection status, Analyze Video CTA & operator avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Backend health status badge */}
        <button
          type="button"
          onClick={onRefreshBackend}
          title={
            backendState.status === 'connected'
              ? `${backendState.data?.service} v${backendState.data?.version} (${backendState.data?.stage}) - Click to refresh health check`
              : `Backend is unreachable: ${backendState.error || 'Server offline'} - Click to retry`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
            backendState.status === 'connected'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80'
              : backendState.status === 'checking'
              ? 'bg-stone-100 border-stone-200 text-neutral-600'
              : 'bg-rose-50/80 border-rose-200 text-rose-800 hover:bg-rose-100/80'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-current shrink-0" />
          <span className="font-medium">
            {backendState.status === 'connected'
              ? 'Backend: Connected'
              : backendState.status === 'checking'
              ? 'Backend: Checking...'
              : 'Backend: Disconnected'}
          </span>
          <RefreshCw className={`w-3 h-3 text-neutral-400 hover:text-neutral-700 ${backendState.status === 'checking' ? 'animate-spin' : ''}`} />
        </button>

        {/* Quick action button if not already on upload page */}
        {currentTab !== 'video-analysis' && (
          <button
            type="button"
            onClick={onNavigateToUpload}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Analyze Video</span>
          </button>
        )}

        {/* Operator Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-neutral-700 font-medium text-xs">
            <User className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-neutral-900 leading-none">
              Operator
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Desk 01
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
