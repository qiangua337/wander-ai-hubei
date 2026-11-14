import { returnWalks } from './data/return-mornings';

export type DepartureWindow = 'morning' | 'afternoon' | 'evening' | 'flexible';

export type ReturnLogistics = { area?: string; travelMinutes?: number; luggageMinutes?: number };

export const returnMinuteLimits = { travelMinutes: { min: 1, max: 360 }, luggageMinutes: { min: 0, max: 120 } };

export function readReturnMinutes(value: unknown, field: keyof typeof returnMinuteLimits): number | undefined {
  const bounds = returnMinuteLimits[field];
  const minutes = typeof value === 'string' && /^\d{1,3}$/.test(value.trim()) ? Number(value) : value;
  if (typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= bounds.min && minutes <= bounds.max) return minutes;
}

export function normalizeReturnLogistics(value: unknown, cityId: string): ReturnLogistics | undefined {
  if (!value || typeof value !== 'object') return;
  const input = value as Partial<ReturnLogistics>;
  const area = input.area === 'other' || returnWalks[cityId]?.some(walk => walk.id === input.area) ? input.area : undefined;
  const travelMinutes = readReturnMinutes(input.travelMinutes, 'travelMinutes');
  const luggageMinutes = readReturnMinutes(input.luggageMinutes, 'luggageMinutes');
  if (area === undefined && travelMinutes === undefined && luggageMinutes === undefined) return;
  return { ...(area ? { area } : {}), ...(travelMinutes !== undefined ? { travelMinutes } : {}), ...(luggageMinutes !== undefined ? { luggageMinutes } : {}) };
}

export function returnAreaLabel(area: string | undefined, cityId: string): string | undefined {
  if (area === 'other') return '其他落脚片区';
  return returnWalks[cityId]?.find(walk => walk.id === area)?.area;
}

export const manualTravelBuffer = 15;
export const returnBreakfastStart = 9 * 60;
export const returnBreakfastMinutes = 20;

export function parseClock(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function normalizeClockInput(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  const time = value.trim().replace('：', ':').replace(/^(\d):/, '0$1:');
  if (parseClock(time) !== undefined) return time;
}

export function formatClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function clockWindow(minutes: number): Exclude<DepartureWindow, 'flexible'> {
  return minutes < 12 * 60 ? 'morning' : minutes < 18 * 60 ? 'afternoon' : 'evening';
}

export function normalizeStation(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  const station = value.trim().replace(/火车站$|高铁站$/, '站');
  if (/^(?:火车|高铁|车)?站$/.test(station)) return;
  if (/^(?:[\u4e00-\u9fff]{1,16}站|[\u4e00-\u9fff]{0,14}机场)$/.test(station)) return station;
}

export type StationSchedule = {
  finishBy: string;
  leaveForStationBy: string;
  arriveBy: string;
};
