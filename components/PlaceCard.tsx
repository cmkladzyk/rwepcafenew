'use client';

import styles from './PlaceCard.module.css';
import type { PlaceResult } from '@/lib/types';
import { formatClosingTime } from '@/lib/hours';

function renderStars(rating?: number) {
  if (!rating) return '—';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

type PlaceCardProps = {
  place: PlaceResult;
  selected?: boolean;
  onSelect: (place: PlaceResult) => void;
};

export function PlaceCard({ place, selected, onSelect }: PlaceCardProps) {
  const closingTime = place.isOpen ? formatClosingTime(place.closesAt ? new Date(place.closesAt) : null) : null;
  return (
    <article
      className={`${styles.card} ${selected ? styles.active : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(place)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(place);
        }
      }}
    >
      <div className={styles.titleRow}>
        <h3 className={styles.name}>{place.name}</h3>
        <span className={styles.badge}>{place.score ?? '—'} pts</span>
      </div>
      {place.address && <div className={styles.address}>{place.address}</div>}
      <div className={styles.meta}>
        <span>Wi-Fi: {renderStars(place.wifi?.rating)}</span>
        <span>Outlets: {place.outlets ?? 'Unknown'}</span>
        <span>Noise: {place.noise ?? 'Unknown'}</span>
        {place.distanceKm !== undefined && <span>{place.distanceKm.toFixed(1)} km away</span>}
      </div>
      <div className={styles.badges}>
        {place.isOpen ? <span className={styles.badge}>Open{closingTime ? ` until ${closingTime}` : ''}</span> : <span className={styles.badge}>Closed</span>}
        {place.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className={styles.badge}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
