'use client';

import React, { ChangeEvent } from 'react';
import styles from './FilterBar.module.css';
import type { PlacesQuery } from '@/lib/types';

const NOISE_OPTIONS: Array<{ value: NonNullable<PlacesQuery['noise']>[number]; label: string }> = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'loud', label: 'Loud' },
  { value: 'varies', label: 'Varies' }
];

const OUTLET_OPTIONS: Array<{ value: NonNullable<PlacesQuery['outlets']>[number]; label: string }> = [
  { value: 'many', label: 'Many outlets' },
  { value: 'some', label: 'Some outlets' },
  { value: 'scarce', label: 'Scarce' }
];

const SEATING_OPTIONS: Array<{ value: NonNullable<PlacesQuery['seating']>[number]; label: string }> = [
  { value: 'tables', label: 'Tables' },
  { value: 'bar', label: 'Bar' },
  { value: 'sofas', label: 'Sofas' },
  { value: 'outdoor', label: 'Outdoor' }
];

const PRICE_OPTIONS: Array<{ value: NonNullable<PlacesQuery['price']>[number]; label: string }> = [
  { value: '$', label: '$' },
  { value: '$$', label: '$$' },
  { value: '$$$', label: '$$$' }
];

const PARKING_OPTIONS: Array<{ value: NonNullable<PlacesQuery['parking']>[number]; label: string }> = [
  { value: 'street', label: 'Street' },
  { value: 'lot', label: 'Parking lot' },
  { value: 'garage', label: 'Garage' }
];

const BATHROOM_OPTIONS: Array<{ value: NonNullable<PlacesQuery['bathroom']>[number]; label: string }> = [
  { value: 'yes', label: 'Public restroom' },
  { value: 'customers', label: 'Customers only' }
];

const TAG_OPTIONS = ['remote-friendly', 'late-hours', 'early-hours', 'good-lighting', 'power-user'];

const SORT_OPTIONS: Array<{ value: NonNullable<PlacesQuery['sort']>; label: string }> = [
  { value: 'best', label: 'Best match' },
  { value: 'distance', label: 'Distance' },
  { value: 'wifi', label: 'Wi-Fi quality' },
  { value: 'freshness', label: 'Recently verified' }
];

type LocationStatus = 'idle' | 'loading' | 'granted' | 'error';

type FilterBarProps = {
  query: PlacesQuery;
  onChange: (updater: (prev: PlacesQuery) => PlacesQuery) => void;
  onReset: () => void;
  onRequestLocation: () => void;
  onClearLocation: () => void;
  locationStatus: LocationStatus;
  locationError?: string;
};

function toggleValue(values: string[] | undefined, value: string): string[] {
  const set = new Set(values ?? []);
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
  return Array.from(set);
}

