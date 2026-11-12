import React from 'react';
import { Radar, RefreshCw, Sliders, Wifi, WifiOff } from 'lucide-react';
import { AppStats } from '../../types/index.ts';

interface HeaderProps {
  stats: AppStats;
  isChecking: boolean;
  onCheckNow: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isChecking,
  onCheckNow,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090B0F]/90 backdrop-blur-md border-b border-[#252D38] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-[#151A22] border border-[#252D38] flex items-center justify-center overflow-hidden">
            <Radar className={`w-5 h-5 text-[#B7F36B] ${stats.isMonitoringActive ? 'radar-active' : ''}`} />
            {stats.isMonitoringActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B7F36B]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#F4F6FA]">
                Cinema Alert
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C232E] border border-[#252D38] text-[#B7F36B]">
                Radar v1.0
              </span>
            </div>
            <p className="text-xs text-[#929BAA]">Your cinema radar</p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2">
          {/* Network pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-full border ${
              stats.isNetworkConnected
                ? 'bg-[#151A22] border-[#252D38] text-[#929BAA]'
                : 'bg-[#F07878]/10 border-[#F07878]/30 text-[#F07878]'
            }`}
          >
            {stats.isNetworkConnected ? (
              <>
                <Wifi className="w-3 h-3 text-[#64D99B]" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-[#F07878]" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Quick Check Now button */}
          <button
            onClick={onCheckNow}
            disabled={isChecking}
            title="Check all trackers now"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#151A22] hover:bg-[#1C232E] border border-[#252D38] text-[#F4F6FA] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#B7F36B] ${isChecking ? 'animate-spin' : ''}`}
            />
            <span className="hidden xs:inline">{isChecking ? 'Checking...' : 'Check now'}</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Settings and Diagnostics"
            aria-label="Settings and Diagnostics"
            className="w-8 h-8 rounded-lg bg-[#151A22] hover:bg-[#1C232E] border border-[#252D38] flex items-center justify-center text-[#929BAA] hover:text-[#F4F6FA] active:scale-95 transition-all"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
