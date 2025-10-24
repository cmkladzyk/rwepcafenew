import placesData from '../seed/places.json';
import { fetchGooglePlacesCafes } from './googlePlaces';
import { Place } from './types';

let cache: Place[] | null = null;
let googleCache: Promise<Place[]> | null = null;

function loadSeed(): Place[] {
  if (cache) return cache;
  cache = (placesData as Place[]).map((place) => ({
    ...place,
    source: place.source ?? 'seed'
  }));
  return cache;
}

export async function listPlaces(): Promise<Place[]> {
  const seedPlaces = loadSeed();
  const googlePlaces = await loadGooglePlaces();

  if (googlePlaces.length === 0) {
    return seedPlaces;
  }

  const combined = new Map<string, Place>();
  for (const place of [...seedPlaces, ...googlePlaces]) {
    combined.set(place.id, place);
  }
  return Array.from(combined.values());
}

export async function isEmpty(): Promise<boolean> {
  const data = await listPlaces();
  return data.length === 0;
}

export async function addPlace(place: Place): Promise<void> {
  const data = loadSeed();
  data.push(place);
}

async function loadGooglePlaces(): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return [];
  }

  if (!googleCache) {
    googleCache = fetchGooglePlacesCafes(apiKey).catch((error) => {
      console.error('Failed to fetch Google Places data', error);
      return [];
    });
  }

  return googleCache;
}
