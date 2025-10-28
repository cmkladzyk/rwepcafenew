'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LngLatBoundsLike } from 'maplibre-gl';
import styles from './page.module.css';
import { FilterBar } from '@/components/FilterBar';
import { Map } from '@/components/Map';
import { PlaceList } from '@/components/PlaceList';
import type { PlacesQuery, PlacesResponse, PlaceResult } from '@/lib/types';
import { DEFAULT_PAGE_SIZE, parsePlacesQuery, sanitizeQuery, serializePlacesQuery } from '@/lib/filters';

const DEBOUNCE_MS = 300;

type LocationStatus = 'idle' | 'loading' | 'granted' | 'error';

export default function PlacesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [draftQuery, setDraftQuery] = useState<PlacesQuery>({});
  const [data, setData] = useState<PlacesResponse>({ items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const currentQuery = useMemo(() => sanitizeQuery(parsePlacesQuery(searchParams)), [searchParams]);

  useEffect(() => {
    setDraftQuery(currentQuery);
    if (currentQuery.lat !== undefined && currentQuery.lon !== undefined) {
      setUserLocation({ lat: currentQuery.lat, lon: currentQuery.lon });
      setLocationStatus('granted');
    } else if (locationStatus !== 'loading') {
      setUserLocation(null);
      setLocationStatus('idle');
    }
  }, [currentQuery, locationStatus]);

  useEffect(() => {
    const controller = new AbortController();
    const queryString = searchParams.toString();
    setIsLoading(true);
    setError(null);
    const url = queryString ? `/api/places?${queryString}` : '/api/places';
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load places');
        }
        return response.json();
      })
      .then((payload: PlacesResponse) => {
        setData(payload);
        setIsLoading(false);
        setSelectedId((prev) => {
          if (prev && payload.items.some((place) => place.id === prev)) {
            return prev;
          }
          return payload.items[0]?.id ?? null;
        });
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      const sanitized = sanitizeQuery({ ...draftQuery });
      const params = serializePlacesQuery(sanitized);
      const next = params.toString();
      const current = searchParams.toString();
      if (next !== current) {
        router.replace(next ? `?${next}` : '?', { scroll: false });
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handler);
  }, [draftQuery, router, searchParams]);

  const updateQuery = useCallback((updater: (prev: PlacesQuery) => PlacesQuery) => {
    setDraftQuery((prev) => sanitizeQuery(updater({ ...prev })));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedId(null);
    setLocationStatus('idle');
    setLocationError(undefined);
    setUserLocation(null);
    setDraftQuery({ sort: 'best', page: 1 });
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      updateQuery((prev) => ({ ...prev, page: Math.max(1, page) }));
    },
    [updateQuery]
  );

  const handleRequestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation not supported in this browser.');
      return;
    }
    setLocationStatus('loading');
    setLocationError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        setLocationStatus('granted');
        updateQuery((prev) => ({
          ...prev,
          lat,
          lon,
          maxDistanceKm: prev.maxDistanceKm ?? 5,
          sort: prev.sort ?? 'distance',
          page: 1
        }));
      },
      (geoError) => {
        setLocationStatus('error');
        setLocationError(geoError.message);
      }
    );
  }, [updateQuery]);

  const handleClearLocation = useCallback(() => {
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError(undefined);
    updateQuery((prev) => {
      const next = { ...prev };
      delete next.lat;
      delete next.lon;
      delete next.maxDistanceKm;
      if (next.sort === 'distance') {
        next.sort = 'best';
      }
      next.page = 1;
      return next;
    });
  }, [updateQuery]);

  const handleMapBounds = useCallback(
    (bounds: LngLatBoundsLike) => {
      const boundsObj: any = bounds;
      const center = boundsObj?.getCenter ? boundsObj.getCenter() : null;
      if (!center) return;
      const lat = center.lat;
      const lon = center.lng;
      setUserLocation({ lat, lon });
      setLocationStatus('granted');
      updateQuery((prev) => ({
        ...prev,
        lat,
        lon,
        sort: 'distance',
        page: 1
      }));
    },
    [updateQuery]
  );

  const handleSelectPlace = useCallback((place: PlaceResult) => {
    setSelectedId(place.id);
  }, []);

  const handleSelectFromMap = useCallback((id: string) => {
    const place = data.items.find((item) => item.id === id);
    if (place) {
      setSelectedId(id);
    }
  }, [data.items]);

  return (
    <main className={styles.page}>
      <section className={styles.mapPane}>
        <Map
          places={data.items}
          selectedId={selectedId}
          onSelect={handleSelectFromMap}
          userLocation={userLocation}
          onUpdateFromView={handleMapBounds}
        />
      </section>
      <aside className={styles.sidebar}>
        <FilterBar
          query={draftQuery}
          onChange={updateQuery}
          onReset={handleReset}
          onRequestLocation={handleRequestLocation}
          onClearLocation={handleClearLocation}
          locationStatus={locationStatus}
          locationError={locationError}
        />
        <PlaceList
          places={data.items}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          isLoading={isLoading}
          error={error}
          onSelect={handleSelectPlace}
          selectedId={selectedId}
          onPageChange={handlePageChange}
        />
      </aside>
    </main>
  );
}
