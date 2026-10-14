import { cityById, destinations, type CityGuide, type Destination, type TripDay } from './data';

export type Filter = 'all' | 'nature' | 'city' | 'saved';
export type Pace = 'classic' | 'relaxed';
export function findDestinations(cityId: string, keyword: string, filter: Filter, saved: string[]): Destination[] {
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return destinations.filter(place => {
    const city = cityById[place.cityId];
    const text = [place.title, place.tag, place.description, place.overview, ...place.highlights, city.name, city.shortName, city.area].join(' ').toLowerCase();
    return (cityId === 'all' || place.cityId === cityId)
      && (filter === 'all' || (filter === 'saved' ? saved.includes(place.id) : place.category === filter))
      && terms.every(term => text.includes(term));
  });
}

export function planDays(city: CityGuide, count: number, pace: Pace): TripDay[] {
  const limit = Number.isFinite(count) ? Math.min(city.days.length, Math.max(1, Math.floor(count))) : city.days.length;
  return city.days.slice(0, limit).map(day => ({ ...day, stops: day.stops.map((stop, index) => pace === 'relaxed' && index === 1 ? {
    time: '下午 · 留给休整', title: '在原片区放慢脚步', detail: '不增加第二处大型景点。用午餐、轻步行和休息留白；按原定交通安排返回或前往住宿地。原经典路线可选：' + stop.title + '。',
  } : { ...stop }) }));
}

export function formatPlan(city: CityGuide, days: TripDay[], date = '', travelers = '2', pace: Pace = 'classic'): string {
  const lines = ['Wander AI · 寻游湖北', `${city.shortName} · ${days.length} 天旅行参考`, `${travelers} 位旅行者 · ${pace === 'relaxed' ? '轻松慢游：下午留白' : '经典串游'}`, date ? `计划出发：${date}` : '出发日期待定', '', city.intro, ''];
  days.forEach((day, index) => {
    const stamp = date ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric' }).format(new Date(new Date(`${date}T12:00:00+08:00`).getTime() + index * 86400000)) : '';
    lines.push(`D${index + 1}${stamp ? ` · ${stamp}` : ''} | ${day.title}`);
    day.stops.forEach(stop => lines.push(`${stop.time}｜${stop.title}`, stop.detail));
    lines.push(`交通：${day.transport}`, `餐食：${day.meal}`, `提醒：${day.tip}`, '');
  });
  lines.push(`到达：${city.arrival}`, `住哪里：${city.stay}`, `季节：${city.season}`, `地方风味：${city.food.join('、')}`, ...city.tips.map(tip => `· ${tip}`), '', '资料来源（景点事实；路线和时段为编辑规划建议）：', ...city.sources.map(source => `${source.title}：${source.url}`), '', '景点时段为参考安排，需为交通、午餐、排队和休息留余量。开放、预约、票种和车船班次出发前通过官方渠道确认。本站不提供真实订单或即时旅游库存。', 'https://wander-ai-hubei.pages.dev/');
  return lines.join('\n');
}

export function downloadPlan(text: string, cityName: string): void {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `Wander-AI-${cityName}-行程.txt`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
