import React, { useState } from 'react';
import {
  Crosshair,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  MapPin,
  Film,
  Search,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Tracker } from '../../types/index.ts';
import { db } from '../../services/database/storage.ts';

interface TrackersScreenProps {
  trackers: Tracker[];
  onOpenCreate: () => void;
  onOpenTrackerDetails: (tracker: Tracker) => void;
  onRefreshData: () => void;
}

export const TrackersScreen: React.FC<TrackersScreenProps> = ({
  trackers,
  onOpenCreate,
  onOpenTrackerDetails,
  onRefreshData,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = trackers.filter((t) => {
    if (filterStatus === 'active' && !t.isActive) return false;
    if (filterStatus === 'paused' && t.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.movieName.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.platforms.some((p) => p.toLowerCase().includes(q))
      );
    }
    return true;
  });

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

  const handlePauseAll = () => {
    trackers.forEach((t) => {
      t.isActive = false;
      db.updateTracker(t);
    });
    onRefreshData();
  };

  const handleResumeAll = () => {
    trackers.forEach((t) => {
      t.isActive = true;
      db.updateTracker(t);
    });
    onRefreshData();
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F4F6FA] tracking-tight">
            Movie Trackers
          </h2>
          <p className="text-xs text-[#929BAA]">
            Configure and monitor cinema releases
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs active:scale-95 transition-all shadow-md shadow-[#B7F36B]/15"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tracker</span>
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#626D7D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie, city, platform..."
            className="w-full bg-[#151A22] border border-[#252D38] focus:border-[#B7F36B] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F4F6FA] placeholder-[#626D7D] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'active', 'paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-xl border text-xs capitalize font-medium transition-all ${
                filterStatus === status
                  ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                  : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Actions */}
      {trackers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#626D7D] px-1">
          <span>Showing {filtered.length} of {trackers.length} trackers</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResumeAll}
              className="text-[#64D99B] hover:underline"
            >
              Resume all
            </button>
            <span>•</span>
            <button
              onClick={handlePauseAll}
              className="text-[#929BAA] hover:underline"
            >
              Pause all
            </button>
          </div>
        </div>
      )}

      {/* Trackers List */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#151A22] border border-[#252D38] text-center space-y-3">
          <Crosshair className="w-10 h-10 mx-auto text-[#626D7D]" />
          <h4 className="text-sm font-bold text-[#F4F6FA]">No trackers found</h4>
          <p className="text-xs text-[#626D7D]">
            {searchQuery
              ? 'Try modifying your search query or status filter.'
              : 'Add your first movie tracker to start background monitoring.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((tracker) => {
            const shows = db.getShowsForTracker(tracker.id);

            return (
              <div
                key={tracker.id}
                className="p-4 rounded-2xl bg-[#151A22] border border-[#252D38] hover:border-[#364252] transition-all space-y-3"
              >
                <div className="flex items-start gap-3.5">
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
                      <span className="text-[11px] text-[#64D99B]">
                        {shows.length} shows active
                      </span>
                      <span>•</span>
                      <span className="text-[11px] font-mono text-[#F5BE69]">
                        {tracker.newSeatsAlertsCount} seat alerts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#252D38]/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#626D7D]">
                    {tracker.theatres.length === 0
                      ? 'All theatres in ' + tracker.city
                      : `${tracker.theatres.length} selected theatres`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleTracker(tracker)}
                      title={tracker.isActive ? 'Pause' : 'Resume'}
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
                      title="Delete"
                      className="p-1.5 rounded-lg bg-[#1C232E] hover:bg-[#F07878]/20 text-[#626D7D] hover:text-[#F07878] border border-[#252D38] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenTrackerDetails(tracker)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] font-semibold text-xs text-[#F4F6FA] transition-all"
                    >
                      <span>Shows</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#B7F36B]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
