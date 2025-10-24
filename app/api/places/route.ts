import { NextResponse } from 'next/server';
import { listPlaces } from '@/lib/repository';
import { DEFAULT_PAGE_SIZE, parsePlacesQuery, sanitizeQuery } from '@/lib/filters';
import { getHoursInfo } from '@/lib/hours';
import { haversineDistanceKm } from '@/lib/geo';
import { computeScore } from '@/lib/score';
import type { PlaceResult, PlacesResponse, Place } from '@/lib/types';

const TIMEZONE = 'America/Denver';

function textIncludes(value: string | undefined, term: string): boolean {
  return value ? value.toLowerCase().includes(term) : false;
}

function matchesArray<T extends string>(values: T[] | undefined, selected: T[] | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return selected.some((value) => values.includes(value));
}

function matchesSingle<T extends string>(value: T | undefined, selected: T[] | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  if (!value) return false;
  return selected.includes(value);
}

function isWithinAccessibility(place: Place, stepFree?: boolean, minDoorWidth?: number): boolean {
  if (stepFree === undefined && minDoorWidth === undefined) {
    return true;
  }
  if (!place.accessibility) return false;
  if (stepFree !== undefined && !!place.accessibility.stepFree !== stepFree) {
    return false;
  }
  if (minDoorWidth !== undefined) {
    const width = place.accessibility.doorWidthIn;
    if (width === undefined || width < minDoorWidth) {
      return false;
    }
  }
  return true;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = parsePlacesQuery(searchParams);
  const query = sanitizeQuery(rawQuery);
  const now = parseDate(query.hoursAt) ?? new Date();

  const places = await listPlaces();
  let results: PlaceResult[] = places.map((place) => ({ ...place }));

  const term = query.q?.toLowerCase();
  if (term) {
    results = results.filter((place) => {
      return (
        textIncludes(place.name, term) ||
        textIncludes(place.address, term) ||
        textIncludes(place.neighborhood, term) ||
        textIncludes(place.tags?.join(' '), term)
      );
    });
  }

  results = results.filter((place) => {
    if (query.wifiMin && (!place.wifi || place.wifi.rating < query.wifiMin)) {
      return false;
    }
    if (query.wifiFree !== undefined) {
      if (!place.wifi) return false;
      if (place.wifi.free !== query.wifiFree) return false;
    }
    if (!matchesSingle(place.outlets ?? undefined, query.outlets)) return false;
    if (!matchesSingle(place.noise ?? undefined, query.noise)) return false;
    if (!matchesArray(place.seating, query.seating)) return false;
    if (!matchesSingle(place.coffeePrice ?? undefined, query.price)) return false;
    if (!matchesSingle(place.bathroom ?? undefined, query.bathroom)) return false;
    if (!matchesArray(place.parking, query.parking)) return false;
    if (!isWithinAccessibility(place, query.accessibility?.stepFree, query.accessibility?.minDoorWidthIn)) return false;
    if (query.tags && query.tags.length > 0) {
      if (!place.tags || !query.tags.some((tag) => place.tags?.includes(tag))) {
        return false;
      }
    }
    return true;
  });

  let distanceOrigin: { lat: number; lon: number } | undefined;
  if (query.lat !== undefined && query.lon !== undefined) {
    distanceOrigin = { lat: query.lat, lon: query.lon };
  }

  results = results
    .map((place) => {
      const hours = getHoursInfo(place, now, TIMEZONE);
      const result: PlaceResult = {
        ...place,
        isOpen: hours.isOpen,
        closesAt: hours.closesAt ? hours.closesAt.toISOString() : null
      };
      if (distanceOrigin) {
        result.distanceKm = Number(haversineDistanceKm(distanceOrigin, { lat: place.lat, lon: place.lon }).toFixed(2));
      }
      computeScore(result, now);
      return result;
    })
    .filter((place) => {
      if (query.openNow && !place.isOpen) return false;
      if (distanceOrigin && query.maxDistanceKm !== undefined) {
        if (place.distanceKm === undefined || place.distanceKm > query.maxDistanceKm) {
          return false;
        }
      }
      return true;
    });

  const sort = query.sort ?? 'best';
  results.sort((a, b) => {
    switch (sort) {
      case 'distance':
        if (!distanceOrigin) return (b.score ?? 0) - (a.score ?? 0);
        return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      case 'wifi': {
        const ratingDiff = (b.wifi?.rating ?? 0) - (a.wifi?.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        const speedDiff = (b.wifi?.lastTestMbpsDown ?? 0) - (a.wifi?.lastTestMbpsDown ?? 0);
        if (speedDiff !== 0) return speedDiff;
        return (b.score ?? 0) - (a.score ?? 0);
      }
      case 'freshness': {
        const dateA = a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0;
        const dateB = b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.score ?? 0) - (a.score ?? 0);
      }
      case 'best':
      default:
        return (b.score ?? 0) - (a.score ?? 0);
    }
  });

  if (sort === 'distance' && !distanceOrigin) {
    results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = results.length;
  const start = (page - 1) * pageSize;
  const items = results.slice(start, start + pageSize);

  const response: PlacesResponse = {
    items,
    total,
    page,
    pageSize
  };

  return NextResponse.json(response);
}
