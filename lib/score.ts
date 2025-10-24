import { DateTime } from 'luxon';
import { getHoursInfo } from './hours';
import { Place } from './types';

const FRESHNESS_DECAY_DAYS = 180;

const outletWeights: Record<NonNullable<Place['outlets']>, number> = {
  many: 1,
  some: 0.7,
  scarce: 0.4,
  unknown: 0.5
};

const noiseWeights: Record<NonNullable<Place['noise']>, number> = {
  quiet: 1,
  moderate: 0.8,
  loud: 0.2,
  varies: 0.6,
  unknown: 0.5
};

export function computeScore(place: Place, now: Date = new Date()): number {
  const wifiRating = place.wifi?.rating ?? 0;
  const wifiScore = Math.max(0, Math.min(1, wifiRating / 5));

  const outletsScore = place.outlets ? outletWeights[place.outlets] ?? 0.5 : 0.5;
  const noiseScore = place.noise ? noiseWeights[place.noise] ?? 0.5 : 0.5;

  const { isOpen } = getHoursInfo(place, now);
  const openScore = isOpen ? 1 : 0;

  let freshnessScore = 0.5;
  if (place.lastVerifiedAt) {
    const lastVerified = DateTime.fromISO(place.lastVerifiedAt);
    if (lastVerified.isValid) {
      const diff = Math.abs(lastVerified.diff(DateTime.fromJSDate(now), 'days').days);
      const ratio = Math.max(0, Math.min(1, 1 - diff / FRESHNESS_DECAY_DAYS));
      freshnessScore = ratio;
    }
  }

  const total =
    wifiScore * 0.4 +
    outletsScore * 0.2 +
    noiseScore * 0.2 +
    openScore * 0.1 +
    freshnessScore * 0.1;

  const score = Math.round(total * 100);
  place.score = score;
  return score;
}
