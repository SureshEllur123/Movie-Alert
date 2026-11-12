import {
  Tracker,
  DiscoveredShow,
  SeatSnapshot,
  NotificationEvent,
  MonitoringLog,
  AppStats,
} from '../../types/index.ts';

const TRACKERS_KEY = 'cinema_alert_trackers_v1';
const SHOWS_KEY = 'cinema_alert_shows_v1';
const SEATS_KEY = 'cinema_alert_seats_v1';
const NOTIFICATIONS_KEY = 'cinema_alert_notifications_v1';
const LOGS_KEY = 'cinema_alert_logs_v1';
const SETTINGS_KEY = 'cinema_alert_settings_v1';

export interface UserSettings {
  globalMonitoringEnabled: boolean;
  defaultIntervalMinutes: 15 | 30 | 60 | 0;
  soundEnabled: boolean;
  systemNotificationsEnabled: boolean;
  showAndroidNotificationHud: boolean;
  lastSimulatedEventTime?: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  globalMonitoringEnabled: true,
  defaultIntervalMinutes: 15,
  soundEnabled: true,
  systemNotificationsEnabled: true,
  showAndroidNotificationHud: true,
};

// Seed sample tracker to showcase the app immediately
function getInitialSeedTrackers(): Tracker[] {
  const now = Date.now();
  // Get upcoming dates: today, tomorrow, day after tomorrow in YYYY-MM-DD
  const d0 = new Date(now);
  const d1 = new Date(now + 86400000);
  const d2 = new Date(now + 172800000);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return [
    {
      id: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      movieIdentifier: 'ramayana-part-1',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      selectedDates: [formatDate(d0), formatDate(d1), formatDate(d2)],
      timeFilter: { type: 'any' },
      language: 'any',
      city: 'Hyderabad',
      theatres: ['Allu Cinemas', 'AMB Cinemas', 'Prasads Multiplex'],
      theatreChains: ['Allu Cinemas', 'AMB Cinemas', 'PVR'],
      platforms: ['BookMyShow', 'District'],
      alertPreferences: {
        newShowReleased: true,
        seatsBecomeBookable: true,
        newDatesAvailable: true,
        crossPlatformShow: true,
      },
      monitoringIntervalMinutes: 15,
      isActive: true,
      createdAt: now - 3600000 * 4,
      updatedAt: now,
      lastCheckedAt: now - 180000,
      discoveredShowsCount: 4,
      newSeatsAlertsCount: 2,
    },
    {
      id: 'tracker_kalki_demo',
      movieName: 'Kalki 2898 AD: The Return',
      movieIdentifier: 'kalki-2898-ad',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      selectedDates: [formatDate(d1), formatDate(d2)],
      timeFilter: { type: 'evening' },
      language: 'Telugu',
      city: 'Bengaluru',
      theatres: ['PVR: Forum Mall, Koramangala', 'INOX: Nexus Mall'],
      theatreChains: ['PVR', 'INOX'],
      platforms: ['BookMyShow', 'District'],
      alertPreferences: {
        newShowReleased: true,
        seatsBecomeBookable: true,
        newDatesAvailable: true,
        crossPlatformShow: false,
      },
      monitoringIntervalMinutes: 30,
      isActive: true,
      createdAt: now - 3600000 * 24,
      updatedAt: now,
      lastCheckedAt: now - 600000,
      discoveredShowsCount: 3,
      newSeatsAlertsCount: 1,
    },
  ];
}

