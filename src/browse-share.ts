import { cityById, destinationById } from './data';
import type { DestinationSort } from './discovery';
import type { DurationFilter, Filter } from './travel';

type BrowseSelection = {
  city: string;
  filter: Exclude<Filter, 'saved'>;
  duration: DurationFilter;
  keyword: string;
  order: DestinationSort;
  view: 'places' | 'cities';
};

const site = 'https://wander-ai-hubei.pages.dev/';
const validCity = (value: string | null) => value && Object.hasOwn(cityById, value) ? value : 'all';

export function readBrowseShare(search: string): BrowseSelection | undefined {
  const query = new URLSearchParams(search);
  if (query.get('browse') !== '1') return;
  const category = query.get('type');
  const duration = query.get('duration');
  const order = query.get('order');
  return {
    city: validCity(query.get('city')),
    filter: category === 'nature' || category === 'city' || category === 'family' ? category : 'all',
    duration: duration === 'half' || duration === 'day' ? duration : 'any',
    keyword: (query.get('q') || '').trim().slice(0, 100),
    order: order === 'duration' || order === 'city' ? order : 'recommended',
    view: query.get('view') === 'cities' ? 'cities' : 'places',
  };
}

export function shareBrowseUrl(selection: BrowseSelection): string {
  const query = new URLSearchParams({ browse: '1' });
  if (selection.view === 'cities') {
    query.set('view', 'cities');
  } else {
    if (validCity(selection.city) !== 'all') query.set('city', selection.city);
    if (selection.filter !== 'all') query.set('type', selection.filter);
    if (selection.duration !== 'any') query.set('duration', selection.duration);
    if (selection.order !== 'recommended') query.set('order', selection.order);
    const keyword = selection.keyword.trim().slice(0, 100);
    if (keyword) query.set('q', keyword);
  }
  return site + '?' + query + '#destinations';
}

export function recentPlaceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && Object.hasOwn(destinationById, id)))].slice(0, 4);
}
