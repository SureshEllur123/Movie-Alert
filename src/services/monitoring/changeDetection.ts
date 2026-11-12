import { DiscoveredShow, SeatSnapshot, SeatStatus } from '../../types/index.ts';

/**
 * Creates a stable, normalized identifier for a show across monitoring runs.
 */
export function getShowKey(show: {
  movieName: string;
  theatreName: string;
  date: string;
  time24: string;
  language: string;
  platform: string;
}): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

  return `${norm(show.movieName)}|${norm(show.theatreName)}|${show.date}|${show.time24}|${norm(show.language)}|${norm(show.platform)}`;
}

export interface ShowDiffResult {
  newShows: DiscoveredShow[];
  existingShows: DiscoveredShow[];
  hasNewDates: boolean;
  newDatesFound: string[];
}

/**
 * Compares freshly discovered shows against the existing shows in storage.
 */
export function detectNewShows(
  freshShows: DiscoveredShow[],
  existingShows: DiscoveredShow[]
): ShowDiffResult {
  const existingKeySet = new Set(existingShows.map((s) => getShowKey(s)));
  const existingDatesSet = new Set(existingShows.map((s) => s.date));

  const newShows: DiscoveredShow[] = [];
  const updatedExisting: DiscoveredShow[] = [];
  const newDatesSet = new Set<string>();

  for (const show of freshShows) {
    const key = getShowKey(show);
    if (!existingKeySet.has(key)) {
      newShows.push({
        ...show,
        isNewRelease: true,
      });
      if (!existingDatesSet.has(show.date)) {
        newDatesSet.add(show.date);
      }
    } else {
      updatedExisting.push(show);
    }
  }

  return {
    newShows,
    existingShows: updatedExisting,
    hasNewDates: newDatesSet.size > 0,
    newDatesFound: Array.from(newDatesSet),
  };
}

export interface SeatDiffResult {
  showId: string;
  hasNewlyAvailableSeats: boolean;
  newlyAvailableSeats: SeatSnapshot[];
  availableCountBefore: number;
  availableCountNow: number;
  totalSeats: number;
  seatDelta: number;
}

/**
 * Checks if a status transition represents a seat genuinely becoming bookable.
 * Only transitions FROM Unavailable, Booked, or TemporarilyBlocked TO Available qualify.
 */
export function isSeatTransitionToBookable(previousStatus: SeatStatus, newStatus: SeatStatus): boolean {
  if (newStatus !== 'Available') return false;
  return previousStatus === 'Unavailable' || previousStatus === 'Booked' || previousStatus === 'TemporarilyBlocked';
}

/**
 * Compares two snapshots of seat availability for the same show.
 * Emits newly bookable seats when previously unavailable seats open up.
 */
export function detectSeatAvailabilityChanges(
  previousSeats: SeatSnapshot[] | undefined,
  currentSeats: SeatSnapshot[]
): SeatDiffResult {
  const totalSeats = currentSeats.length;
  const currentlyAvailable = currentSeats.filter((s) => s.status === 'Available');
  const availableCountNow = currentlyAvailable.length;

  if (!previousSeats || previousSeats.length === 0) {
    return {
      showId: '',
      hasNewlyAvailableSeats: false,
      newlyAvailableSeats: [],
      availableCountBefore: 0,
      availableCountNow,
      totalSeats,
      seatDelta: 0,
    };
  }

  const prevMap = new Map<string, SeatSnapshot>();
  for (const seat of previousSeats) {
    const key = seat.seatId || `${seat.row}${seat.number}`;
    prevMap.set(key, seat);
  }

  const availableCountBefore = previousSeats.filter((s) => s.status === 'Available').length;
  const newlyAvailableSeats: SeatSnapshot[] = [];

  for (const seat of currentSeats) {
    const key = seat.seatId || `${seat.row}${seat.number}`;
    const prev = prevMap.get(key);

    if (prev && isSeatTransitionToBookable(prev.status, seat.status)) {
      newlyAvailableSeats.push(seat);
    }
  }

  return {
    showId: '',
    hasNewlyAvailableSeats: newlyAvailableSeats.length > 0,
    newlyAvailableSeats,
    availableCountBefore,
    availableCountNow,
    totalSeats,
    seatDelta: availableCountNow - availableCountBefore,
  };
}

/**
 * Generates an event deduplication hash so identical notifications are never repeated.
 */
export function getNotificationDedupKey(
  eventType: string,
  trackerId: string,
  showKey: string,
  extraKey?: string
): string {
  return `${eventType}:${trackerId}:${showKey}:${extraKey || ''}`;
}