function getInitialSeedShows(): DiscoveredShow[] {
  const now = Date.now();
  const d0 = new Date(now).toISOString().split('T')[0];
  const d1 = new Date(now + 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'show_ramayana_allu_1',
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      theatreName: 'Allu Cinemas: Gandipet',
      theatreChain: 'Allu Cinemas',
      city: 'Hyderabad',
      date: d0,
      time: '11:15 AM',
      time24: '11:15',
      language: 'Telugu',
      format: 'IMAX 3D',
      platform: 'BookMyShow',
      bookingUrl: 'https://in.bookmyshow.com/buytickets/allu-cinemas-gandipet/cinema-hyd-ACGP',
      availability: 'FillingFast',
      availableSeatsCount: 18,
      totalSeatsCount: 160,
      lastChecked: now - 180000,
      isNewRelease: false,
    },
    {
      id: 'show_ramayana_allu_2',
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      theatreName: 'Allu Cinemas: Gandipet',
      theatreChain: 'Allu Cinemas',
      city: 'Hyderabad',
      date: d0,
      time: '03:30 PM',
      time24: '15:30',
      language: 'Hindi',
      format: 'Dolby Cinema',
      platform: 'District',
      bookingUrl: 'https://district.in/events/allu-cinemas-ramayana',
      availability: 'SeatsReleased',
      availableSeatsCount: 4,
      totalSeatsCount: 160,
      lastChecked: now - 180000,
      isNewRelease: true,
    },
    {
      id: 'show_ramayana_amb_1',
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      theatreName: 'AMB Cinemas: Gachibowli',
      theatreChain: 'AMB Cinemas',
      city: 'Hyderabad',
      date: d1,
      time: '07:00 PM',
      time24: '19:00',
      language: 'Telugu',
      format: 'Laser 4K Dolby Atmos',
      platform: 'BookMyShow',
      bookingUrl: 'https://in.bookmyshow.com/buytickets/amb-cinemas-gachibowli/cinema-hyd-AMBG',
      availability: 'SoldOut',
      availableSeatsCount: 0,
      totalSeatsCount: 220,
      lastChecked: now - 180000,
      isNewRelease: false,
    },
    {
      id: 'show_kalki_pvr_1',
      trackerId: 'tracker_kalki_demo',
      movieName: 'Kalki 2898 AD: The Return',
      theatreName: 'PVR: Forum Mall, Koramangala',
      theatreChain: 'PVR',
      city: 'Bengaluru',
      date: d1,
      time: '06:45 PM',
      time24: '18:45',
      language: 'Telugu',
      format: 'IMAX 2D',
      platform: 'BookMyShow',
      bookingUrl: 'https://in.bookmyshow.com/buytickets/pvr-forum-koramangala/cinema-bng-PVRF',
      availability: 'Available',
      availableSeatsCount: 42,
      totalSeatsCount: 180,
      lastChecked: now - 600000,
      isNewRelease: false,
    },
  ];
}

function getInitialSeedNotifications(): NotificationEvent[] {
  const now = Date.now();
  return [
    {
      id: 'notif_1',
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      theatreName: 'Allu Cinemas: Gandipet',
      date: new Date(now).toISOString().split('T')[0],
      time: '03:30 PM',
      platform: 'District',
      eventType: 'seats_released',
      title: 'SEATS JUST OPENED',
      message: 'Allu Cinemas · Dolby Cinema 3D\n3 newly bookable seats detected in Gold Row E.',
      details: 'Seats: E5, E6, E7',
      bookingUrl: 'https://district.in/events/allu-cinemas-ramayana',
      createdAt: now - 1800000,
      isRead: false,
      newlyAvailableSeats: ['E5', 'E6', 'E7'],
    },
    {
      id: 'notif_2',
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      theatreName: 'Allu Cinemas: Gandipet',
      date: new Date(now).toISOString().split('T')[0],
      time: '11:15 AM',
      platform: 'BookMyShow',
      eventType: 'new_show',
      title: 'NEW SHOW DISCOVERED',
      message: 'Ramayana (Part 1) · Telugu IMAX 3D\nAllu Cinemas · Booking just opened!',
      details: 'Showtime: 11:15 AM',
      bookingUrl: 'https://in.bookmyshow.com/buytickets/allu-cinemas-gandipet/cinema-hyd-ACGP',
      createdAt: now - 7200000,
      isRead: true,
    },
  ];
}

function getInitialSeedLogs(): MonitoringLog[] {
  const now = Date.now();
  return [
    {
      id: 'log_1',
      timestamp: now - 180000,
      trackerId: 'tracker_ramayana_demo',
      movieName: 'Ramayana (Part 1)',
      platform: 'All',
      status: 'success',
      showsFound: 3,
      newSeatsFound: 3,
      message: 'Cycle completed in 412ms. 3 new bookable seats found in Allu Cinemas.',
    },
    {
      id: 'log_2',
      timestamp: now - 600000,
      trackerId: 'tracker_kalki_demo',
      movieName: 'Kalki 2898 AD: The Return',
      platform: 'BookMyShow',
      status: 'success',
      showsFound: 1,
      newSeatsFound: 0,
      message: 'Check succeeded. Show status: Available (42 seats).',
    },
  ];
}

