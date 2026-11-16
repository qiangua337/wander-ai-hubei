import { cities, cityById, destinations, destinationById, type Destination } from './data';
import { attractionRoutes } from './data/attraction-routes';

export type DestinationSort = 'recommended' | 'duration' | 'city';
export const cityGroups = Array.from(new Set(cities.map(city => city.area)), area => ({
  area, cities: cities.filter(city => city.area === area),
}));
export const placesByCity = Object.fromEntries(cities.map(city => [city.id, destinations.filter(place => place.cityId === city.id)])) as Record<string, Destination[]>;

// Each pair points to a specific main or afternoon visit in the existing point-to-point chapters.
const placeChapters: Readonly<Partial<Record<string, { chapter: number; visit: string }>>> = {
  wuhan: { chapter: 0, visit: '黄鹤楼' },
  'hubei-museum': { chapter: 1, visit: '湖北省博物馆' },
  'east-lake': { chapter: 1, visit: '东湖听涛 · 梨园' },
  hankou: { chapter: 2, visit: '江汉路—江汉关' },
  qingchuan: { chapter: 2, visit: '晴川阁或古琴台' },
  'three-gorges-dam': { chapter: 1, visit: '三峡大坝旅游区' },
  'three-gorges-tribe': { chapter: 2, visit: '三峡人家 · 确认码头后入园' },
  qingjiang: { chapter: 3, visit: '长阳清江画廊 · 按票面登船' },
  quyuan: { chapter: 1, visit: '秭归屈原故里' },
  enshi: { chapter: 1, visit: '恩施大峡谷 · 七星寨方向' },
  'tusi-city': { chapter: 0, visit: '恩施土司城' },
  tenglong: { chapter: 2, visit: '利川 · 腾龙洞游客区' },
  wudang: { chapter: 1, visit: '金顶方向' },
  'wudang-museum': { chapter: 0, visit: '武当博物馆' },
  danjiangkou: { chapter: 2, visit: '丹江口库区开放观景点' },
  'xiangyang-old-town': { chapter: 0, visit: '昭明台与北街' },
  gulongzhong: { chapter: 1, visit: '古隆中' },
  tangcheng: { chapter: 2, visit: '唐城' },
  migong: { chapter: 2, visit: '米公祠' },
  'jingzhou-wall': { chapter: 0, visit: '古城东门 · 宾阳楼与护城河' },
  'jingzhou-museum': { chapter: 0, visit: '荆州博物馆' },
  chariots: { chapter: 1, visit: '楚王车马阵' },
  weishui: { chapter: 2, visit: '松滋洈水 · 所选湖岸或码头' },
  xianling: { chapter: 0, visit: '明显陵' },
  mochou: { chapter: 0, visit: '莫愁村' },
  zhanghe: { chapter: 1, visit: '漳河景区开放片区' },
  lvlin: { chapter: 2, visit: '绿林山所选开放片区' },
  tonglvshan: { chapter: 0, visit: '铜绿山国家考古遗址公园' },
  'mining-park': { chapter: 1, visit: '黄石国家矿山公园' },
  xiandao: { chapter: 2, visit: '阳新仙岛湖 · 王英镇所选线' },
  cihu: { chapter: 0, visit: '磁湖岸线' },
  'ezhou-xishan': { chapter: 0, visit: '西山开放步道' },
  'ezhou-museum': { chapter: 0, visit: '鄂州市博物馆' },
  liangzi: { chapter: 1, visit: '梁子湖已确认开放的岸线' },
  dongpo: { chapter: 0, visit: '东坡赤壁' },
  yiai: { chapter: 0, visit: '遗爱湖同一段岸线' },
  guifeng: { chapter: 1, visit: '麻城龟峰山' },
  chibi: { chapter: 0, visit: '三国赤壁古战场' },
  yangloudong: { chapter: 1, visit: '羊楼洞古街' },
  'hot-spring': { chapter: 2, visit: '已确认的温泉场所' },
  dongyong: { chapter: 0, visit: '董永公园' },
  yunmeng: { chapter: 1, visit: '云梦县博物馆' },
  shuangfeng: { chapter: 2, visit: '双峰山已开放森林线' },
  'suizhou-museum': { chapter: 0, visit: '随州博物馆' },
  yandi: { chapter: 1, visit: '随县 · 炎帝故里' },
  ginkgo: { chapter: 2, visit: '洛阳镇 · 千年银杏谷' },
  mengli: { chapter: 0, visit: '梦里水乡' },
  mianyang: { chapter: 1, visit: '排湖 · 沔阳小镇' },
  longwan: { chapter: 1, visit: '龙湾国家考古遗址公园' },
  caoyu: { chapter: 0, visit: '曹禺纪念馆' },
  shijiahe: { chapter: 0, visit: '石家河遗址博物馆' },
  luyu: { chapter: 1, visit: '陆羽故园' },
  'hu-garden': { chapter: 1, visit: '胡家花园' },
  shennongjia: { chapter: 2, visit: '大九湖指定步道' },
  shennongding: { chapter: 1, visit: '神农顶开放线路' },
  guanmenshan: { chapter: 0, visit: '官门山' },
  tianyan: { chapter: 3, visit: '天燕开放片区' },
};

export function routeForPlace(placeId: string) {
  if (Object.hasOwn(placeChapters, placeId)) return placeChapters[placeId];
  if (!Object.hasOwn(destinationById, placeId)) return;
  const city = cityById[destinationById[placeId].cityId];
  const extra = attractionRoutes[city.id] ?? [];
  const index = extra.findIndex(route => route.placeId === placeId);
  if (index >= 0) return { chapter: city.days.length + index, visit: extra[index].visitTitle };
}

export function guideFromSearch(search: string): { cityId: string; placeId?: string } | undefined {
  const query = new URLSearchParams(search), placeId = query.get('place'), cityId = query.get('guide');
  if (placeId && Object.hasOwn(destinationById, placeId)) return { cityId: destinationById[placeId].cityId, placeId };
  if (cityId && Object.hasOwn(cityById, cityId)) return { cityId };
}

export function shareGuideUrl(cityId: string, placeId?: string): string {
  return `https://wander-ai-hubei.pages.dev/?${new URLSearchParams(placeId ? { place: placeId } : { guide: cityId })}`;
}

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
