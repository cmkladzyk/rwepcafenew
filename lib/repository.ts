import placesData from '../seed/places.json';
import { Place } from './types';

let cache: Place[] | null = null;

function loadSeed(): Place[] {
  if (cache) return cache;
  cache = (placesData as Place[]).map((place) => ({
    ...place,
    source: place.source ?? 'seed'
  }));
  return cache;
}

export async function listPlaces(): Promise<Place[]> {
  return loadSeed();
}

export async function isEmpty(): Promise<boolean> {
  const data = await listPlaces();
  return data.length === 0;
}

export async function addPlace(place: Place): Promise<void> {
  const data = loadSeed();
  data.push(place);
}
