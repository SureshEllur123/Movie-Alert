import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { DiscoveredShow, SeatSnapshot } from '../../types/index.ts';
import { db } from '../../services/database/storage.ts';
import { getProvider } from '../../services/providers/index.ts';
import { monitoringEngine } from '../../services/monitoring/monitoringEngine.ts';

interface SeatMatrixModalProps {
  show: DiscoveredShow;
  onClose: () => void;
}

export const SeatMatrixModal: React.FC<SeatMatrixModalProps> = ({ show, onClose }) => {
  const [seats, setSeats] = useState<SeatSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<SeatSnapshot | null>(null);

  const loadSeats = async () => {
    setIsLoading(true);
    const cached = db.getSeatSnapshots(show.id);
    if (cached && cached.length > 0) {
      setSeats(cached);
      setIsLoading(false);
      return;
    }

    const provider = getProvider(show.platform);
    const fresh = await provider.getSeatAvailability(show);
    db.saveSeatSnapshots(show.id, fresh);
    setSeats(fresh);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSeats();
  }, [show.id]);

  const handleSimulateOpening = () => {
    monitoringEngine.simulateSeatRelease(show.id);
    // Reload seats to reflect the newly bookable seats
    setTimeout(() => {
      const updated = db.getSeatSnapshots(show.id);
      if (updated) setSeats([...updated]);
    }, 200);
  };

  // Group seats by row
  const rowsMap = new Map<string, SeatSnapshot[]>();
  seats.forEach((seat) => {
    const list = rowsMap.get(seat.row) || [];
    list.push(seat);
    rowsMap.set(seat.row, list);
  });
  const rowKeys = Array.from(rowsMap.keys());

  const getSeatColor = (status: SeatSnapshot['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-[#B7F36B] border-[#B7F36B] text-[#090B0F] hover:brightness-110';
      case 'TemporarilyBlocked':
        return 'bg-[#F5BE69]/20 border-[#F5BE69] text-[#F5BE69]';
      case 'Booked':
        return 'bg-[#1C232E] border-[#252D38] text-[#626D7D] cursor-not-allowed';
      case 'Unavailable':
      default:
        return 'bg-[#252D38] border-transparent text-[#626D7D] cursor-not-allowed opacity-50';
    }
  };

  const availableCount = seats.filter((s) => s.status === 'Available').length;
  const blockedCount = seats.filter((s) => s.status === 'TemporarilyBlocked').length;
  const bookedCount = seats.filter((s) => s.status === 'Booked').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#10141B] border border-[#252D38] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#252D38] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#1C232E] text-[#B7F36B] border border-[#252D38]">
                {show.platform}
              </span>
              <h3 className="text-sm font-bold text-[#F4F6FA] truncate">
                {show.theatreName}
              </h3>
            </div>
            <p className="text-xs text-[#929BAA] mt-0.5">
              {show.movieName} · {show.format} · {show.time} ({show.date})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#151A22] border border-[#252D38] flex items-center justify-center text-[#929BAA] hover:text-[#F4F6FA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Cinema Screen Arc Graphic */}
          <div className="text-center pt-1 pb-3">
            <div className="h-1.5 w-3/4 mx-auto rounded-full bg-gradient-to-r from-transparent via-[#B7F36B]/60 to-transparent shadow-[0_0_12px_rgba(183,243,107,0.4)]" />
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#626D7D] mt-2">
              All Eyes This Way · Screen
            </p>
          </div>

          {/* Seat Grid */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#929BAA]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#B7F36B] mb-2" />
              <p className="text-xs">Fetching real-time seat matrix...</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[360px] space-y-1.5">
                {rowKeys.map((row) => {
                  const rowSeats = rowsMap.get(row) || [];
                  return (
                    <div key={row} className="flex items-center justify-center gap-1">
                      <span className="w-4 text-[10px] font-mono text-[#626D7D] text-right font-bold mr-1">
                        {row}
                      </span>
                      <div className="flex gap-1">
                        {rowSeats.map((seat) => (
                          <button
                            key={seat.seatId}
                            onClick={() => setSelectedSeat(seat)}
                            title={`${seat.seatId} (${seat.status}) - ₹${seat.price}`}
                            className={`w-5 h-5 rounded-t-sm rounded-b text-[8px] font-bold border transition-all ${getSeatColor(
                              seat.status
                            )} ${selectedSeat?.seatId === seat.seatId ? 'ring-2 ring-white scale-110' : ''}`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                      <span className="w-4 text-[10px] font-mono text-[#626D7D] text-left font-bold ml-1">
                        {row}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 border-t border-[#252D38]/60 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#B7F36B]" />
              <span className="text-[#929BAA]">Available ({availableCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#1C232E] border border-[#252D38]" />
              <span className="text-[#929BAA]">Booked ({bookedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#F5BE69]/20 border border-[#F5BE69]" />
              <span className="text-[#929BAA]">Blocked ({blockedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#252D38]" />
              <span className="text-[#929BAA]">Unavailable</span>
            </div>
          </div>

          {/* Selected Seat Details */}
          {selectedSeat && (
            <div className="p-3 rounded-xl bg-[#151A22] border border-[#252D38] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#626D7D] block">Selected Seat</span>
                <span className="font-bold text-[#F4F6FA] text-sm">
                  Seat {selectedSeat.seatId} · {selectedSeat.priceTier} (₹{selectedSeat.price})
                </span>
              </div>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                  selectedSeat.status === 'Available'
                    ? 'text-[#B7F36B] bg-[#B7F36B]/10'
                    : 'text-[#F5BE69] bg-[#F5BE69]/10'
                }`}
              >
                {selectedSeat.status}
              </span>
            </div>
          )}

          {/* Live Simulation Banner: Test Seat Release */}
          <div className="p-3.5 rounded-xl bg-[#151A22] border border-[#B7F36B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B7F36B]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Live Seat Change Detection</span>
              </div>
              <p className="text-[11px] text-[#929BAA] mt-0.5">
                Simulates previously held/blocked seats (E4, E5, E6) opening up right now.
              </p>
            </div>
            <button
              onClick={handleSimulateOpening}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C232E] hover:bg-[#252D38] border border-[#B7F36B]/40 text-[#B7F36B] text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Opening</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#252D38] bg-[#090B0F] flex items-center justify-between gap-3">
          <p className="text-xs text-[#626D7D]">
            Last checked: {new Date(show.lastChecked).toLocaleTimeString()}
          </p>
          <a
            href={show.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B7F36B] hover:bg-[#a5e656] text-[#090B0F] font-bold text-xs active:scale-95 transition-all shadow-md shadow-[#B7F36B]/10"
          >
            <span>Proceed to Book</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
