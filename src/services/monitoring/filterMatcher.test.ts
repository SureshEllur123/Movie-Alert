import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTimeInRange,
  matchesTime,
  matchesLanguage,
  matchesTheatre,
  matchesPlatform,
  matchesDates,
  matchesTrackerFilters,
} from './filterMatcher.ts';
import { DiscoveredShow } from '../../types/index.ts';

test('isTimeInRange handles normal daytime hours', () => {
  assert.equal(isTimeInRange('11:30', '10:00', '13:00'), true);
  assert.equal(isTimeInRange('09:59', '10:00', '13:00'), false);
  assert.equal(isTimeInRange('13:01', '10:00', '13:00'), false);
});

test('isTimeInRange correctly handles overnight ranges crossing midnight', () => {
  // Range from 22:00 to 04:00
  assert.equal(isTimeInRange('23:15', '22:00', '04:00'), true);
  assert.equal(isTimeInRange('01:30', '22:00', '04:00'), true);
  assert.equal(isTimeInRange('04:00', '22:00', '04:00'), true);
  assert.equal(isTimeInRange('15:00', '22:00', '04:00'), false);
  assert.equal(isTimeInRange('21:59', '22:00', '04:00'), false);
});

test('matchesTime handles presets: morning, afternoon, evening, night', () => {
  assert.equal(matchesTime('10:00', { type: 'morning' }), true);
  assert.equal(matchesTime('14:30', { type: 'morning' }), false);

  assert.equal(matchesTime('14:30', { type: 'afternoon' }), true);
  assert.equal(matchesTime('18:00', { type: 'afternoon' }), false);

  assert.equal(matchesTime('18:00', { type: 'evening' }), true);
  assert.equal(matchesTime('21:00', { type: 'evening' }), false);

  // Night preset crosses midnight
  assert.equal(matchesTime('22:45', { type: 'night' }), true);
  assert.equal(matchesTime('01:30', { type: 'night' }), true);
  assert.equal(matchesTime('07:00', { type: 'night' }), false);
});

test('matchesLanguage supports any and case-insensitive check', () => {
  assert.equal(matchesLanguage('Telugu', 'any'), true);
  assert.equal(matchesLanguage('Hindi', 'HINDI'), true);
  assert.equal(matchesLanguage('Tamil', 'Kannada'), false);
});

test('matchesTheatre matches chains and specific names without case sensitivity', () => {
  // Empty filters match any theatre
  assert.equal(matchesTheatre('PVR: Forum Mall, Koramangala', 'PVR', []), true);

  // Specific theatre match
  assert.equal(
    matchesTheatre('Allu Cinemas, Gandipet', 'Allu Cinemas', ['Allu Cinemas']),
    true
  );
  assert.equal(
    matchesTheatre('AMB Cinemas, Gachibowli', 'AMB Cinemas', ['Allu Cinemas']),
    false
  );

  // Chain filter match
  assert.equal(
    matchesTheatre('INOX: Nexus Mall', 'INOX', [], ['INOX', 'Cinepolis']),
    true
  );
});

test('matchesTrackerFilters verifies all criteria together', () => {
  const show: DiscoveredShow = {
    id: 's1',
    trackerId: 't1',
    movieName: 'Ramayana',
    theatreName: 'Allu Cinemas: Gandipet',
    theatreChain: 'Allu Cinemas',
    city: 'Hyderabad',
    date: '2026-11-14',
    time: '11:00 AM',
    time24: '11:00',
    language: 'Telugu',
    format: '3D',
    platform: 'BookMyShow',
    bookingUrl: 'https://in.bookmyshow.com/buytickets/ramayana-hyderabad/movie-hyd-ET0001',
    availability: 'Available',
    lastChecked: Date.now(),
  };

  const matches = matchesTrackerFilters(show, {
    selectedDates: ['2026-11-14', '2026-11-15'],
    timeFilter: { type: 'morning' },
    language: 'Telugu',
    theatres: ['Allu Cinemas'],
    platforms: ['BookMyShow', 'District'],
  });

  assert.equal(matches, true);
});
