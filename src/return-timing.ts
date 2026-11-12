export type DepartureWindow = 'morning' | 'afternoon' | 'evening' | 'flexible';

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
