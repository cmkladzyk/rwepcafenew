import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, parsePlacesQuery, serializePlacesQuery } from '@/lib/filters';
import type { PlacesQuery } from '@/lib/types';

describe('filters helpers', () => {
  it('parses query strings with arrays and booleans', () => {
    const params = new URLSearchParams({
      q: 'mesa',
      wifiMin: '4',
      wifiFree: '1',
      noise: 'quiet,moderate',
      outlets: 'many',
      openNow: '1',
      lat: '31.76',
      lon: '-106.49',
      maxDistanceKm: '5',
      accessibilityStepFree: '1',
      accessibilityMinDoorWidthIn: '36',
      tags: 'remote-friendly,good-lighting'
    });
    const query = parsePlacesQuery(params);
    expect(query.wifiMin).toBe(4);
    expect(query.wifiFree).toBe(true);
    expect(query.noise).toEqual(['quiet', 'moderate']);
    expect(query.outlets).toEqual(['many']);
    expect(query.openNow).toBe(true);
    expect(query.lat).toBeCloseTo(31.76);
    expect(query.lon).toBeCloseTo(-106.49);
    expect(query.accessibility?.stepFree).toBe(true);
    expect(query.accessibility?.minDoorWidthIn).toBe(36);
    expect(query.tags).toEqual(['remote-friendly', 'good-lighting']);
  });

  it('serializes query omitting defaults', () => {
    const query: PlacesQuery = {
      q: 'downtown',
      sort: 'best',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      wifiFree: true,
      tags: ['remote-friendly']
    };
    const params = serializePlacesQuery(query);
    expect(params.get('q')).toBe('downtown');
    expect(params.get('wifiFree')).toBe('1');
    expect(params.get('tags')).toBe('remote-friendly');
    expect(params.has('page')).toBe(false);
    expect(params.has('pageSize')).toBe(false);
  });
});
