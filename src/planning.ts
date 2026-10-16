import { cityById, type TripDay } from './data';
import { practical } from './data/practical';
import { planDate, selectPlanDays, validDate, type Pace } from './travel';
export { validDate } from './travel';

export type Profile = {
  cityId: string; template: string; indices: number[]; date: string; party: number;
  group: 'friends' | 'family' | 'senior' | 'solo'; mode: 'public' | 'drive';
  budget: 'value' | 'comfort' | 'boutique'; interest: 'balanced' | 'culture' | 'nature' | 'food';
  pace: Pace; note: string;
};
export type PlannedDay = TripDay & { cityId: string; originalIndex: number; overnight: string; transfer?: string };
export const templates = [
  { id: 'wuhan-weekend', title: '江城两日，刚刚好。', subtitle: '黄鹤楼、楚文化、东湖与一碗过早', label: '周末 · 2 天', cityId: 'wuhan', image: '/images/yellow-crane.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }] },
  { id: 'west-five', title: '沿着峡江，走进恩施。', subtitle: '宜昌—恩施—利川，山水与土家生活', label: '山水 · 5 天', cityId: 'enshi', image: '/images/enshi.jpg', segments: [{ cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
  { id: 'hubei-seven', title: '给湖北，完整的一周。', subtitle: '武汉—宜昌—恩施，城市与峡谷慢慢看', label: '经典跨城 · 7 天', cityId: 'yichang', image: '/images/xiling.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }, { cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
];
export const groupLabels = { friends: '朋友 / 情侣', family: '亲子出行', senior: '长辈同行', solo: '独自旅行' };
export const budgetLabels = { value: '轻装经济', comfort: '舒适优先', boutique: '品质度假' };
export const interestLabels = { balanced: '经典综合', culture: '历史人文', nature: '山水自然', food: '城市美食' };
export function defaultProfile(cityId = 'wuhan', date = '', party = 2): Profile {
  const city = Object.hasOwn(cityById, cityId) ? cityById[cityId] : cityById.wuhan;
  return { cityId: city.id, template: 'custom', indices: city.days.map((_, i) => i).slice(0, 2), date, party, group: 'friends', mode: 'public', budget: 'comfort', interest: 'balanced', pace: 'classic', note: '' };
}
export function normalizeProfile(value: unknown, fallback = defaultProfile()): Profile {
  if (!value || typeof value !== 'object') return fallback;
  const v = value as Partial<Profile>;
  const cityId = typeof v.cityId === 'string' && Object.hasOwn(cityById, v.cityId) ? v.cityId : fallback.cityId;
  const indices = Array.isArray(v.indices) ? [...new Set(v.indices.filter(index => Number.isInteger(index) && index >= 0 && index < cityById[cityId].days.length))].sort((a, b) => a - b) : fallback.indices;
  return {
    cityId, template: templates.some(t => t.id === v.template) ? v.template! : 'custom', indices,
    date: typeof v.date === 'string' && validDate(v.date) ? v.date : '',
    party: Number.isInteger(v.party) && v.party! >= 1 && v.party! <= 6 ? v.party! : fallback.party,
    group: v.group && Object.hasOwn(groupLabels, v.group) ? v.group : fallback.group,
    mode: v.mode === 'drive' ? 'drive' : 'public', budget: v.budget && Object.hasOwn(budgetLabels, v.budget) ? v.budget : fallback.budget,
    interest: v.interest && Object.hasOwn(interestLabels, v.interest) ? v.interest : fallback.interest,
    pace: v.pace === 'relaxed' ? 'relaxed' : 'classic', note: typeof v.note === 'string' ? v.note.slice(0, 500) : '',
  };
}
export function recommendDays(cityId: string, count: number, interest: Profile['interest']): number[] {
  const kinds = practical[cityId].kinds;
  return kinds.map((kind, index) => ({ index, score: interest === 'nature' ? (kind === 'nature' || kind === 'water' ? 3 : 0) : interest === 'culture' || interest === 'food' ? (kind === 'culture' ? 3 : 0) : 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.max(1, Math.min(kinds.length, count))).map(item => item.index).sort((a, b) => a - b);
}
export function buildTrip(profile: Profile): PlannedDay[] {
  const template = templates.find(t => t.id === profile.template);
  const segments = template?.segments || [{ cityId: profile.cityId, indices: profile.indices }];
  const result: PlannedDay[] = [];
  segments.forEach((segment, segmentIndex) => {
    const city = cityById[segment.cityId];
    const indices = [...new Set(segment.indices)].filter(index => index >= 0 && index < city.days.length).sort((a, b) => a - b);
    const days = selectPlanDays(city, indices, profile.pace);
    days.forEach((day, localIndex) => {
      const originalIndex = indices[localIndex];
      const current = { ...day, cityId: city.id, originalIndex, overnight: practical[city.id].nights[originalIndex], title: `${city.shortName} · ${day.title}` } as PlannedDay;
      if (segmentIndex < segments.length - 1 && localIndex === days.length - 1) current.overnight = practical[city.id].stays[0].area + '；为次日跨城出发留出接驳';
      if (segmentIndex > 0 && localIndex === 0) {
        const from = cityById[segments[segmentIndex - 1].cityId].shortName;
        current.transfer = `${from} → ${city.shortName}`;
        current.stops[0] = { time: '上午 · 留给城市间转场', title: current.transfer, detail: profile.mode === 'drive' ? '自驾前往下一座城市，沿途安排休息。抵达后先放行李与午餐；本日原上午景点不再安排，车程以出发时导航为准。' : '按 12306 当期列车选择合适车站，另留退房、到站、候车与酒店接驳时间。上午留作交通，原上午景点移除；若到达较晚，下午也只休息。' };
        current.transport = `跨城：${current.stops[0].detail} 城内：${day.transport}`;
      }
      const modeNote = profile.mode === 'drive' ? '自驾只到允许停放的入口；景区内部车、船和索道另行确认。' : '城区优先公交或步行；山区提前安排正规直通车或包车，不默认能随时网约返程。';
      current.transport += ` ${modeNote}`;
      if (profile.group === 'family' || profile.group === 'senior') current.tip += ' 同行节奏：午后安排坐下休息，山地或长台阶量力删减，先确认儿童推车或无障碍通行条件。';
      result.push(current);
    });
  });
  return result;
}
export function tripTitle(profile: Profile): string {
  return templates.find(t => t.id === profile.template)?.title || `${cityById[profile.cityId].shortName} · 我的 ${profile.indices.length} 天旅行`;
}
export function estimateBudget(profile: Profile, dayCount: number) {
  const rates = { value: { room: [180, 320], meal: [60, 100] }, comfort: { room: [320, 550], meal: [100, 160] }, boutique: { room: [550, 900], meal: [160, 240] } }[profile.budget];
  const arrivalNight = profile.template === 'custom' && profile.indices.length > 0 && Math.min(...profile.indices) > 0;
  const nights = Math.max(0, dayCount - 1) + (arrivalNight ? 1 : 0), rooms = Math.ceil(profile.party / 2), vehicles = Math.ceil(profile.party / 4);
  const stay = rates.room.map(rate => rate * nights * rooms);
  const meals = rates.meal.map(rate => rate * profile.party * dayCount);
  const transport = (profile.mode === 'drive' ? [160, 260].map(rate => rate * vehicles) : [40, 90].map(rate => rate * profile.party)).map(rate => rate * dayCount);
  const tickets = [100, 250].map(rate => rate * profile.party * dayCount);
  return { nights, rooms, arrivalNight, roomRange: rates.room, stay, meals, transport, tickets, total: [0, 1].map(i => stay[i] + meals[i] + transport[i] + tickets[i]) };
}
export function formatDetailedPlan(profile: Profile): string {
  const days = buildTrip(profile), budget = estimateBudget(profile, days.length);
  const cityIds = [...new Set(days.map(day => day.cityId))];
  const lines = ['Wander AI · 寻游湖北', tripTitle(profile), `${profile.date || '日期待定'} · ${profile.party} 人 · ${groupLabels[profile.group]} · ${profile.mode === 'drive' ? '自驾' : '公共交通＋接驳'} · ${budgetLabels[profile.budget]}`, '路线由编辑资料与所选偏好组合；非实时 AI、导航或酒店库存。', ''];
  if (budget.arrivalNight) lines.push('抵达安排：所选路线从完整游玩日开始，建议提前一晚抵达；住宿预算已加这一晚。若当天抵达，请将首日上午改为交通并减少景点。', '');
  days.forEach((day, index) => {
    lines.push(`D${index + 1} ${planDate(profile.date, index)} | ${day.title}`, ...day.stops.flatMap(stop => [`${stop.time}｜${stop.title}`, stop.detail]), `交通：${day.transport}`, `餐食：${day.meal}`, `当晚住宿：${index < days.length - 1 ? day.overnight : '返程日；如延住可参考：' + day.overnight}`, `提醒：${day.tip}`, '');
  });
  cityIds.forEach(id => { const city = cityById[id], info = practical[id]; lines.push(`【${city.shortName} · 住宿片区】`, ...info.stays.map(stay => `${stay.area}｜${stay.bestFor}。${stay.reason} ${stay.check}`), `【${city.shortName} · 吃什么、在哪吃】`, ...info.food.map(food => `${food.area}：${food.order} ${food.timing}`), `到达：${city.arrival}`, `季节：${city.season}`, '资料来源：', ...city.sources.map(source => `${source.title}：${source.url}`), ''); });
  lines.push(`预算预留（全团）：¥${budget.total[0]}–${budget.total[1]}`, `按 ${budget.rooms} 间双人房、${budget.nights} 晚估算。住宿 ¥${budget.stay.join('–')}，餐食 ¥${budget.meals.join('–')}，当地交通预留 ¥${budget.transport.join('–')}，门票项目预留 ¥${budget.tickets.join('–')}。`, '以上是规划用额度，不是酒店或门票实时报价；不含往返大交通、跨城火车票、自驾租车费及超出预留的索道、船游等项目。', '自选章节可能影响跨天接驳；以实际到达时间、车船班次、天气和预约为准。', profile.note ? `我的备注：${profile.note}` : '', '', 'https://wander-ai-hubei.pages.dev/');
  return lines.join('\n');
}
export function sharePlanUrl(profile: Profile): string {
  const query = new URLSearchParams({ plan: profile.template, city: profile.cityId, days: profile.indices.join(','), date: profile.date, people: String(profile.party), group: profile.group, mode: profile.mode, budget: profile.budget, interest: profile.interest, pace: profile.pace });
  return `https://wander-ai-hubei.pages.dev/?${query}`;
}
export function parsePlanUrl(search: string): Profile | undefined {
  const query = new URLSearchParams(search);
  if (!query.has('plan')) return undefined;
  return normalizeProfile({ template: query.get('plan'), cityId: query.get('city'), indices: query.get('days')?.split(',').filter(Boolean).map(Number), date: query.get('date'), party: Number(query.get('people')), group: query.get('group'), mode: query.get('mode'), budget: query.get('budget'), interest: query.get('interest'), pace: query.get('pace') });
}
