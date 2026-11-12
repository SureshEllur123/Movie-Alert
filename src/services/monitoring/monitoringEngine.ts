import { db } from '../database/storage.ts';
import { getProvider } from '../providers/index.ts';
import { detectNewShows, detectSeatAvailabilityChanges } from './changeDetection.ts';
import { notificationService } from '../notifications/notificationService.ts';
import { DiscoveredShow, NotificationEvent, MonitoringLog, SeatSnapshot, Tracker } from '../../types/index.ts';

type StatusUpdateListener = () => void;

class MonitoringEngine {
  private timerId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private listeners: Set<StatusUpdateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.addLogEntry('System', 'All', 'success', 0, 0, 'Internet connection restored. Resuming background radar.');
        this.runCycle();
      });
      window.addEventListener('offline', () => {
        this.addLogEntry('System', 'All', 'warning', 0, 0, 'Internet connection lost. Monitoring paused until network returns.');
        this.notifyListeners();
      });
    }
  }

  subscribe(listener: StatusUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Listener error:', err);
      }
    });
  }

  start(): void {
    const settings = db.getSettings();
    if (!settings.globalMonitoringEnabled) return;

    this.stop();

    // Determine interval in ms
    // Continuous foreground = 45s for demo/monitoring; 15m, 30m, 60m
    const intervalMinutes = settings.defaultIntervalMinutes ?? 15;
    const intervalMs = intervalMinutes === 0 ? 45000 : intervalMinutes * 60 * 1000;

    this.timerId = setInterval(() => {
      this.runCycle();
    }, intervalMs);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a monitoring cycle across active trackers.
   */
  async runCycle(targetTrackerId?: string): Promise<{ showsFound: number; newSeatsFound: number }> {
    if (this.isRunning) return { showsFound: 0, newSeatsFound: 0 };
    this.isRunning = true;
    this.notifyListeners();

    let totalShows = 0;
    let totalNewSeats = 0;

    try {
      const allTrackers = db.getTrackers();
      const activeTrackers = targetTrackerId
        ? allTrackers.filter((t) => t.id === targetTrackerId)
        : allTrackers.filter((t) => t.isActive);

      if (activeTrackers.length === 0) {
        this.isRunning = false;
        this.notifyListeners();
        return { showsFound: 0, newSeatsFound: 0 };
      }

      for (const tracker of activeTrackers) {
        const { showsDiscovered, newSeatsDiscovered } = await this.checkTracker(tracker);
        totalShows += showsDiscovered;
        totalNewSeats += newSeatsDiscovered;
      }
    } catch (err) {
      console.error('Monitoring cycle failed:', err);
      this.addLogEntry(
        targetTrackerId ? 'Tracker' : 'All',
        'All',
        'error',
        0,
        0,
        `Monitoring check failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      this.isRunning = false;
      this.notifyListeners();
    }

    return { showsFound: totalShows, newSeatsFound: totalNewSeats };
  }

  /**
   * Checks a single tracker across its configured platforms.
   */
  private async checkTracker(tracker: Tracker): Promise<{ showsDiscovered: number; newSeatsDiscovered: number }> {
    const existingShows = db.getShowsForTracker(tracker.id);
    const discoveredFromAllPlatforms: DiscoveredShow[] = [];
    let newSeatsCount = 0;
    let newShowsCount = 0;

    for (const platform of tracker.platforms) {
      const provider = getProvider(platform);
      try {
        const shows = await provider.discoverShows(tracker);
        discoveredFromAllPlatforms.push(...shows);
      } catch (err) {
        this.addLogEntry(
          tracker.id,
          platform,
          'warning',
          0,
          0,
          `Provider check issue on ${platform}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // 1. Show Diffing
    const showDiff = detectNewShows(discoveredFromAllPlatforms, existingShows);

    if (showDiff.newShows.length > 0 && tracker.alertPreferences.newShowReleased) {
      newShowsCount += showDiff.newShows.length;
      for (const newShow of showDiff.newShows) {
        const notif: NotificationEvent = {
          id: `notif_show_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          trackerId: tracker.id,
          movieName: tracker.movieName,
          theatreName: newShow.theatreName,
          date: newShow.date,
          time: newShow.time,
          platform: newShow.platform,
          eventType: 'new_show',
          title: 'NEW SHOW DISCOVERED',
          message: `${tracker.movieName} · ${newShow.language} ${newShow.format}\n${newShow.theatreName}\n${newShow.date} · ${newShow.time}`,
          details: `Booking is now live on ${newShow.platform}.`,
          bookingUrl: newShow.bookingUrl,
          createdAt: Date.now(),
          isRead: false,
        };
        notificationService.notify(notif);
      }
    }

    // Alert on new booking dates
    if (showDiff.hasNewDates && tracker.alertPreferences.newDatesAvailable) {
      const notif: NotificationEvent = {
        id: `notif_date_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        trackerId: tracker.id,
        movieName: tracker.movieName,
        theatreName: tracker.theatres[0] || tracker.city,
        date: showDiff.newDatesFound[0],
        time: 'All Day',
        platform: tracker.platforms[0] || 'BookMyShow',
        eventType: 'new_date',
        title: 'NEW BOOKING DATE OPENED',
        message: `Your tracked movie ${tracker.movieName} is now open for booking on ${showDiff.newDatesFound.join(', ')}!`,
        bookingUrl: discoveredFromAllPlatforms[0]?.bookingUrl,
        createdAt: Date.now(),
        isRead: false,
      };
      notificationService.notify(notif);
    }

    // 2. Seat Availability Snapshot Comparison
    for (const show of discoveredFromAllPlatforms) {
      const provider = getProvider(show.platform);
      try {
        const currentSeats = await provider.getSeatAvailability(show);
        const previousSeats = db.getSeatSnapshots(show.id);

        const seatDiff = detectSeatAvailabilityChanges(previousSeats, currentSeats);

        if (seatDiff.hasNewlyAvailableSeats && tracker.alertPreferences.seatsBecomeBookable) {
          newSeatsCount += seatDiff.newlyAvailableSeats.length;
          const seatLabels = seatDiff.newlyAvailableSeats.map((s) => s.seatId).join(', ');

          const notif: NotificationEvent = {
            id: `notif_seat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            trackerId: tracker.id,
            movieName: tracker.movieName,
            theatreName: show.theatreName,
            date: show.date,
            time: show.time,
            platform: show.platform,
            eventType: 'seats_released',
            title: 'SEATS JUST OPENED',
            message: `${tracker.movieName} · ${show.format}\n${show.theatreName}\n${show.date} · ${show.time}\n${seatDiff.newlyAvailableSeats.length} newly bookable seats detected.`,
            details: `Seats: ${seatLabels}`,
            bookingUrl: show.bookingUrl,
            createdAt: Date.now(),
            isRead: false,
            newlyAvailableSeats: seatDiff.newlyAvailableSeats.map((s) => s.seatId),
          };
          notificationService.notify(notif);

          show.availability = 'SeatsReleased';
        }

        // Save current snapshot
        db.saveSeatSnapshots(show.id, currentSeats);
      } catch (seatErr) {
        console.error('Error fetching seats for show:', show.id, seatErr);
      }
    }

    // Upsert shows
    db.upsertShows(discoveredFromAllPlatforms);

    // Update tracker metadata
    tracker.lastCheckedAt = Date.now();
    tracker.discoveredShowsCount = (tracker.discoveredShowsCount || 0) + newShowsCount;
    tracker.newSeatsAlertsCount = (tracker.newSeatsAlertsCount || 0) + newSeatsCount;
    db.updateTracker(tracker);

    // Add log
    this.addLogEntry(
      tracker.id,
      'All',
      'success',
      discoveredFromAllPlatforms.length,
      newSeatsCount,
      `Checked ${discoveredFromAllPlatforms.length} shows across ${tracker.platforms.join(', ')}. ${newShowsCount} new shows, ${newSeatsCount} newly bookable seats.`
    );

    return { showsDiscovered: newShowsCount, newSeatsDiscovered: newSeatsCount };
  }

  private addLogEntry(
    trackerId: string,
    platform: 'BookMyShow' | 'District' | 'All',
    status: 'success' | 'warning' | 'error',
    showsFound: number,
    newSeatsFound: number,
    message: string
  ): void {
    const log: MonitoringLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
      trackerId,
      platform,
      status,
      showsFound,
      newSeatsFound,
      message,
    };
    db.addLog(log);
  }

  /**
   * Simulation Helper 1: Simulates immediate show release for a tracker.
   */
  simulateShowRelease(trackerId: string): void {
    const tracker = db.getTracker(trackerId);
    if (!tracker) return;

    const now = Date.now();
    const date = tracker.selectedDates[0] || new Date().toISOString().split('T')[0];

    const newShow: DiscoveredShow = {
      id: `show_sim_release_${Date.now()}`,
      trackerId: tracker.id,
      movieName: tracker.movieName,
      theatreName: tracker.theatres[0] || 'Allu Cinemas: Gandipet',
      theatreChain: tracker.theatreChains?.[0] || 'Allu Cinemas',
      city: tracker.city,
      date,
      time: '04:15 PM',
      time24: '16:15',
      language: tracker.language === 'any' ? 'Telugu' : tracker.language,
      format: 'IMAX 3D Laser',
      platform: 'BookMyShow',
      bookingUrl: `https://in.bookmyshow.com/buytickets/${tracker.movieName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      availability: 'Available',
      availableSeatsCount: 34,
      totalSeatsCount: 160,
      lastChecked: now,
      isNewRelease: true,
    };

    db.upsertShows([newShow]);
    tracker.discoveredShowsCount = (tracker.discoveredShowsCount || 0) + 1;
    db.updateTracker(tracker);

    const notif: NotificationEvent = {
      id: `notif_sim_show_${Date.now()}`,
      trackerId: tracker.id,
      movieName: tracker.movieName,
      theatreName: newShow.theatreName,
      date: newShow.date,
      time: newShow.time,
      platform: 'BookMyShow',
      eventType: 'new_show',
      title: 'NEW SHOW DISCOVERED',
      message: `${tracker.movieName} · ${newShow.language} ${newShow.format}\n${newShow.theatreName}\n${newShow.date} · ${newShow.time}`,
      details: 'Prime IMAX show just opened for advance booking!',
      bookingUrl: newShow.bookingUrl,
      createdAt: now,
      isRead: false,
    };
    notificationService.notify(notif);
    this.addLogEntry(tracker.id, 'BookMyShow', 'success', 1, 0, 'New IMAX 3D show detected and notified.');
    this.notifyListeners();
  }

  /**
   * Simulation Helper 2: Simulates newly bookable seats opening up in an existing show.
   */
  simulateSeatRelease(showId: string): void {
    const show = db.getShowById(showId);
    if (!show) return;

    const previousSeats = db.getSeatSnapshots(show.id) || [];
    let updatedSeats: SeatSnapshot[];

    if (previousSeats.length === 0) {
      // Build base seats with some blocked
      const p = getProvider(show.platform);
      p.getSeatAvailability(show).then((baseSeats) => {
        // Mark E5, E6, E7 as Available
        const newlyOpened: SeatSnapshot[] = [];
        baseSeats.forEach((s) => {
          if (['E5', 'E6', 'E7'].includes(s.seatId)) {
            s.status = 'Available';
            newlyOpened.push(s);
          }
        });
        db.saveSeatSnapshots(show.id, baseSeats);
        this.dispatchSeatAlert(show, newlyOpened);
      });
      return;
    }

    // Toggle 3 previously unavailable seats to Available
    const openedSeats: SeatSnapshot[] = [];
    updatedSeats = previousSeats.map((s) => {
      if (['E4', 'E5', 'E6'].includes(s.seatId)) {
        openedSeats.push({ ...s, status: 'Available' });
        return { ...s, status: 'Available' as const };
      }
      return s;
    });

    db.saveSeatSnapshots(show.id, updatedSeats);
    this.dispatchSeatAlert(show, openedSeats);
  }

  private dispatchSeatAlert(show: DiscoveredShow, newlyOpened: SeatSnapshot[]): void {
    const seatLabels = newlyOpened.map((s) => s.seatId).join(', ');
    const notif: NotificationEvent = {
      id: `notif_sim_seat_${Date.now()}`,
      trackerId: show.trackerId,
      movieName: show.movieName,
      theatreName: show.theatreName,
      date: show.date,
      time: show.time,
      platform: show.platform,
      eventType: 'seats_released',
      title: 'SEATS JUST OPENED',
      message: `${show.movieName} · ${show.format}\n${show.theatreName}\n${show.date} · ${show.time}\n${newlyOpened.length} newly bookable seats detected!`,
      details: `Seats: ${seatLabels}`,
      bookingUrl: show.bookingUrl,
      createdAt: Date.now(),
      isRead: false,
      newlyAvailableSeats: newlyOpened.map((s) => s.seatId),
    };
    notificationService.notify(notif);

    show.availability = 'SeatsReleased';
    db.upsertShows([show]);

    const tracker = db.getTracker(show.trackerId);
    if (tracker) {
      tracker.newSeatsAlertsCount = (tracker.newSeatsAlertsCount || 0) + 1;
      db.updateTracker(tracker);
    }

    this.addLogEntry(
      show.trackerId,
      show.platform,
      'success',
      0,
      newlyOpened.length,
      `Real-time seat change: ${seatLabels} transitioned to Available.`
    );
    this.notifyListeners();
  }
}

export const monitoringEngine = new MonitoringEngine();
