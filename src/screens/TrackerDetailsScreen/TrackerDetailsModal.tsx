import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  Grid,
} from 'lucide-react';
import { Tracker, DiscoveredShow } from '../../types/index.ts';
import { db } from '../../services/database/storage.ts';
import { monitoringEngine } from '../../services/monitoring/monitoringEngine.ts';
import { SeatMatrixModal } from '../../components/seats/SeatMatrixModal.tsx';

interface TrackerDetailsModalProps {
  tracker: Tracker;
  onClose: () => void;
  onTrackerUpdated: () => void;
}

export const TrackerDetailsModal: React.FC<TrackerDetailsModalProps> = ({
  tracker,
  onClose,
  onTrackerUpdated,
}) => {
  const [shows, setShows] = useState<DiscoveredShow[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedShowForSeats, setSelectedShowForSeats] = useState<DiscoveredShow | null>(null);

  const loadShows = () => {
    const list = db.getShowsForTracker(tracker.id);
    setShows(list);
  };

  useEffect(() => {
    loadShows();
  }, [tracker.id]);

  const handleSimulateNewShow = () => {
    monitoringEngine.simulateShowRelease(tracker.id);
    loadShows();
    onTrackerUpdated();
  };

  const filteredShows = shows.filter((s) => {
    if (selectedPlatform === 'all') return true;
    return s.platform === selectedPlatform;
  });

  // Group shows by date
  const groupedByDate: Record<string, DiscoveredShow[]> = {};
  filteredShows.forEach((s) => {
    if (!groupedByDate[s.date]) {
      groupedByDate[s.date] = [];
    }
    groupedByDate[s.date].push(s);
  });

  const dates = Object.keys(groupedByDate).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#10141B] border border-[#252D38] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Movie Details */}
        <div className="relative p-5 border-b border-[#252D38] bg-gradient-to-b from-[#151A22] to-[#10141B]">
          <div className="flex items-start gap-4">
            <div className="w-16 h-22 rounded-xl bg-[#1C232E] border border-[#252D38] overflow-hidden shrink-0 shadow-lg">
              {tracker.posterUrl ? (
                <img
                  src={tracker.posterUrl}
                  alt={tracker.movieName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#626D7D]">
                  <Film className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    tracker.isActive
                      ? 'bg-[#B7F36B]/15 text-[#B7F36B] border border-[#B7F36B]/30'
                      : 'bg-[#626D7D]/20 text-[#929BAA] border border-[#252D38]'
                  }`}
                >
                  {tracker.isActive ? 'ACTIVE RADAR' : 'PAUSED'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C232E] text-[#929BAA] border border-[#252D38]">
                  Every {tracker.monitoringIntervalMinutes === 0 ? '45s (Foreground)' : `${tracker.monitoringIntervalMinutes}m`}
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#F4F6FA] truncate mt-1">
                {tracker.movieName}
              </h2>

              <div className="flex items-center gap-3 text-xs text-[#929BAA] mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#B7F36B]" />
                  {tracker.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#B7F36B]" />
                  {tracker.selectedDates.length} Dates
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#B7F36B]" />
                  {tracker.timeFilter.type === 'any' ? 'Any time' : tracker.timeFilter.type}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#151A22] border border-[#252D38] flex items-center justify-center text-[#929BAA] hover:text-[#F4F6FA]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Bar & Simulation Button */}
          <div className="mt-4 pt-3 border-t border-[#252D38]/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#626D7D] mr-1">Platform:</span>
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  selectedPlatform === 'all'
                    ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                    : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                }`}
              >
                All ({shows.length})
              </button>
              {tracker.platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    selectedPlatform === p
                      ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B] font-bold'
                      : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Simulation trigger */}
            <button
              onClick={handleSimulateNewShow}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#151A22] hover:bg-[#1C232E] border border-[#B7F36B]/40 text-[#B7F36B] text-xs font-semibold active:scale-95 transition-all ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Show Release</span>
            </button>
          </div>
        </div>

        {/* Shows Feed */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {dates.length === 0 ? (
            <div className="py-12 text-center text-[#929BAA]">
              <Ticket className="w-10 h-10 mx-auto text-[#626D7D] mb-3" />
              <h4 className="text-sm font-semibold text-[#F4F6FA]">No matching shows discovered yet</h4>
              <p className="text-xs text-[#626D7D] mt-1 max-w-sm mx-auto">
                Cinema Alert is monitoring BookMyShow and District in the background. As soon as shows are released, they will appear here.
              </p>
              <button
                onClick={handleSimulateNewShow}
                className="mt-4 px-4 py-2 rounded-xl bg-[#151A22] border border-[#B7F36B]/40 text-[#B7F36B] text-xs font-bold"
              >
                Simulate Show Release Now
              </button>
            </div>
          ) : (
            dates.map((dateStr) => {
              const dateShows = groupedByDate[dateStr] || [];
              const dateObj = new Date(dateStr);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B7F36B]">
                      {formattedDate}
                    </span>
                    <span className="text-[11px] text-[#626D7D]">({dateShows.length} shows)</span>
                    <div className="flex-1 h-px bg-[#252D38]" />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {dateShows.map((show) => (
                      <div
                        key={show.id}
                        className="p-3.5 rounded-xl bg-[#151A22] border border-[#252D38] hover:border-[#364252] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#F4F6FA]">
                              {show.theatreName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1C232E] border border-[#252D38] text-[#929BAA]">
                              {show.platform}
                            </span>
                            {show.isNewRelease && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#64D99B]/20 text-[#64D99B] border border-[#64D99B]/40">
                                NEW RELEASE
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#929BAA] flex-wrap">
                            <span className="font-bold text-[#B7F36B]">{show.time}</span>
                            <span>•</span>
                            <span>{show.language}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#1C232E] text-[10px] text-[#F4F6FA]">
                              {show.format}
                            </span>
                            {show.availableSeatsCount !== undefined && (
                              <>
                                <span>•</span>
                                <span
                                  className={
                                    show.availableSeatsCount < 10
                                      ? 'text-[#F5BE69]'
                                      : 'text-[#64D99B]'
                                  }
                                >
                                  {show.availableSeatsCount} seats available
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedShowForSeats(show)}
                            title="Inspect live cinema seat layout and status"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1C232E] hover:bg-[#252D38] border border-[#252D38] text-xs text-[#F4F6FA] active:scale-95 transition-all"
                          >
                            <Grid className="w-3.5 h-3.5 text-[#B7F36B]" />
                            <span>Seats</span>
                          </button>

                          <a
                            href={show.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs active:scale-95 transition-all"
                          >
                            <span>Book</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#252D38] bg-[#090B0F] flex items-center justify-between text-xs text-[#626D7D]">
          <span>
            Theatres: {tracker.theatres.length > 0 ? tracker.theatres.join(', ') : 'All in ' + tracker.city}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#151A22] border border-[#252D38] text-[#F4F6FA] hover:bg-[#1C232E]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Seat Matrix Modal */}
      {selectedShowForSeats && (
        <SeatMatrixModal
          show={selectedShowForSeats}
          onClose={() => {
            setSelectedShowForSeats(null);
            loadShows();
          }}
        />
      )}
    </div>
  );
};
