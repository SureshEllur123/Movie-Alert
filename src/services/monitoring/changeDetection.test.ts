import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getShowKey,
  detectNewShows,
  detectSeatAvailabilityChanges,
  isSeatTransitionToBookable,
} from './changeDetection.ts';
import { DiscoveredShow, SeatSnapshot } from '../../types/index.ts';

test('getShowKey produces consistent normalized keys', () => {
  const k1 = getShowKey({
    movieName: 'Ramayana (Part 1)',
    theatreName: 'Allu Cinemas: Gandipet',
    date: '2026-11-14',
    time24: '11:00',
    language: 'Hindi',
    platform: 'BookMyShow',
  });
  const k2 = getShowKey({
    movieName: 'ramayana part 1',
    theatreName: 'Allu Cinemas Gandipet',
    date: '2026-11-14',
    time24: '11:00',
    language: 'HINDI',
    platform: 'bookmyshow',
  });

  assert.equal(k1, k2);
});

test('detectNewShows identifies genuinely new shows and new dates', () => {
  const existingShow: DiscoveredShow = {
    id: 's1',
    trackerId: 't1',
    movieName: 'Ramayana',
    theatreName: 'Allu Cinemas',
    city: 'Hyderabad',
    date: '2026-11-14',
    time: '11:00 AM',
    time24: '11:00',
    language: 'Hindi',
    format: '3D',
    platform: 'BookMyShow',
    bookingUrl: 'https://in.bookmyshow.com',
    availability: 'Available',
    lastChecked: 1000,
  };

  const freshShow1: DiscoveredShow = {
    ...existingShow,
    lastChecked: 2000,
  };

  const freshShow2: DiscoveredShow = {
    id: 's2',
    trackerId: 't1',
    movieName: 'Ramayana',
    theatreName: 'Allu Cinemas',
    city: 'Hyderabad',
    date: '2026-11-15', // Brand new date!
    time: '03:00 PM',
    time24: '15:00',
    language: 'Hindi',
    format: 'Dolby Cinema',
    platform: 'District',
    bookingUrl: 'https://district.in',
    availability: 'Available',
    lastChecked: 2000,
  };

  const diff = detectNewShows([freshShow1, freshShow2], [existingShow]);
  assert.equal(diff.newShows.length, 1);
  assert.equal(diff.newShows[0].id, 's2');
  assert.equal(diff.hasNewDates, true);
  assert.deepEqual(diff.newDatesFound, ['2026-11-15']);
});

test('isSeatTransitionToBookable only triggers for genuine openings', () => {
  assert.equal(isSeatTransitionToBookable('Unavailable', 'Available'), true);
  assert.equal(isSeatTransitionToBookable('Booked', 'Available'), true);
  assert.equal(isSeatTransitionToBookable('TemporarilyBlocked', 'Available'), true);

  // Still unavailable or booked
  assert.equal(isSeatTransitionToBookable('Unavailable', 'Booked'), false);
  assert.equal(isSeatTransitionToBookable('Available', 'Available'), false);
  assert.equal(isSeatTransitionToBookable('Available', 'Booked'), false);
});

test('detectSeatAvailabilityChanges alerts on newly released seats', () => {
  const prevSeats: SeatSnapshot[] = [
    { seatId: 'A1', row: 'A', number: 1, status: 'Available' },
    { seatId: 'A2', row: 'A', number: 2, status: 'Available' },
    { seatId: 'A3', row: 'A', number: 3, status: 'Unavailable' },
    { seatId: 'A4', row: 'A', number: 4, status: 'Booked' },
  ];

  const currentSeats: SeatSnapshot[] = [
    { seatId: 'A1', row: 'A', number: 1, status: 'Available' },
    { seatId: 'A2', row: 'A', number: 2, status: 'Available' },
    { seatId: 'A3', row: 'A', number: 3, status: 'Available' }, // Newly opened!
    { seatId: 'A4', row: 'A', number: 4, status: 'Available' }, // Newly opened!
  ];

  const result = detectSeatAvailabilityChanges(prevSeats, currentSeats);
  assert.equal(result.hasNewlyAvailableSeats, true);
  assert.equal(result.newlyAvailableSeats.length, 2);
  assert.equal(result.newlyAvailableSeats[0].seatId, 'A3');
  assert.equal(result.newlyAvailableSeats[1].seatId, 'A4');
  assert.equal(result.availableCountBefore, 2);
  assert.equal(result.availableCountNow, 4);
});