export function FilterBar({
  query,
  onChange,
  onReset,
  onRequestLocation,
  onClearLocation,
  locationStatus,
  locationError
}: FilterBarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange((prev) => ({ ...prev, q: value || undefined, page: 1 }));
  };

  const handleWifiMinChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange((prev) => ({ ...prev, wifiMin: value ? (Number(value) as PlacesQuery['wifiMin']) : undefined, page: 1 }));
  };

  const handleCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onChange((prev) => ({ ...prev, [name]: checked ? true : undefined, page: 1 }));
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as PlacesQuery['sort'];
    onChange((prev) => ({ ...prev, sort: value }));
  };

  const handleDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    onChange((prev) => ({ ...prev, maxDistanceKm: value, page: 1 }));
  };

  const handleDoorWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange((prev) => {
      const next = {
        ...prev,
        accessibility: {
          ...prev.accessibility,
          minDoorWidthIn: value ? Number(value) : undefined
        },
        page: 1
      };
      if (!next.accessibility?.stepFree && !next.accessibility?.minDoorWidthIn) {
        next.accessibility = undefined;
      }
      return next;
    });
  };

  const handleStepFreeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    onChange((prev) => {
      const next = {
        ...prev,
        accessibility: {
          ...prev.accessibility,
          stepFree: checked ? true : undefined
        },
        page: 1
      };
      if (!next.accessibility?.stepFree && !next.accessibility?.minDoorWidthIn) {
        next.accessibility = undefined;
      }
      return next;
    });
  };

  const updateMulti = (key: keyof PlacesQuery, value: string) => {
    onChange((prev) => {
      const nextValues = toggleValue(prev[key] as string[] | undefined, value);
      return {
        ...prev,
        [key]: nextValues.length ? nextValues : undefined,
        page: 1
      };
    });
  };

  const distanceEnabled = query.lat !== undefined && query.lon !== undefined;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.row}>
          <label htmlFor="search" className={styles.sectionTitle}>
            Search
          </label>
          <input
            id="search"
            name="search"
            className={styles.searchInput}
            placeholder="Search by name, neighborhood, or tag"
            value={query.q ?? ''}
            onChange={handleSearchChange}
          />
          <select
            aria-label="Sort results"
            className={styles.sortSelect}
            value={query.sort ?? 'best'}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" className={styles.resetButton} onClick={onReset}>
            Reset filters
          </button>
        </div>

        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Wi-Fi</div>
            <select className={styles.select} value={query.wifiMin ?? ''} onChange={handleWifiMinChange} aria-label="Minimum Wi-Fi rating">
              <option value="">Any rating</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}+ stars
                </option>
              ))}
            </select>
            <label style={{ marginLeft: '0.75rem' }}>
              <input
                type="checkbox"
                className={styles.checkbox}
                name="wifiFree"
                checked={query.wifiFree ?? false}
                onChange={handleCheckbox}
              />{' '}
              Free Wi-Fi
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              className={styles.checkbox}
              name="openNow"
              checked={query.openNow ?? false}
              onChange={handleCheckbox}
            />
            Open now
          </label>
        </div>

        <div>
          <div className={styles.sectionTitle}>Noise</div>
          <div className={styles.chips}>
            {NOISE_OPTIONS.map((option) => {
              const active = query.noise?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('noise', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Outlets</div>
          <div className={styles.chips}>
            {OUTLET_OPTIONS.map((option) => {
              const active = query.outlets?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('outlets', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Seating</div>
          <div className={styles.chips}>
            {SEATING_OPTIONS.map((option) => {
              const active = query.seating?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('seating', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Price</div>
          <div className={styles.chips}>
            {PRICE_OPTIONS.map((option) => {
              const active = query.price?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('price', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Parking</div>
          <div className={styles.chips}>
            {PARKING_OPTIONS.map((option) => {
              const active = query.parking?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('parking', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Bathroom</div>
          <div className={styles.chips}>
            {BATHROOM_OPTIONS.map((option) => {
              const active = query.bathroom?.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('bathroom', option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>Tags</div>
          <div className={styles.chips}>
            {TAG_OPTIONS.map((tag) => {
              const active = query.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.chipButton} ${active ? styles.chipActive : ''}`}
                  onClick={() => updateMulti('tags', tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.locationBlock}>
          <div className={styles.sectionTitle}>Distance</div>
          <div className={styles.locationActions}>
            {!distanceEnabled ? (
              <button type="button" className={styles.primaryButton} onClick={onRequestLocation}>
                Use my location
              </button>
            ) : (
              <button type="button" className={styles.secondaryButton} onClick={onClearLocation}>
                Clear location
              </button>
            )}
            {locationStatus === 'loading' && <span className={styles.statusMessage}>Requesting location…</span>}
            {locationStatus === 'error' && locationError && (
              <span className={styles.statusMessage}>Location unavailable: {locationError}</span>
            )}
          </div>
          <label>
            Within {query.maxDistanceKm ?? 5} km
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              className={`${styles.rangeInput}`}
              value={query.maxDistanceKm ?? 5}
              disabled={!distanceEnabled}
              onChange={handleDistanceChange}
            />
          </label>
        </div>

        <div>
          <div className={styles.sectionTitle}>Accessibility</div>
          <div className={styles.row}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input type="checkbox" checked={query.accessibility?.stepFree ?? false} onChange={handleStepFreeChange} />
              Step-free entrance
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Door width (in)
              <input
                type="number"
                min={24}
                max={60}
                className={styles.numberInput}
                value={query.accessibility?.minDoorWidthIn ?? ''}
                onChange={handleDoorWidthChange}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
