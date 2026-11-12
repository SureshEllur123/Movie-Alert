import React, { useState } from 'react';
import {
  Radar,
  Sparkles,
  Ticket,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Film,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Tracker, AppStats, DiscoveredShow } from '../../types/index.ts';
import { db } from '../../services/database/storage.ts';
import { monitoringEngine } from '../../services/monitoring/monitoringEngine.ts';

interface HomeScreenProps {
  stats: AppStats;
  trackers: Tracker[];
  onOpenCreate: () => void;
  onOpenTrackerDetails: (tracker: Tracker) => void;
  onRefreshData: () => void;
  onSwitchToActivity: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  trackers,
  onOpenCreate,
  onOpenTrackerDetails,
  onRefreshData,
  onSwitchToActivity,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const activeTrackers = trackers.filter((t) => t.isActive);

  const handleToggleTracker = (tracker: Tracker) => {
    tracker.isActive = !tracker.isActive;
    tracker.updatedAt = Date.now();
    db.updateTracker(tracker);
    onRefreshData();
  };

  const handleDeleteTracker = (trackerId: string) => {
    db.deleteTracker(trackerId);
    onRefreshData();
  };

  const handleCheckTrackerNow = async (trackerId: string) => {
    await monitoringEngine.runCycle(trackerId);
    onRefreshData();
  };

  const handleSimulateGlobalShow = () => {
    if (trackers.length === 0) return;
    setIsSimulating(true);
    monitoringEngine.simulateShowRelease(trackers[0].id);
    onRefreshData();
    setTimeout(() => setIsSimulating(false), 500);
  };

  const handleSimulateGlobalSeats = () => {
    if (trackers.length === 0) return;
    setIsSimulating(true);
    const shows = db.getShows();
    if (shows.length > 0) {
      monitoringEngine.simulateSeatRelease(shows[0].id);
    }
    onRefreshData();
    setTimeout(() => setIsSimulating(false), 500);
  };

