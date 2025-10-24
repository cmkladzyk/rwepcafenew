export type HoursRange = { open: string; close: string };

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  neighborhood?: string;
  hours?: { [weekday: string]: HoursRange[] };
  wifi?: { rating: 1 | 2 | 3 | 4 | 5; free: boolean; lastTestMbpsDown?: number; lastTestAt?: string };
  outlets?: 'scarce' | 'some' | 'many' | 'unknown';
  noise?: 'quiet' | 'moderate' | 'loud' | 'varies' | 'unknown';
  seating?: Array<'bar' | 'tables' | 'sofas' | 'outdoor'>;
  coffeePrice?: '$' | '$$' | '$$$' | 'unknown';
  bathroom?: 'yes' | 'customers' | 'no' | 'unknown';
  parking?: Array<'street' | 'lot' | 'garage' | 'none'>;
  accessibility?: { stepFree?: boolean; doorWidthIn?: number };
  tags?: Array<'remote-friendly' | 'late-hours' | 'early-hours' | 'good-lighting' | 'power-user' | string>;
  lastVerifiedAt?: string;
  score?: number;
  source?: 'seed' | 'osm' | 'user' | 'google';
};

export type AccessibilityFilter = {
  stepFree?: boolean;
  minDoorWidthIn?: number;
};

export type PlacesQuery = {
  q?: string;
  wifiMin?: 1 | 2 | 3 | 4 | 5;
  wifiFree?: boolean;
  outlets?: Array<'scarce' | 'some' | 'many'>;
  noise?: Array<'quiet' | 'moderate' | 'loud' | 'varies'>;
  seating?: Array<'bar' | 'tables' | 'sofas' | 'outdoor'>;
  openNow?: boolean;
  hoursAt?: string;
  price?: Array<'$' | '$$' | '$$$'>;
  bathroom?: Array<'yes' | 'customers'>;
  parking?: Array<'street' | 'lot' | 'garage'>;
  accessibility?: AccessibilityFilter;
  tags?: string[];
  maxDistanceKm?: number;
  lat?: number;
  lon?: number;
  sort?: 'best' | 'distance' | 'wifi' | 'freshness';
  page?: number;
  pageSize?: number;
};

export type PlaceResult = Place & {
  distanceKm?: number;
  isOpen?: boolean;
  closesAt?: string | null;
};

export type PlacesResponse = {
  items: PlaceResult[];
  total: number;
  page: number;
  pageSize: number;
};
