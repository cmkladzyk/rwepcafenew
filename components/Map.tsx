'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { LngLatBoundsLike, Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './Map.module.css';
import type { PlaceResult } from '@/lib/types';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const INITIAL_CENTER: [number, number] = [-106.485, 31.76];
const INITIAL_ZOOM = 12.2;

type MapProps = {
  places: PlaceResult[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lon: number } | null;
  onUpdateFromView: (bounds: LngLatBoundsLike) => void;
};

type MarkerEntry = {
  marker: Marker;
  popup: Popup;
};

export function Map({ places, selectedId, onSelect, userLocation, onUpdateFromView }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: true
    });
    mapRef.current = map;
    return () => {
      markersRef.current.forEach(({ marker, popup }) => {
        marker.remove();
        popup.remove();
      });
      markersRef.current.clear();
      userMarkerRef.current?.remove();
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;
    const nextIds = new Set(places.map((place) => place.id));

    markers.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        entry.marker.remove();
        entry.popup.remove();
        markers.delete(id);
      }
    });

    places.forEach((place) => {
      let entry = markers.get(place.id);
      if (!entry) {
        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true }).setHTML(
          `<div class="${styles.popup}"><strong>${place.name}</strong><br/>${place.address ?? ''}</div>`
        );
        const marker = new maplibregl.Marker({ color: '#1d4ed8' })
          .setLngLat([place.lon, place.lat])
          .setPopup(popup)
          .addTo(map);
        marker.getElement().addEventListener('click', () => onSelect(place.id));
        popup.on('open', () => onSelect(place.id));
        entry = { marker, popup };
        markers.set(place.id, entry);
      } else {
        entry.marker.setLngLat([place.lon, place.lat]);
        entry.popup.setHTML(`<div class="${styles.popup}"><strong>${place.name}</strong><br/>${place.address ?? ''}</div>`);
      }
    });
  }, [places, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const entry = markersRef.current.get(selectedId);
    if (entry) {
      map.flyTo({ center: entry.marker.getLngLat(), zoom: Math.max(map.getZoom(), 13.5), speed: 0.8 });
      entry.popup.addTo(map);
    }
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation) {
      const { lat, lon } = userLocation;
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({ color: '#f97316' }).setLngLat([lon, lat]).addTo(map);
      } else {
        userMarkerRef.current.setLngLat([lon, lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  return (
    <div className={styles.mapContainer}>
      <div ref={mapContainerRef} className={styles.mapRoot} aria-label="Map of cafés" />
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            onUpdateFromView(map.getBounds());
          }}
        >
          Update from map view
        </button>
      </div>
    </div>
  );
}
