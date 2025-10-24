import type { Place } from './types';

const GOOGLE_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type GooglePlacesResponse = {
  status?: string;
  results?: GooglePlace[];
  error_message?: string;
};

type GooglePlace = {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  types?: string[];
};

export type FetchGooglePlacesOptions = {
  textQuery?: string;
  location?: { lat: number; lon: number };
  radiusMeters?: number;
  fetchFn?: FetchLike;
};

function mapPriceLevel(priceLevel?: number): Place['coffeePrice'] | undefined {
  if (priceLevel === undefined || priceLevel === null) {
    return undefined;
  }
  if (priceLevel <= 1) return '$';
  if (priceLevel === 2) return '$$';
  if (priceLevel >= 3) return '$$$';
  return 'unknown';
}

export function transformGooglePlace(place: GooglePlace, fetchedAt = new Date()): Place | null {
  const lat = place.geometry?.location?.lat;
  const lon = place.geometry?.location?.lng;
  if (lat === undefined || lon === undefined) {
    return null;
  }

  const tags = place.types?.filter(Boolean) ?? [];

  return {
    id: place.place_id,
    name: place.name,
    lat,
    lon,
    address: place.formatted_address,
    tags,
    coffeePrice: mapPriceLevel(place.price_level),
    lastVerifiedAt: fetchedAt.toISOString(),
    source: 'google',
    score: undefined
  };
}

export async function fetchGooglePlacesCafes(
  apiKey: string,
  options: FetchGooglePlacesOptions = {}
): Promise<Place[]> {
  if (!apiKey) {
    throw new Error('Google Places API key is required');
  }

  const fetchImpl: FetchLike | undefined = options.fetchFn ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) {
    throw new Error('Fetch implementation is required to call Google Places API');
  }

  const params = new URLSearchParams({
    query: options.textQuery ?? 'remote friendly cafes in El Paso',
    key: apiKey
  });

  if (options.location) {
    params.set('location', `${options.location.lat},${options.location.lon}`);
  }

  if (options.radiusMeters) {
    params.set('radius', String(options.radiusMeters));
  }

  const url = `${GOOGLE_TEXT_SEARCH_URL}?${params.toString()}`;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Google Places API request failed: ${response.status}`);
  }

  const data = (await response.json()) as GooglePlacesResponse;
  const status = data.status ?? 'OK';
  if (status !== 'OK' && status !== 'ZERO_RESULTS') {
    const message = data.error_message ? ` - ${data.error_message}` : '';
    throw new Error(`Google Places API error: ${status}${message}`);
  }

  const fetchedAt = new Date();
  const places = (data.results ?? [])
    .map((result) => transformGooglePlace(result, fetchedAt))
    .filter((place): place is Place => Boolean(place));

  const deduped = new Map<string, Place>();
  for (const place of places) {
    deduped.set(place.id, place);
  }
  return Array.from(deduped.values());
}
