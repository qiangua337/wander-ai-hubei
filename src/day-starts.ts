import { normalizeClockInput, parseClock } from './return-timing';

export type DayStarts = Record<string, string>;

export const chapterKey = (cityId: string, index: number) => `${cityId}:${index}`;

export const dayStartWindow = { min: '06:00', max: '14:00' };
const earliest = parseClock(dayStartWindow.min)!;
const latest = parseClock(dayStartWindow.max)!;

export function readDayStart(value: unknown): string | undefined {
  const time = normalizeClockInput(value);
  const minutes = parseClock(time);
  return minutes !== undefined && minutes >= earliest && minutes <= latest ? time : undefined;
}

export function normalizeDayStarts(value: unknown, chapters?: ReadonlySet<string>): DayStarts | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const entries: [string, string][] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (!/^[a-z]+:[0-9]+$/.test(key) || (chapters && !chapters.has(key))) continue;
    const time = readDayStart(raw);
    if (time) entries.push([key, time]);
  }
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function setDayStart(starts: DayStarts | undefined, key: string, time?: string): DayStarts | undefined {
  const updated = { ...starts };
  if (time) updated[key] = time;
  else delete updated[key];
  return Object.keys(updated).length > 0 ? updated : undefined;
}
