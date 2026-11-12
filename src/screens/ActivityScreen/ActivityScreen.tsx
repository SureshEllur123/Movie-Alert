import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Ticket,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { NotificationEvent } from '../../types/index.ts';
import { db } from '../../services/database/storage.ts';

interface ActivityScreenProps {
  notifications: NotificationEvent[];
  onRefreshData: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  notifications,
  onRefreshData,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'shows' | 'seats' | 'errors'>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'shows') return n.eventType === 'new_show' || n.eventType === 'new_date';
    if (filterType === 'seats') return n.eventType === 'seats_released';
    if (filterType === 'errors') return n.eventType === 'error';
    return true;
  });

  const handleMarkAllRead = () => {
    db.markAllNotificationsRead();
    onRefreshData();
  };

  const handleClearAll = () => {
    db.clearNotifications();
    onRefreshData();
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F4F6FA] tracking-tight">
            Activity & Alerts
          </h2>
          <p className="text-xs text-[#929BAA]">
            Chronological radar discoveries & seat changes
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg bg-[#151A22] border border-[#252D38] text-[#929BAA] hover:text-[#F4F6FA] transition-all text-xs flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#64D99B]" />
              <span className="hidden xs:inline">Mark read</span>
            </button>
            <button
              onClick={handleClearAll}
              title="Clear activity log"
              className="p-1.5 rounded-lg bg-[#151A22] border border-[#252D38] text-[#626D7D] hover:text-[#F07878] transition-all text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'all', label: 'All Alerts' },
            { id: 'shows', label: 'Shows' },
            { id: 'seats', label: 'Seat Releases' },
            { id: 'errors', label: 'Diagnostics' },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === chip.id
                ? 'bg-[#B7F36B] text-[#090B0F] border-[#B7F36B]'
                : 'bg-[#151A22] text-[#929BAA] border-[#252D38]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#151A22] border border-[#252D38] text-center space-y-3">
          <Bell className="w-10 h-10 mx-auto text-[#626D7D]" />
          <h4 className="text-sm font-bold text-[#F4F6FA]">No alerts in this category</h4>
          <p className="text-xs text-[#626D7D]">
            As soon as matching shows open or seats are freed, notifications will be archived here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isSeatAlert = item.eventType === 'seats_released';
            const isDateAlert = item.eventType === 'new_date';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isRead
                    ? 'bg-[#151A22] border-[#252D38]'
                    : 'bg-[#151A22] border-[#B7F36B]/40 shadow-sm shadow-[#B7F36B]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSeatAlert
                        ? 'bg-[#B7F36B]/10 text-[#B7F36B]'
                        : isDateAlert
                        ? 'bg-[#F5BE69]/10 text-[#F5BE69]'
                        : 'bg-[#64D99B]/10 text-[#64D99B]'
                    }`}
                  >
                    {isSeatAlert ? (
                      <Sparkles className="w-4 h-4" />
                    ) : isDateAlert ? (
                      <Calendar className="w-4 h-4" />
                    ) : (
                      <Ticket className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full ${
                          isSeatAlert
                            ? 'bg-[#B7F36B]/15 text-[#B7F36B] border border-[#B7F36B]/30'
                            : 'bg-[#64D99B]/15 text-[#64D99B] border border-[#64D99B]/30'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#626D7D]">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#F4F6FA] whitespace-pre-line leading-relaxed font-medium">
                      {item.message}
                    </p>

                    {item.details && (
                      <p className="text-[11px] font-mono text-[#B7F36B] mt-1">
                        {item.details}
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-[#252D38]/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C232E] border border-[#252D38] text-[#929BAA]">
                        {item.platform}
                      </span>

                      {item.bookingUrl && (
                        <a
                          href={item.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-bold text-xs active:scale-95 transition-all"
                        >
                          <span>Book</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
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
