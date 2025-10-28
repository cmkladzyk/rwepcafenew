import { describe, expect, it } from 'vitest';
import { computeScore } from '@/lib/score';
import type { Place } from '@/lib/types';

const basePlace: Place = {
  id: 'test',
  name: 'Test Café',
  lat: 0,
  lon: 0,
  hours: {
    monday: [{ open: '07:00', close: '19:00' }],
    tuesday: [{ open: '07:00', close: '19:00' }],
    wednesday: [{ open: '07:00', close: '19:00' }],
    thursday: [{ open: '07:00', close: '19:00' }],
    friday: [{ open: '07:00', close: '19:00' }]
  },
  wifi: { rating: 5, free: true, lastTestMbpsDown: 100 },
  outlets: 'many',
  noise: 'quiet',
  lastVerifiedAt: '2024-02-20T15:00:00-07:00'
};

describe('computeScore', () => {
  it('awards a high score for excellent amenities', () => {
    const score = computeScore({ ...basePlace }, new Date('2024-03-01T12:00:00-07:00'));
    expect(score).toBeGreaterThan(85);
  });

  it('penalizes missing wifi rating and closed status', () => {
    const place: Place = {
      ...basePlace,
      wifi: undefined,
      outlets: 'scarce',
      noise: 'loud'
    };
    const score = computeScore(place, new Date('2024-03-01T23:00:00-07:00'));
    expect(score).toBeLessThan(60);
  });

  it('decays freshness after 180 days', () => {
    const place: Place = {
      ...basePlace,
      lastVerifiedAt: '2023-06-01T12:00:00-07:00'
    };
    const recent = computeScore({ ...place }, new Date('2023-06-05T12:00:00-07:00'));
    const stale = computeScore({ ...place }, new Date('2023-12-01T12:00:00-07:00'));
    expect(recent).toBeGreaterThan(stale);
  });
});
