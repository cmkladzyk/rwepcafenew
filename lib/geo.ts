import { Place } from './types';

const EARTH_RADIUS_KM = 6371;

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export function haversineDistanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return EARTH_RADIUS_KM * c;
}

export function isWithinBounds(place: Place, bounds: Bounds): boolean {
  return (
    place.lat <= bounds.north &&
    place.lat >= bounds.south &&
    place.lon <= bounds.east &&
    place.lon >= bounds.west
  );
}

export function clampBounds(bounds: Bounds): Bounds {
  return {
    north: Math.min(90, Math.max(-90, bounds.north)),
    south: Math.min(90, Math.max(-90, bounds.south)),
    east: Math.min(180, Math.max(-180, bounds.east)),
    west: Math.min(180, Math.max(-180, bounds.west))
  };
}
