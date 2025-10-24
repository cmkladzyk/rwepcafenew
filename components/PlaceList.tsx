'use client';

import styles from './PlaceList.module.css';
import type { PlaceResult } from '@/lib/types';
import { PlaceCard } from './PlaceCard';

type PlaceListProps = {
  places: PlaceResult[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error?: string | null;
  onSelect: (place: PlaceResult) => void;
  selectedId?: string | null;
  onPageChange: (page: number) => void;
};

export function PlaceList({
  places,
  total,
  page,
  pageSize,
  isLoading,
  error,
  onSelect,
  selectedId,
  onPageChange
}: PlaceListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <strong>{total} results</strong>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>
      {isLoading ? (
        <div className={styles.loadingState}>Loading cafés…</div>
      ) : error ? (
        <div className={styles.errorState}>We hit a snag: {error}</div>
      ) : places.length === 0 ? (
        <div className={styles.emptyState}>No matches—try widening your filters.</div>
      ) : (
        <div className={styles.list}>
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} selected={selectedId === place.id} onSelect={onSelect} />
          ))}
        </div>
      )}
      <div className={styles.pagination}>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading}>
          Previous
        </button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading}>
          Next
        </button>
      </div>
    </div>
  );
}
