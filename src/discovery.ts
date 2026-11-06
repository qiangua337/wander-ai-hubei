import { cities, type Destination } from './data';

export type DestinationSort = 'recommended' | 'duration' | 'city';
export function sortDestinations(places: Destination[], order: DestinationSort): Destination[] {
  if (order === 'recommended') return places;
  const cityOrder = new Map(cities.map((city, index) => [city.id, index]));
  const hours = (duration: string) => {
    const days = duration.match(/(\d+(?:\.\d+)?)\s*天/);
    if (days) return Number(days[1]) * 8;
    if (duration.includes('半天')) return 4;
    const values = [...duration.matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
    return values.length ? Math.max(...values) : Number.POSITIVE_INFINITY;
  };
  return [...places].sort((a, b) => order === 'city'
    ? (cityOrder.get(a.cityId) ?? 99) - (cityOrder.get(b.cityId) ?? 99)
    : hours(a.duration) - hours(b.duration));
}
