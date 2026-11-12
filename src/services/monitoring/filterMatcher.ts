import { DiscoveredShow, TimeFilter, BookingPlatform } from '../../types/index.ts';

/**
 * Checks whether a 24-hour time string ("HH:mm") falls within a given start and end range.
 * Correctly handles midnight wrapping (e.g. 23:00 to 03:00).
 */
export function isTimeInRange(timeStr: string, startStr: string, endStr: string): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);

  const t = h * 60 + m;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (start <= end) {
    return t >= start && t <= end;
  } else {
    // Crosses midnight (e.g. 22:00 to 04:00)
    return t >= start || t <= end;
  }
}

/**
 * Checks if a show matches the user's configured time filter.
 */
export function matchesTime(time24: string, timeFilter: TimeFilter): boolean {
  if (!timeFilter || timeFilter.type === 'any') {
    return true;
  }

  switch (timeFilter.type) {
    case 'morning':
      return isTimeInRange(time24, '06:00', '11:59');
    case 'afternoon':
      return isTimeInRange(time24, '12:00', '15:59');
    case 'evening':
      return isTimeInRange(time24, '16:00', '19:59');
    case 'night':
      // Night spans 20:00 to 05:59 (crosses midnight)
      return isTimeInRange(time24, '20:00', '05:59');
    case 'custom':
      if (timeFilter.customStart && timeFilter.customEnd) {
        return isTimeInRange(time24, timeFilter.customStart, timeFilter.customEnd);
      }
      return true;
    default:
      return true;
  }
}

/**
 * Checks if a show matches language criteria.
 */
export function matchesLanguage(showLanguage: string, trackerLanguage: string): boolean {
  if (!trackerLanguage || trackerLanguage.toLowerCase() === 'any') {
    return true;
  }
  return showLanguage.toLowerCase().trim() === trackerLanguage.toLowerCase().trim();
}

/**
 * Checks if a theatre matches the user's selected theatres or chains.
 */
export function matchesTheatre(
  theatreName: string,
  theatreChain: string | undefined,
  selectedTheatres: string[],
  selectedChains?: string[]
): boolean {
  // If no specific theatres selected, monitor all theatres
  if ((!selectedTheatres || selectedTheatres.length === 0) && (!selectedChains || selectedChains.length === 0)) {
    return true;
  }

  const normTheatre = theatreName.toLowerCase();

  // Match selected individual theatres
  if (selectedTheatres && selectedTheatres.length > 0) {
    const matched = selectedTheatres.some((t) => {
      const normT = t.toLowerCase();
      return normTheatre.includes(normT) || normT.includes(normTheatre);
    });
    if (matched) return true;
  }

  // Match selected theatre chains (e.g. PVR, INOX, Cinepolis, Allu Cinemas, AMB)
  if (selectedChains && selectedChains.length > 0) {
    const normChain = (theatreChain || '').toLowerCase();
    const matchedChain = selectedChains.some((c) => {
      const nc = c.toLowerCase();
      return normTheatre.includes(nc) || normChain.includes(nc);
    });
    if (matchedChain) return true;
  }

  return false;
}

/**
 * Checks if a show matches selected booking platforms.
 */
export function matchesPlatform(showPlatform: BookingPlatform, platforms: BookingPlatform[]): boolean {
  if (!platforms || platforms.length === 0) return true;
  return platforms.includes(showPlatform);
}

/**
 * Checks if a show date matches any of the user's selected dates.
 */
export function matchesDates(showDate: string, selectedDates: string[]): boolean {
  if (!selectedDates || selectedDates.length === 0) return true;
  return selectedDates.includes(showDate);
}

/**
 * Evaluates whether a discovered show satisfies all tracker criteria.
 */
export function matchesTrackerFilters(
  show: DiscoveredShow,
  criteria: {
    selectedDates: string[];
    timeFilter: TimeFilter;
    language: string;
    theatres: string[];
    theatreChains?: string[];
    platforms: BookingPlatform[];
  }
): boolean {
  return (
    matchesDates(show.date, criteria.selectedDates) &&
    matchesTime(show.time24, criteria.timeFilter) &&
    matchesLanguage(show.language, criteria.language) &&
    matchesTheatre(show.theatreName, show.theatreChain, criteria.theatres, criteria.theatreChains) &&
    matchesPlatform(show.platform, criteria.platforms)
  );
}