class LocalDatabase {
  // --- TRACKERS ---
  getTrackers(): Tracker[] {
    const raw = localStorage.getItem(TRACKERS_KEY);
    if (!raw) {
      const seeded = getInitialSeedTrackers();
      this.saveTrackers(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getInitialSeedTrackers();
    }
  }

  saveTrackers(trackers: Tracker[]): void {
    localStorage.setItem(TRACKERS_KEY, JSON.stringify(trackers));
  }

  getTracker(id: string): Tracker | undefined {
    return this.getTrackers().find((t) => t.id === id);
  }

  addTracker(tracker: Tracker): void {
    const trackers = this.getTrackers();
    trackers.unshift(tracker);
    this.saveTrackers(trackers);
  }

  updateTracker(updated: Tracker): void {
    const trackers = this.getTrackers().map((t) => (t.id === updated.id ? updated : t));
    this.saveTrackers(trackers);
  }

  deleteTracker(id: string): void {
    const trackers = this.getTrackers().filter((t) => t.id !== id);
    this.saveTrackers(trackers);

    // Also remove associated shows
    const shows = this.getShows().filter((s) => s.trackerId !== id);
    this.saveShows(shows);
  }

  // --- SHOWS ---
  getShows(): DiscoveredShow[] {
    const raw = localStorage.getItem(SHOWS_KEY);
    if (!raw) {
      const seeded = getInitialSeedShows();
      this.saveShows(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getInitialSeedShows();
    }
  }

  saveShows(shows: DiscoveredShow[]): void {
    localStorage.setItem(SHOWS_KEY, JSON.stringify(shows));
  }

  getShowsForTracker(trackerId: string): DiscoveredShow[] {
    return this.getShows().filter((s) => s.trackerId === trackerId);
  }

  getShowById(showId: string): DiscoveredShow | undefined {
    return this.getShows().find((s) => s.id === showId);
  }

  upsertShows(showsToUpsert: DiscoveredShow[]): void {
    const all = this.getShows();
    const map = new Map<string, DiscoveredShow>();
    all.forEach((s) => map.set(s.id, s));
    showsToUpsert.forEach((s) => map.set(s.id, s));
    this.saveShows(Array.from(map.values()));
  }

  // --- SEAT SNAPSHOTS ---
  getSeatSnapshots(showId: string): SeatSnapshot[] | undefined {
    const raw = localStorage.getItem(`${SEATS_KEY}_${showId}`);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  saveSeatSnapshots(showId: string, seats: SeatSnapshot[]): void {
    localStorage.setItem(`${SEATS_KEY}_${showId}`, JSON.stringify(seats));
  }

  // --- NOTIFICATIONS ---
  getNotifications(): NotificationEvent[] {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      const seeded = getInitialSeedNotifications();
      this.saveNotifications(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getInitialSeedNotifications();
    }
  }

  saveNotifications(notifications: NotificationEvent[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  addNotification(notif: NotificationEvent): void {
    const all = this.getNotifications();
    all.unshift(notif);
    this.saveNotifications(all);
  }

  markNotificationRead(id: string): void {
    const all = this.getNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(all);
  }

  markAllNotificationsRead(): void {
    const all = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(all);
  }

  clearNotifications(): void {
    this.saveNotifications([]);
  }

  // --- MONITORING LOGS ---
  getLogs(): MonitoringLog[] {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      const seeded = getInitialSeedLogs();
      this.saveLogs(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getInitialSeedLogs();
    }
  }

  saveLogs(logs: MonitoringLog[]): void {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100))); // keep latest 100
  }

  addLog(log: MonitoringLog): void {
    const logs = this.getLogs();
    logs.unshift(log);
    this.saveLogs(logs);
  }

  clearLogs(): void {
    this.saveLogs([]);
  }

  // --- SETTINGS ---
  getSettings(): UserSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // --- STATS ---
  getStats(): AppStats {
    const trackers = this.getTrackers();
    const active = trackers.filter((t) => t.isActive);
    const shows = this.getShows();
    const notifs = this.getNotifications();
    const logs = this.getLogs();

    const lastLog = logs[0];
    const settings = this.getSettings();

    const newShowsCount = shows.filter((s) => s.isNewRelease).length +
      notifs.filter((n) => n.eventType === 'new_show').length;

    const newSeatsCount = notifs.filter((n) => n.eventType === 'seats_released').length;

    return {
      activeTrackers: active.length,
      newShowsDiscovered: newShowsCount,
      newSeatAlerts: newSeatsCount,
      lastSuccessfulCheck: lastLog ? lastLog.timestamp : Date.now() - 300000,
      nextScheduledCheck: settings.globalMonitoringEnabled
        ? Date.now() + (settings.defaultIntervalMinutes || 15) * 60 * 1000
        : undefined,
      isMonitoringActive: settings.globalMonitoringEnabled && active.length > 0,
      isNetworkConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }

  // --- EXPORT / IMPORT ---
  exportAllData(): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        trackers: this.getTrackers(),
        shows: this.getShows(),
        notifications: this.getNotifications(),
        settings: this.getSettings(),
      },
      null,
      2
    );
  }

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.trackers)) {
        this.saveTrackers(data.trackers);
      }
      if (Array.isArray(data.shows)) {
        this.saveShows(data.shows);
      }
      if (Array.isArray(data.notifications)) {
        this.saveNotifications(data.notifications);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return true;
    } catch {
      return false;
    }
  }

  resetAllData(): void {
    this.saveTrackers(getInitialSeedTrackers());
    this.saveShows(getInitialSeedShows());
    this.saveNotifications(getInitialSeedNotifications());
    this.saveLogs(getInitialSeedLogs());
    this.saveSettings(DEFAULT_SETTINGS);
  }
}

export const db = new LocalDatabase();