  // Helper for relative time
  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Main Dashboard: 3 Compact Statistics */}
      <section className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#151A22] border border-[#252D38] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#929BAA] mb-1">
            <span className="text-[11px] font-medium tracking-tight">Active Trackers</span>
            <CrosshairIcon className="w-3.5 h-3.5 text-[#B7F36B]" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[#F4F6FA]">
            {stats.activeTrackers}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#626D7D]">
            <span>{trackers.length} configured</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A22] border border-[#252D38] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#929BAA] mb-1">
            <span className="text-[11px] font-medium tracking-tight">Shows Found</span>
            <Ticket className="w-3.5 h-3.5 text-[#64D99B]" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[#F4F6FA]">
            {stats.newShowsDiscovered}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#64D99B]">
            <span>Across 2 platforms</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151A22] border border-[#252D38] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#929BAA] mb-1">
            <span className="text-[11px] font-medium tracking-tight">Seat Alerts</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F5BE69]" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-[#F4F6FA]">
            {stats.newSeatAlerts}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#F5BE69]">
            <span>Re-opened tickets</span>
          </div>
        </div>
      </section>

      {/* 2. Monitoring Status Section */}
      <section className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                stats.isMonitoringActive
                  ? 'bg-[#B7F36B] shadow-[0_0_8px_rgba(183,243,107,0.8)] animate-pulse'
                  : 'bg-[#626D7D]'
              }`}
            />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F6FA]">
                Cinema Radar {stats.isMonitoringActive ? 'Active' : 'Standby'}
              </h3>
              <p className="text-[11px] text-[#929BAA]">
                {stats.isMonitoringActive
                  ? `WorkManager running in background • ${stats.activeTrackers} active tasks`
                  : 'Monitoring currently paused'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const current = db.getSettings();
              db.saveSettings({
                ...current,
                globalMonitoringEnabled: !current.globalMonitoringEnabled,
              });
              onRefreshData();
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              stats.isMonitoringActive
                ? 'bg-[#B7F36B]/20 text-[#B7F36B] border border-[#B7F36B]/40'
                : 'bg-[#252D38] text-[#929BAA] border border-[#364252]'
            }`}
          >
            {stats.isMonitoringActive ? 'RADAR ON' : 'RADAR OFF'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#252D38]/60 text-xs font-mono">
          <div>
            <span className="text-[#626D7D] block text-[10px] uppercase">Last Check</span>
            <span className="text-[#F4F6FA] font-medium">
              {formatRelativeTime(stats.lastSuccessfulCheck)}
            </span>
          </div>
          <div>
            <span className="text-[#626D7D] block text-[10px] uppercase">Network</span>
            <span
              className={
                stats.isNetworkConnected ? 'text-[#64D99B] font-medium' : 'text-[#F07878] font-medium'
              }
            >
              {stats.isNetworkConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div>
            <span className="text-[#626D7D] block text-[10px] uppercase">Next Check</span>
            <span className="text-[#F4F6FA] font-medium">
              {stats.nextScheduledCheck
                ? `in ${Math.max(1, Math.round((stats.nextScheduledCheck - Date.now()) / 60000))}m`
                : 'Manual only'}
            </span>
          </div>
          <div>
            <span className="text-[#626D7D] block text-[10px] uppercase">Engine</span>
            <span className="text-[#B7F36B] font-medium">WorkManager</span>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Radar Verification & Simulation Bar */}
      <section className="p-3.5 rounded-2xl bg-gradient-to-r from-[#151A22] to-[#1C232E] border border-[#B7F36B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#B7F36B]/10 border border-[#B7F36B]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#B7F36B]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F4F6FA]">
              Verify Live Change Detection
            </h4>
            <p className="text-[11px] text-[#929BAA]">
              Test real-time Android notifications for show releases and reopening seats.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateGlobalShow}
            disabled={isSimulating || trackers.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#151A22] hover:bg-[#1C232E] border border-[#252D38] hover:border-[#B7F36B]/40 text-xs font-medium text-[#F4F6FA] active:scale-95 transition-all disabled:opacity-40"
          >
            + Simulate Show
          </button>
          <button
            onClick={handleSimulateGlobalSeats}
            disabled={isSimulating || trackers.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#B7F36B] hover:bg-[#a6e655] text-xs font-bold text-[#090B0F] active:scale-95 transition-all shadow-sm shadow-[#B7F36B]/20 disabled:opacity-40"
          >
            + Simulate Seat Open
          </button>
        </div>
      </section>

      {/* 4. Active Tracking Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-[#F4F6FA]">
              Active Trackers
            </h3>
            <span className="text-xs font-mono text-[#626D7D]">
              ({activeTrackers.length} active)
            </span>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs active:scale-95 transition-all shadow-md shadow-[#B7F36B]/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create tracker</span>
          </button>
        </div>

        {/* List of Trackers or Empty State */}
        {trackers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#151A22] border border-[#252D38] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1C232E] border border-[#252D38] flex items-center justify-center mx-auto text-[#B7F36B]">
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F4F6FA]">
                Your next movie discovery starts here.
              </h4>
              <p className="text-xs text-[#929BAA] max-w-sm mx-auto mt-1 leading-relaxed">
                Create a tracker and let Cinema Alert watch BookMyShow and District for new shows and seats in the background.
              </p>
            </div>
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs shadow-lg shadow-[#B7F36B]/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Tracker</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {trackers.map((tracker) => {
              const trackerShows = db.getShowsForTracker(tracker.id);

              return (
                <div
                  key={tracker.id}
                  className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] hover:border-[#364252] transition-all space-y-3"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Poster */}
                    <div
                      onClick={() => onOpenTrackerDetails(tracker)}
                      className="w-14 h-19 rounded-xl bg-[#1C232E] border border-[#252D38] overflow-hidden shrink-0 cursor-pointer shadow-md"
                    >
                      {tracker.posterUrl ? (
                        <img
                          src={tracker.posterUrl}
                          alt={tracker.movieName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#626D7D]">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            tracker.isActive
                              ? 'bg-[#B7F36B]/15 text-[#B7F36B] border border-[#B7F36B]/30'
                              : 'bg-[#626D7D]/20 text-[#929BAA] border border-[#252D38]'
                          }`}
                        >
                          {tracker.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1C232E] text-[#929BAA] border border-[#252D38]">
                          {tracker.city}
                        </span>

                        {tracker.platforms.map((p) => (
                          <span
                            key={p}
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10141B] text-[#929BAA] border border-[#252D38]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      <h4
                        onClick={() => onOpenTrackerDetails(tracker)}
                        className="text-sm font-bold text-[#F4F6FA] truncate cursor-pointer hover:text-[#B7F36B] transition-colors"
                      >
                        {tracker.movieName}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-[#929BAA] mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-[#B7F36B]" />
                          {tracker.selectedDates.length === 1
                            ? tracker.selectedDates[0]
                            : `${tracker.selectedDates.length} dates`}
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">
                          {tracker.timeFilter.type === 'any'
                            ? 'Any time'
                            : tracker.timeFilter.type}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-[#64D99B]">
                          {trackerShows.length} shows found
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-[#252D38]/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#626D7D] font-mono">
                      Checked {formatRelativeTime(tracker.lastCheckedAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleTracker(tracker)}
                        title={tracker.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                        className="p-1.5 rounded-lg bg-[#1C232E] hover:bg-[#252D38] text-[#929BAA] hover:text-[#F4F6FA] border border-[#252D38] transition-all"
                      >
                        {tracker.isActive ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-[#B7F36B]" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteTracker(tracker.id)}
                        title="Delete tracker"
                        className="p-1.5 rounded-lg bg-[#1C232E] hover:bg-[#F07878]/20 text-[#626D7D] hover:text-[#F07878] border border-[#252D38] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenTrackerDetails(tracker)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] font-semibold text-xs text-[#F4F6FA] transition-all"
                      >
                        <span>View Shows</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#B7F36B]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Quick Activity Teaser */}
      {stats.newSeatAlerts > 0 && (
        <section
          onClick={onSwitchToActivity}
          className="p-3.5 rounded-2xl bg-[#151A22] border border-[#B7F36B]/30 hover:border-[#B7F36B]/60 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#B7F36B]/10 flex items-center justify-center text-[#B7F36B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#F4F6FA]">
                {stats.newSeatAlerts} Newly Opened Seats Detected
              </h4>
              <p className="text-[11px] text-[#929BAA]">
                Tickets reopened in tracked shows. Tap to view history and book.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#B7F36B]" />
        </section>
      )}
    </div>
  );
};

// Inline helper for radar crosshair icon
function CrosshairIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}
