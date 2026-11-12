import { CinemaProvider } from './CinemaProvider.ts';
import { BookMyShowProvider } from './BookMyShowProvider.ts';
import { DistrictProvider } from './DistrictProvider.ts';
import { BookingPlatform } from '../../types/index.ts';

const bms = new BookMyShowProvider();
const district = new DistrictProvider();

export const providers: Record<BookingPlatform, CinemaProvider> = {
  BookMyShow: bms,
  District: district,
};

export function getProvider(platform: BookingPlatform): CinemaProvider {
  return providers[platform] || bms;
}

export function getAllProviders(): CinemaProvider[] {
  return [bms, district];
}
