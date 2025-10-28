import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/places/route';
import type { PlacesResponse } from '@/lib/types';

async function fetchPlaces(query = ''): Promise<PlacesResponse> {
  const request = new Request(`http://localhost/api/places${query ? `?${query}` : ''}`);
  const response = await GET(request);
  const data = (await response.json()) as PlacesResponse;
  return data;
}

describe('GET /api/places', () => {
  it('returns paginated results', async () => {
    const data = await fetchPlaces();
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
    expect(data.page).toBe(1);
  });

  it('filters by wifi minimum and free wifi', async () => {
    const data = await fetchPlaces('wifiMin=5&wifiFree=1');
    expect(data.items.length).toBeGreaterThan(0);
    data.items.forEach((place) => {
      expect(place.wifi?.rating).toBeGreaterThanOrEqual(5);
      expect(place.wifi?.free).toBe(true);
    });
  });

  it('filters by open now at a specific time', async () => {
    const data = await fetchPlaces('openNow=1&hoursAt=2024-03-01T21:30:00-07:00');
    expect(data.items.length).toBeGreaterThan(0);
    const names = data.items.map((place) => place.name);
    expect(names).not.toContain('Global Coffee Roasters');
  });

  it('applies distance sorting and filtering', async () => {
    const data = await fetchPlaces('lat=31.759&lon=-106.491&maxDistanceKm=1&sort=distance');
    expect(data.items.length).toBeGreaterThan(0);
    data.items.forEach((place) => {
      expect(place.distanceKm).toBeLessThanOrEqual(1.01);
    });
    const distances = data.items.map((place) => place.distanceKm ?? 0);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });
});
