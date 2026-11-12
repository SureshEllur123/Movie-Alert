import React, { useEffect, useState } from 'react';
import { Radar, X, ExternalLink, Ticket, Sparkles } from 'lucide-react';
import { NotificationEvent } from '../../types/index.ts';
import { notificationService } from '../../services/notifications/notificationService.ts';

export const AndroidNotificationHud: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<NotificationEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((event) => {
      setCurrentEvent(event);
      setIsVisible(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 7500);
    return () => clearTimeout(timer);
  }, [isVisible, currentEvent]);

  if (!isVisible || !currentEvent) return null;

  const isSeatAlert = currentEvent.eventType === 'seats_released';

  return (
    <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative rounded-2xl bg-[#151A22] border border-[#B7F36B]/40 shadow-2xl shadow-black/80 p-3.5 backdrop-blur-xl">
        {/* Android status bar style header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#252D38]/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#1C232E] border border-[#252D38] flex items-center justify-center">
              <Radar className="w-3 h-3 text-[#B7F36B]" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide uppercase text-[#929BAA]">
              Cinema Alert
            </span>
            <span className="text-[10px] text-[#626D7D]">• now</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isSeatAlert
                  ? 'bg-[#B7F36B]/15 text-[#B7F36B] border border-[#B7F36B]/30'
                  : 'bg-[#64D99B]/15 text-[#64D99B] border border-[#64D99B]/30'
              }`}
            >
              {isSeatAlert ? 'SEATS JUST OPENED' : 'NEW SHOW DISCOVERED'}
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-[#626D7D] hover:text-[#F4F6FA] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSeatAlert ? 'bg-[#B7F36B]/10 text-[#B7F36B]' : 'bg-[#64D99B]/10 text-[#64D99B]'
            }`}
          >
            {isSeatAlert ? <Sparkles className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#F4F6FA] truncate">
              {currentEvent.title}
            </h4>
            <p className="text-xs text-[#929BAA] whitespace-pre-line leading-relaxed mt-0.5">
              {currentEvent.message}
            </p>
            {currentEvent.details && (
              <p className="text-[11px] font-mono text-[#B7F36B] mt-1">
                {currentEvent.details}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {currentEvent.bookingUrl && (
          <div className="mt-3 pt-2.5 border-t border-[#252D38]/60 flex justify-end">
            <a
              href={currentEvent.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B7F36B] hover:bg-[#a6e655] text-[#090B0F] font-semibold text-xs active:scale-95 transition-all shadow-sm shadow-[#B7F36B]/20"
            >
              <span>{isSeatAlert ? 'Book seats now' : 'View booking'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
