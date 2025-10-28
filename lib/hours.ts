import { DateTime } from 'luxon';
import { Place } from './types';

const WEEKDAYS: Array<keyof NonNullable<Place['hours']>> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

type HoursInfo = {
  isOpen: boolean;
  closesAt: Date | null;
};

type ParsedRange = {
  start: DateTime;
  end: DateTime;
};

function parseRange(base: DateTime, range: { open: string; close: string }, dayOffset = 0): ParsedRange {
  const [openHour, openMinute] = range.open.split(':').map(Number);
  const [closeHour, closeMinute] = range.close.split(':').map(Number);
  const start = base.startOf('day').plus({ days: dayOffset }).set({ hour: openHour, minute: openMinute, second: 0, millisecond: 0 });
  let end = base.startOf('day').plus({ days: dayOffset }).set({ hour: closeHour, minute: closeMinute, second: 0, millisecond: 0 });
  if (end <= start) {
    end = end.plus({ days: 1 });
  }
  return { start, end };
}

function getRangesForDay(place: Place, base: DateTime, dayIndex: number, dayOffset = 0): ParsedRange[] {
  const hours = place.hours;
  if (!hours) return [];
  const dayKey = WEEKDAYS[dayIndex];
  const entries = hours[dayKey];
  if (!entries) return [];
  return entries.map((range) => parseRange(base, range, dayOffset));
}

export function getHoursInfo(place: Place, at: Date = new Date(), timezone = 'America/Denver'): HoursInfo {
  const base = DateTime.fromJSDate(at, { zone: timezone });
  const todayIndex = base.weekday % 7; // luxon: Monday=1
  const rangesToday = getRangesForDay(place, base, todayIndex);
  for (const range of rangesToday) {
    if (base >= range.start && base < range.end) {
      return { isOpen: true, closesAt: range.end.toJSDate() };
    }
  }
  // check spillovers from previous day
  const prevDayIndex = (todayIndex + 6) % 7;
  const prevDayRanges = getRangesForDay(place, base.minus({ days: 1 }), prevDayIndex, -1);
  for (const range of prevDayRanges) {
    if (base >= range.start && base < range.end) {
      return { isOpen: true, closesAt: range.end.toJSDate() };
    }
  }
  return { isOpen: false, closesAt: null };
}

export function isOpenAt(place: Place, at: Date = new Date(), timezone = 'America/Denver'): boolean {
  return getHoursInfo(place, at, timezone).isOpen;
}

export function formatClosingTime(date: Date | null, timezone = 'America/Denver'): string | null {
  if (!date) return null;
  const dt = DateTime.fromJSDate(date, { zone: timezone });
  return dt.toFormat('hh:mm a');
}
