import { cityById, destinations, type CityGuide, type Destination, type TripDay } from './data';
import { practical } from './data/practical';

export type Filter = 'all' | 'nature' | 'city' | 'family' | 'saved';
export type DurationFilter = 'any' | 'half' | 'day';
const familyPlaces = new Set(['hubei-museum', 'east-lake', 'hankou', 'wudang-museum', 'jingzhou-museum', 'tonglvshan', 'mining-park', 'cihu', 'ezhou-museum', 'yiai', 'dongyong', 'yunmeng', 'suizhou-museum', 'caoyu', 'luyu', 'shijiahe', 'guanmenshan']);
export type Pace = 'classic' | 'relaxed';
export function findDestinations(cityId: string, keyword: string, filter: Filter, saved: string[], duration: DurationFilter = 'any'): Destination[] {
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return destinations.filter(place => {
    const city = cityById[place.cityId];
    const text = [place.title, place.tag, place.description, place.overview, ...place.highlights, ...place.tips, city.name, city.shortName, city.area, ...city.food].join(' ').toLowerCase();
    return (cityId === 'all' || place.cityId === cityId)
      && (filter === 'all' || (filter === 'saved' ? saved.includes(place.id) : filter === 'family' ? familyPlaces.has(place.id) : place.category === filter))
      && (duration === 'any' || (duration === 'half' ? !place.duration.includes('1 天') && !place.duration.includes('2 天') : place.duration.includes('天')))
      && terms.every(term => text.includes(term));
  });
}

export function planDays(city: CityGuide, count: number, pace: Pace): TripDay[] {
  const limit = Number.isFinite(count) ? Math.min(city.days.length, Math.max(1, Math.floor(count))) : city.days.length;
  return selectPlanDays(city, Array.from({ length: limit }, (_, i) => i), pace);
}

export function selectPlanDays(city: CityGuide, indices: number[], pace: Pace): TripDay[] {
  return [...new Set(indices)].filter(index => Number.isInteger(index) && index >= 0 && index < city.days.length).sort((a, b) => a - b).map(index => city.days[index]).map(day => ({ ...day, stops: day.stops.map((stop, index) => pace === 'relaxed' && index === 1 ? {
    time: '下午 · 弹性安排', title: '在原片区放慢脚步', detail: '先完成必要的接驳与返程，再按体力选择休息或原片区活动，不额外赶点。可选内容：' + stop.title + '。' + stop.detail,
  } : { ...stop }) }));
}

export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00+08:00`);
  return Number.isFinite(parsed.getTime()) && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed) === date;
}

export function planDate(date: string, index: number): string {
  if (!validDate(date)) return '';
  const timestamp = new Date(`${date}T12:00:00+08:00`).getTime() + index * 86400000;
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric' }).format(new Date(timestamp)) : '';
}

export function formatPlan(city: CityGuide, days: TripDay[], date = '', travelers = '2', pace: Pace = 'classic', customSelection = false): string {
  const lines = ['Wander AI · 寻游湖北', `${city.shortName} · ${days.length} 天旅行参考`, `${travelers} 位旅行者 · ${pace === 'relaxed' ? '轻松慢游：下午活动可选' : '经典串游'}`, date ? `计划出发：${date}` : '出发日期待定', '', city.intro, ''];
  if (customSelection) lines.push('自选章节提醒：每日片区内建议保留；跨天接驳、抵达城市与住宿需重新确认，系统不自动计算车程。', '');
  days.forEach((day, index) => {
    const stamp = planDate(date, index);
    lines.push(`D${index + 1}${stamp ? ` · ${stamp}` : ''} | ${day.title}`);
    day.stops.forEach(stop => lines.push(`${stop.time}｜${stop.title}`, stop.detail));
    lines.push(`交通：${day.transport}`, `餐食：${day.meal}`, `提醒：${day.tip}`, '');
    const originalIndex = city.days.findIndex(original => original.title === day.title);
    if (originalIndex >= 0) lines.push(`当晚住宿：${index < days.length - 1 ? practical[city.id].nights[originalIndex] : '返程日；如延住按住宿片区选择'}`, '');
  });
  lines.push(`到达：${city.arrival}`, `住哪里：${city.stay}`, `季节：${city.season}`, `地方风味：${city.food.join('、')}`, ...city.tips.map(tip => `· ${tip}`), '', '资料来源（景点事实；路线和时段为编辑规划建议）：', ...city.sources.map(source => `${source.title}：${source.url}`), '', '景点时段为参考安排，需为交通、午餐、排队和休息留余量。开放、预约、票种和车船班次出发前通过官方渠道确认。本站不提供真实订单或即时旅游库存。', 'https://wander-ai-hubei.pages.dev/');
  const info = practical[city.id];
  if (info) lines.push('', '住宿片区参考（非酒店实时报价）：', ...info.stays.map(stay => `${stay.area}｜${stay.bestFor}。${stay.reason} ${stay.check}`), '', '具体用餐建议：', ...info.food.map(food => `${food.area}：${food.order} ${food.timing}`));
  return lines.join('\n');
}

export function downloadPlan(text: string, cityName: string): void {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `Wander-AI-${cityName}-行程.txt`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
