import type { ReadonlyURLSearchParams } from 'next/navigation';
import { PlacesQuery } from './types';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const arrayKeys = {
  outlets: ['scarce', 'some', 'many'] as const,
  noise: ['quiet', 'moderate', 'loud', 'varies'] as const,
  seating: ['bar', 'tables', 'sofas', 'outdoor'] as const,
  price: ['$', '$$', '$$$'] as const,
  bathroom: ['yes', 'customers'] as const,
  parking: ['street', 'lot', 'garage'] as const
};

type ArrayKey = keyof typeof arrayKeys;

const booleanTrueValues = new Set(['1', 'true', 'on']);

export function parseBoolean(value?: string | null): boolean | undefined {
  if (value == null) return undefined;
  if (booleanTrueValues.has(value.toLowerCase())) return true;
  if (value.toLowerCase() === '0' || value.toLowerCase() === 'false') return false;
  return undefined;
}

function parseNumber(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseArrayValue<T extends string>(value?: string | null): T[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is T => item.length > 0);
}

export function parsePlacesQuery(params: URLSearchParams | ReadonlyURLSearchParams | Readonly<Record<string, string | string[] | undefined>>): PlacesQuery {
  const getValue = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    if (typeof (params as any).get === 'function') {
      return (params as any).get(key) ?? undefined;
    }
    const raw = params[key];
    if (Array.isArray(raw)) {
      return raw[0];
    }
    return raw;
  };

  const query: PlacesQuery = {};

  const q = getValue('q');
  if (q) query.q = q;

  const wifiMin = parseNumber(getValue('wifiMin'));
  if (wifiMin && [1, 2, 3, 4, 5].includes(wifiMin)) {
    query.wifiMin = wifiMin as PlacesQuery['wifiMin'];
  }

  const wifiFree = parseBoolean(getValue('wifiFree'));
  if (wifiFree !== undefined) query.wifiFree = wifiFree;

  (Object.keys(arrayKeys) as ArrayKey[]).forEach((key) => {
    const arr = parseArrayValue<string>(getValue(key));
    if (arr && arr.length > 0) {
      query[key] = arr as any;
    }
  });

  const noiseParam = parseArrayValue<string>(getValue('noise'));
  if (noiseParam && noiseParam.length > 0) {
    query.noise = noiseParam as PlacesQuery['noise'];
  }

  const openNow = parseBoolean(getValue('openNow'));
  if (openNow !== undefined) query.openNow = openNow;

  const hoursAt = getValue('hoursAt');
  if (hoursAt) query.hoursAt = hoursAt;

  const tags = parseArrayValue<string>(getValue('tags'));
  if (tags && tags.length > 0) query.tags = tags;

  const maxDistanceKm = parseNumber(getValue('maxDistanceKm'));
  if (maxDistanceKm !== undefined) query.maxDistanceKm = maxDistanceKm;

  const lat = parseNumber(getValue('lat'));
  if (lat !== undefined) query.lat = lat;

  const lon = parseNumber(getValue('lon'));
  if (lon !== undefined) query.lon = lon;

  const sort = getValue('sort');
  if (sort && ['best', 'distance', 'wifi', 'freshness'].includes(sort)) {
    query.sort = sort as PlacesQuery['sort'];
  }

  const page = parseNumber(getValue('page'));
  if (page && page >= 1) query.page = Math.floor(page);

  const pageSize = parseNumber(getValue('pageSize'));
  if (pageSize && pageSize >= 1) {
    query.pageSize = Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
  }

  const accessibilityStepFree = parseBoolean(getValue('accessibilityStepFree'));
  const accessibilityDoor = parseNumber(getValue('accessibilityMinDoorWidthIn'));
  if (accessibilityStepFree !== undefined || accessibilityDoor !== undefined) {
    query.accessibility = {};
    if (accessibilityStepFree !== undefined) query.accessibility.stepFree = accessibilityStepFree;
    if (accessibilityDoor !== undefined) query.accessibility.minDoorWidthIn = accessibilityDoor;
  }

  return query;
}

function ensureArray<T extends string>(values?: T[]): T[] | undefined {
  return values && values.length > 0 ? values : undefined;
}

export function serializePlacesQuery(query: PlacesQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.wifiMin) params.set('wifiMin', String(query.wifiMin));
  if (query.wifiFree !== undefined) params.set('wifiFree', query.wifiFree ? '1' : '0');
  const handleArray = (key: ArrayKey, values?: string[]) => {
    const arr = ensureArray(values as string[] | undefined);
    if (arr) params.set(key, arr.join(','));
  };
  (Object.keys(arrayKeys) as ArrayKey[]).forEach((key) => {
    handleArray(key, query[key] as string[] | undefined);
  });
  if (query.noise && query.noise.length > 0) params.set('noise', query.noise.join(','));
  if (query.seating && query.seating.length > 0) params.set('seating', query.seating.join(','));
  if (query.openNow !== undefined) params.set('openNow', query.openNow ? '1' : '0');
  if (query.hoursAt) params.set('hoursAt', query.hoursAt);
  if (query.tags && query.tags.length > 0) params.set('tags', query.tags.join(','));
  if (query.maxDistanceKm !== undefined) params.set('maxDistanceKm', String(query.maxDistanceKm));
  if (query.lat !== undefined) params.set('lat', String(query.lat));
  if (query.lon !== undefined) params.set('lon', String(query.lon));
  if (query.sort) params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.pageSize && query.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(query.pageSize));
  if (query.accessibility) {
    if (query.accessibility.stepFree !== undefined) {
      params.set('accessibilityStepFree', query.accessibility.stepFree ? '1' : '0');
    }
    if (query.accessibility.minDoorWidthIn !== undefined) {
      params.set('accessibilityMinDoorWidthIn', String(query.accessibility.minDoorWidthIn));
    }
  }
  return params;
}

export function mergeQuery(base: PlacesQuery, patch: Partial<PlacesQuery>): PlacesQuery {
  const merged: PlacesQuery = { ...base, ...patch };
  if (patch.accessibility !== undefined) {
    merged.accessibility = patch.accessibility;
  }
  return merged;
}

export function sanitizeQuery(query: PlacesQuery): PlacesQuery {
  const cleaned: PlacesQuery = { ...query };
  if (cleaned.page && cleaned.page < 1) cleaned.page = 1;
  if (cleaned.pageSize && cleaned.pageSize > MAX_PAGE_SIZE) cleaned.pageSize = MAX_PAGE_SIZE;
  return cleaned;
}
