import { chapterKey } from './day-starts';

export type VisitSlot = 'main' | 'afternoon';
export type VisitChange = { from: string; slot: VisitSlot; to?: string; alternative?: string };

export const visitChangeLimit = 14;
export const visitChangeKey = ({ from, slot }: VisitChange) => `${from}:${slot}`;

export function readVisitChanges(value: unknown, chapters?: ReadonlySet<string>): VisitChange[] | undefined {
  if (!Array.isArray(value)) return;
  const keyPattern = /^[a-z]+:[0-9]+$/;
  const validKey = (key: unknown): key is string => typeof key === 'string' && keyPattern.test(key) && (!chapters || chapters.has(key));
  const result: VisitChange[] = [];
  for (const item of value.slice(0, visitChangeLimit)) {
    if (!item || typeof item !== 'object') continue;
    const { from, slot, to, alternative } = item as Partial<VisitChange>;
    if (!validKey(from) || (slot !== 'main' && slot !== 'afternoon') || result.some(change => change.from === from && change.slot === slot)) continue;
    if (to !== undefined && (!validKey(to) || to === from || to.split(':')[0] !== from.split(':')[0])) continue;
    if (alternative !== undefined && (to || typeof alternative !== 'string' || !/^[a-z0-9-]{1,48}$/.test(alternative))) continue;
    if (!to && !alternative) continue;
    result.push({ from, slot, ...(to ? { to } : {}), ...(alternative ? { alternative } : {}) });
  }
  return result.length ? result : undefined;
}

export function changeVisit(changes: VisitChange[] | undefined, change: VisitChange, undo = false): VisitChange[] | undefined {
  const next = changes?.filter(item => visitChangeKey(item) !== visitChangeKey(change)) || [];
  return readVisitChanges(undo ? next : [...next, change]);
}

export function changeDayKey(day: { cityId: string; originalIndex: number }): string {
  return chapterKey(day.cityId, day.originalIndex);
}
