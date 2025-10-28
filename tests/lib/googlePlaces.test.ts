import { describe, expect, it, vi } from 'vitest';
import { fetchGooglePlacesCafes, transformGooglePlace } from '@/lib/googlePlaces';

const sampleResult = {
  place_id: 'abc123',
  name: 'Test Café',
  formatted_address: '123 Sample St, El Paso, TX',
  geometry: { location: { lat: 31.761, lng: -106.485 } },
  price_level: 2,
  types: ['cafe', 'food']
};

describe('transformGooglePlace', () => {
  it('converts Google Places response into Place shape', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const place = transformGooglePlace(sampleResult, now);
    expect(place).toEqual(
      expect.objectContaining({
        id: 'abc123',
        name: 'Test Café',
        lat: 31.761,
        lon: -106.485,
        address: '123 Sample St, El Paso, TX',
        coffeePrice: '$$',
        tags: ['cafe', 'food'],
        lastVerifiedAt: now.toISOString(),
        source: 'google'
      })
    );
  });

  it('returns null when coordinates are missing', () => {
    const result = transformGooglePlace({ ...sampleResult, geometry: { location: {} } }, new Date());
    expect(result).toBeNull();
  });
});

describe('fetchGooglePlacesCafes', () => {
  it('fetches and normalizes Google Places results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', results: [sampleResult] })
    });

    const places = await fetchGooglePlacesCafes('test-key', {
      fetchFn: fetchMock
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(places).toHaveLength(1);
    expect(places[0].id).toBe('abc123');
    expect(places[0].source).toBe('google');
  });

  it('throws when response is not OK', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      fetchGooglePlacesCafes('test-key', {
        fetchFn: fetchMock
      })
    ).rejects.toThrow(/request failed/);
  });

  it('throws on Google Places error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'REQUEST_DENIED', error_message: 'Bad key' })
    });

    await expect(
      fetchGooglePlacesCafes('test-key', {
        fetchFn: fetchMock
      })
    ).rejects.toThrow(/REQUEST_DENIED/);
  });
});
