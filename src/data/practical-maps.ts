type MapSearch = {
  label: string;
  cityCode: string;
  keyword: string;
  center?: readonly [longitude: number, latitude: number];
};

type MapPlace = { label: string; poiId: string };
export type PracticalMapLink = MapSearch | MapPlace;

export function nearby(landmark: string, cityCode: string, category: string): MapSearch {
  return { label: `${landmark}附近${category}`, cityCode, keyword: `${landmark} ${category}` };
}

export function district(name: string, cityCode: string, keyword: string, center?: MapSearch['center']): MapSearch {
  return { label: `${name}找${keyword}`, cityCode, keyword, center };
}

export function mapPlace(label: string, poiId: string): MapPlace {
  return { label, poiId };
}

export function practicalMapUrl(link: PracticalMapLink): string {
  if ('poiId' in link) return `https://www.amap.com/place/${link.poiId}`;
  const params = new URLSearchParams({
    keyword: link.keyword,
    city: link.cityCode,
    view: 'list',
    src: 'wander-ai-hubei',
    callnative: '0',
  });
  if (link.center) params.set('center', link.center.join(','));
  // Some Amap redirects keep plus signs verbatim in the search box.
  return 'https://uri.amap.com/search?' + params.toString().replaceAll('+', '%20');
}
