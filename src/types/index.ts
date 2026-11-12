export type BookingPlatform = 'BookMyShow' | 'District';

export type SeatStatus = 'Available' | 'Booked' | 'Unavailable' | 'TemporarilyBlocked' | 'Unknown';

export interface SeatSnapshot {
  seatId: string;
  row: string;
  number: number;
  status: SeatStatus;
  priceTier?: string;
  price?: number;
}

export type ShowFormat = '2D' | '3D' | 'IMAX 2D' | 'IMAX 3D' | '4DX' | 'Dolby Cinema' | 'ICE' | 'ScreenX';

export type ShowAvailabilityStatus = 'Available' | 'FillingFast' | 'AlmostFull' | 'SoldOut' | 'SeatsReleased' | 'Unknown';

export interface DiscoveredShow {
  id: string;
  trackerId: string;
  movieName: string;
  theatreName: string;
  theatreChain?: string;
  city: string;
  date: string; // YYYY-MM-DD
  time: string; // "11:00 AM"
  time24: string; // "11:00"
  language: string;
  format: ShowFormat | string;
  platform: BookingPlatform;
  bookingUrl: string;
  availability: ShowAvailabilityStatus;
  availableSeatsCount?: number;
  totalSeatsCount?: number;
  lastChecked: number;
  isNewRelease?: boolean;
  seats?: SeatSnapshot[];
}

export type TimeFilterType = 'any' | 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';

export interface TimeFilter {
  type: TimeFilterType;
  customStart?: string; // HH:mm
  customEnd?: string;   // HH:mm
}

export interface AlertPreferences {
  newShowReleased: boolean;
  seatsBecomeBookable: boolean;
  newDatesAvailable: boolean;
  crossPlatformShow: boolean;
}

export interface Tracker {
  id: string;
  movieName: string;
  movieIdentifier?: string;
  posterUrl?: string;
  directUrl?: string;
  selectedDates: string[]; // YYYY-MM-DD
  timeFilter: TimeFilter;
  language: string; // 'any' or specific
  city: string;
  theatres: string[]; // empty = all in city
  theatreChains?: string[];
  platforms: BookingPlatform[];
  alertPreferences: AlertPreferences;
  monitoringIntervalMinutes: 15 | 30 | 60 | 0; // 0 = continuous foreground
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastCheckedAt?: number;
  discoveredShowsCount: number;
  newSeatsAlertsCount: number;
}

export type NotificationEventType = 'new_show' | 'seats_released' | 'new_date' | 'cross_platform' | 'error';

export interface NotificationEvent {
  id: string;
  trackerId: string;
  movieName: string;
  theatreName: string;
  date: string;
  time: string;
  platform: BookingPlatform;
  eventType: NotificationEventType;
  title: string;
  message: string;
  details?: string;
  bookingUrl?: string;
  createdAt: number;
  isRead: boolean;
  newlyAvailableSeats?: string[];
}

export interface MonitoringLog {
  id: string;
  timestamp: number;
  trackerId?: string;
  movieName?: string;
  platform: BookingPlatform | 'All';
  status: 'success' | 'warning' | 'error';
  showsFound: number;
  newSeatsFound: number;
  message: string;
}

export interface MovieSearchResult {
  id: string;
  title: string;
  languages: string[];
  formats: string[];
  posterUrl: string;
  releaseDate?: string;
  isUpcoming?: boolean;
}

export interface TheatreSearchResult {
  id: string;
  name: string;
  chain?: string;
  city: string;
  area?: string;
  platforms: BookingPlatform[];
}

export interface AppStats {
  activeTrackers: number;
  newShowsDiscovered: number;
  newSeatAlerts: number;
  lastSuccessfulCheck?: number;
  nextScheduledCheck?: number;
  isMonitoringActive: boolean;
  isNetworkConnected: boolean;
}

export interface AndroidBackgroundStatus {
  isWorkManagerScheduled: boolean;
  workIntervalMinutes: number;
  isForegroundServiceActive: boolean;
  batteryOptimizationIgnored: boolean;
  bootReceiverRegistered: boolean;
  notificationsPermissionGranted: boolean;
  lastWorkerRunTime?: number;
}
