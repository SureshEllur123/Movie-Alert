import {
  BookingPlatform,
  DiscoveredShow,
  MovieSearchResult,
  TheatreSearchResult,
  SeatSnapshot,
  Tracker,
} from '../../types/index.ts';

export interface CinemaProvider {
  readonly platform: BookingPlatform;
  readonly displayName: string;
  readonly websiteUrl: string;

  /**
   * Searches for movies currently running or upcoming in the given city.
   */
  searchMovies(query: string, city: string): Promise<MovieSearchResult[]>;

  /**
   * Searches for theatres in the given city.
   */
  searchTheatres(city: string, query?: string): Promise<TheatreSearchResult[]>;

  /**
   * Discovers matching shows for a user tracker.
   */
  discoverShows(tracker: Tracker): Promise<DiscoveredShow[]>;

  /**
   * Retrieves seat availability snapshot for a specific show.
   */
  getSeatAvailability(show: DiscoveredShow): Promise<SeatSnapshot[]>;

  /**
   * Generates direct booking link.
   */
  getBookingUrl(movieName: string, theatreName: string, city: string, date: string): string;

  /**
   * Checks provider operational health / connectivity.
   */
  checkHealth(): Promise<{ status: 'operational' | 'degraded' | 'rate_limited'; message: string }>;
}
