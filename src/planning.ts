import { cityById, type TripDay } from './data';
import { practical } from './data/practical';
import { routeDetails, type RouteEffort } from './data/route-details';
import { planDate, selectPlanDays, validDate, type Pace } from './travel';
export { validDate } from './travel';

export type Profile = {
  cityId: string; template: string; indices: number[]; date: string; party: number;
  group: 'friends' | 'family' | 'senior' | 'solo'; mode: 'public' | 'drive';
  budget: 'value' | 'comfort' | 'boutique'; interest: 'balanced' | 'culture' | 'nature' | 'food';
  pace: Pace; note: string;
  origin?: string; arrival?: 'full-day' | 'morning' | 'afternoon' | 'evening' | 'previous-night';
  mobility?: 'standard' | 'gentle'; budgetLimit?: number; budgetScope?: 'total' | 'per-person';
};
export type PlannedDay = TripDay & { cityId: string; originalIndex: number; overnight: string; transfer?: string; region: string; effort: RouteEffort; breakfast?: string; lunch?: string; dinner?: string };
export const templates = [
  { id: 'wuhan-weekend', title: '江城两日，刚刚好。', subtitle: '黄鹤楼、楚文化、东湖与一碗过早', label: '周末 · 2 天', cityId: 'wuhan', image: '/images/yellow-crane.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }] },
  { id: 'west-five', title: '沿着峡江，走进恩施。', subtitle: '宜昌—恩施—利川，山水与土家生活', label: '山水 · 5 天', cityId: 'enshi', image: '/images/enshi.jpg', segments: [{ cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
  { id: 'hubei-seven', title: '给湖北，完整的一周。', subtitle: '武汉—宜昌—恩施，城市与峡谷慢慢看', label: '经典跨城 · 7 天', cityId: 'yichang', image: '/images/xiling.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }, { cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
];
export const groupLabels = { friends: '朋友 / 情侣', family: '亲子出行', senior: '长辈同行', solo: '独自旅行' };
export const budgetLabels = { value: '轻装经济', comfort: '舒适优先', boutique: '品质度假' };
export const interestLabels = { balanced: '经典综合', culture: '历史人文', nature: '山水自然', food: '城市美食' };
export const arrivalLabels = { 'full-day': '从完整游玩日开始', morning: '首日上午抵达', afternoon: '首日下午抵达', evening: '首日晚间抵达', 'previous-night': '提前一晚抵达' };
export const mobilityLabels = { standard: '常规步行', gentle: '减少高强度山地' };
export function defaultProfile(cityId = 'wuhan', date = '', party = 2): Profile {
  const city = Object.hasOwn(cityById, cityId) ? cityById[cityId] : cityById.wuhan;
  return { cityId: city.id, template: 'custom', indices: city.days.map((_, i) => i).slice(0, 2), date, party, group: 'friends', mode: 'public', budget: 'comfort', interest: 'balanced', pace: 'classic', note: '' };
}
export function normalizeProfile(value: unknown, fallback = defaultProfile()): Profile {
  if (!value || typeof value !== 'object') return fallback;
  const v = value as Partial<Profile>;
  const cityId = typeof v.cityId === 'string' && Object.hasOwn(cityById, v.cityId) ? v.cityId : fallback.cityId;
  const indices = Array.isArray(v.indices) ? [...new Set(v.indices.filter(index => Number.isInteger(index) && index >= 0 && index < cityById[cityId].days.length))].sort((a, b) => a - b) : fallback.indices;
  const party = Number.isInteger(v.party) && v.party! >= 1 && v.party! <= 6 ? v.party! : fallback.party;
  const group = v.group && Object.hasOwn(groupLabels, v.group) ? v.group : fallback.group;
  const optional: Partial<Profile> = {};
  const rawOrigin = typeof v.origin === 'string' ? v.origin.trim().slice(0, 24) : v.origin === undefined ? fallback.origin : undefined;
  const preciseAddress = rawOrigin && /小区|单元|栋|幢|公寓|街道|\d+号|\d+室|\d{6,}/.test(rawOrigin);
  const origin = preciseAddress && rawOrigin ? rawOrigin.match(/^(.{2,8}?市)/)?.[1] || Object.values(cityById).find(city => rawOrigin.startsWith(city.shortName))?.shortName : rawOrigin;
  if (origin) optional.origin = origin;
  const arrival = v.arrival === undefined ? fallback.arrival : v.arrival;
  if (typeof arrival === 'string' && Object.hasOwn(arrivalLabels, arrival)) optional.arrival = arrival;
  const mobility = v.mobility === undefined ? fallback.mobility : v.mobility;
  if (mobility === 'standard' || mobility === 'gentle') optional.mobility = mobility;
  const budgetLimit = v.budgetLimit === undefined ? fallback.budgetLimit : v.budgetLimit;
  if (typeof budgetLimit === 'number' && Number.isFinite(budgetLimit) && budgetLimit > 0 && budgetLimit <= 1000000) optional.budgetLimit = budgetLimit;
  const budgetScope = v.budgetScope === undefined ? fallback.budgetScope : v.budgetScope;
  if (budgetScope === 'total' || budgetScope === 'per-person') optional.budgetScope = budgetScope;
  return {
    cityId, template: templates.some(t => t.id === v.template) ? v.template! : 'custom', indices,
    date: typeof v.date === 'string' && validDate(v.date) ? v.date : '',
    party,
    group: group === 'solo' && party > 1 ? 'friends' : group,
    mode: v.mode === 'drive' ? 'drive' : 'public', budget: v.budget && Object.hasOwn(budgetLabels, v.budget) ? v.budget : fallback.budget,
    interest: v.interest && Object.hasOwn(interestLabels, v.interest) ? v.interest : fallback.interest,
    pace: v.pace === 'relaxed' ? 'relaxed' : 'classic', note: typeof v.note === 'string' ? v.note.slice(0, 500) : '', ...optional,
  };
}
export function recommendDays(cityId: string, count: number, interest: Profile['interest']): number[] {
  return recommendConstrainedDays(cityId, count, interest);
}
export function recommendConstrainedDays(cityId: string, count: number, interest: Profile['interest'], mobility: Profile['mobility'] = 'standard'): number[] {
  if (!Object.hasOwn(cityById, cityId)) return [];
  const kinds = practical[cityId].kinds;
  return kinds.map((kind, index) => ({ index, score: interest === 'nature' ? (kind === 'nature' || kind === 'water' ? 3 : 0) : interest === 'culture' || interest === 'food' ? (kind === 'culture' ? 3 : 0) : 0 }))
    .filter(item => mobility !== 'gentle' || routeDetails[cityId][item.index].effort !== 'high')
    .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.max(1, Math.min(kinds.length, count))).map(item => item.index).sort((a, b) => a - b);
}

function addMeals(day: PlannedDay, profile: Profile) {
  const meta = routeDetails[day.cityId][day.originalIndex];
  const fragments = day.meal.split(/[，；。]/).map(text => text.trim()).filter(Boolean);
  const forMeal = (pattern: RegExp) => fragments.filter(text => pattern.test(text) && !/港饼|麻糖|桂花糕|锅盔|茶点|小吃|伴手礼|米酒/.test(text)).join('；');
  const breakfast = forMeal(/早餐|早上|清早/), lunch = forMeal(/午餐|午间|供餐|船游携带|便携/), dinner = forMeal(/晚餐|晚上|回.*正餐/);
  const generalDish = fragments.filter(text => !/早餐|早上|清早|午餐|午间|晚餐|晚上|供餐|便携|船游携带|回.*正餐|港饼|麻糖|桂花糕|锅盔|茶点|小吃|伴手礼|米酒/.test(text)).join('；');
  day.breakfast = meta.breakfast || (breakfast ? `${meta.region}餐食线索：${breakfast}；具体供餐先确认。` : `${meta.region}的实际住宿片区安排早餐；供餐点与时间待确认。`);
  day.lunch = meta.lunch || (lunch ? `${meta.region}餐食线索：${lunch}；供餐位置和时段先落实。` : `${meta.region}游览途中，提前确认正规餐馆或景区供餐；未查询具体供餐点。`);
  day.dinner = meta.dinner || `${day.overnight.replace(/；.*/, '')}或实际返程片区就近吃正餐。${dinner || generalDish ? `已有餐食线索：${dinner || generalDish}。` : '餐馆与正常正餐供餐待确认，不以茶点或伴手礼替代。'}`;
  if (profile.interest === 'food') {
    const info = practical[day.cityId].food[meta.foodAreaIndex] || practical[day.cityId].food[0];
    day.meal = `早餐：${day.breakfast}\n午餐：${day.lunch}\n晚餐：${day.dinner}\n顺路觅食：${info.area}；${info.order} ${info.timing}`;
    if (meta.foodEvening) {
      day.stops[2] = { ...day.stops[2], title: meta.foodEvening, detail: `${day.dinner} ${day.stops[2].detail}` };
    }
  }
}

function applyArrival(day: PlannedDay, profile: Profile) {
  if (!profile.arrival || profile.arrival === 'full-day' || profile.arrival === 'previous-night') return;
  const from = profile.origin ? `从${profile.origin}出发，` : '';
  day.title = `${cityById[day.cityId].shortName} · ${profile.arrival === 'morning' ? '上午抵达与片区慢游' : '抵达缓冲：安顿与休息'}`;
  day.tip = profile.arrival === 'morning' ? '上午留给到达、行李与接驳；下午按实际余量在已有片区内活动，不把已移除的上午景点重新塞回行程。' : '抵达当天以行李、入住、正常用餐和休息为主；先落实接驳与供餐，不为补景点压缩安顿时间。';
  if (profile.group === 'family' || profile.group === 'senior') day.tip += ' 同行节奏：入住后先休息；儿童推车或无障碍通行条件提前向住宿与运营方核对。';
  if (profile.mobility === 'gentle') day.tip += ' 低强度安排不代表已核实无障碍，接驳、行李搬运与必要步行仍需确认。';
  day.stops[0] = { time: '上午 · 留给到达交通', title: `前往${cityById[day.cityId].shortName}与接驳`, detail: `${from}按已确认的车次或自驾路线进入目的地，留出到站、取行李及住宿接驳时间。首日上午原景点不再安排。` };
  day.breakfast = '出发地或途中安排早餐，具体供餐先确认。';
  if (profile.arrival === 'afternoon' || profile.arrival === 'evening') {
    day.region = `${cityById[day.cityId].shortName} · 住宿接驳片区`;
    day.effort = 'low';
    day.stops[1] = { time: profile.arrival === 'afternoon' ? '下午 · 抵达与安顿' : '下午 · 继续到达交通', title: profile.arrival === 'afternoon' ? '放行李、入住与休息' : '在途与住宿接驳', detail: profile.arrival === 'afternoon' ? '抵达后先放行李、办理入住并休息。仅在有余量时于住宿周边轻走，不保留原下午景点。' : '按实际车次或道路情况继续前往住宿地；原下午景点不再安排，不为赶点压缩接驳。' };
    day.lunch = '出发地或途中解决午餐；若已抵达，在实际接驳片区就近安排正餐。';
  }
  if (profile.arrival === 'evening') {
    day.stops[2] = { time: '晚间 · 入住与晚餐', title: '抵达住宿地，吃饭与休息', detail: '先确认住宿接驳、晚间入住和供餐，不再安排景点或临时远途夜游。' };
    day.dinner = '实际住宿片区提前确认晚餐；晚到需向住宿方确认供餐或准备便携餐食。';
  }
  day.transport = `${day.stops[0].detail} ${profile.arrival === 'morning' ? '下午在已有片区内按体力继续。' : '抵达当天以安顿为主。'}`;
  day.meal = `早餐：${day.breakfast}\n午餐：${day.lunch}\n晚餐：${day.dinner}`;
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
      const meta = routeDetails[city.id][originalIndex];
      const current = { ...day, cityId: city.id, originalIndex, overnight: practical[city.id].nights[originalIndex], region: meta.region, effort: meta.effort, title: `${city.shortName} · ${day.title}` } as PlannedDay;
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
  result.forEach((day, index) => {
    const next = result[index + 1], meta = routeDetails[day.cityId][day.originalIndex];
    if (/原酒店/.test(day.overnight)) day.overnight = `${practical[day.cityId].stays[meta.stayAreaIndex].area}（可连住，订前核对次日接驳）`;
    if (day.cityId === 'xianning') {
      day.overnight = day.originalIndex === 0 || (day.originalIndex === 1 && next?.originalIndex !== 2) ? '赤壁城区' : '咸宁温泉城区';
      if (day.originalIndex === 1 && next?.cityId === day.cityId && next.originalIndex === 2) day.stops[2] = { ...day.stops[2], title: '按已确认交通移宿咸宁温泉片区', detail: '次日在咸宁城区安排温泉与休息，今晚从赤壁按已确认交通前往咸宁住宿，避免次日再往返；先落实车辆、入住和晚间供餐。' };
    }
    if (day.cityId === 'shennongjia' && next?.cityId === day.cityId && next.originalIndex === 2) {
      day.overnight = '九湖镇 · 坪阡古镇周边（按次日大九湖换乘安排的编辑建议）';
      day.stops[2] = { ...day.stops[2], title: '按已确认车辆移宿坪阡', detail: '次日安排大九湖，可把今晚落脚处移到九湖镇坪阡古镇周边；提前确认车辆、路况、入住与供餐，不临时夜间穿山。' };
    }
    addMeals(day, profile);
    if (index === 0) {
      applyArrival(day, profile);
      if (profile.origin) day.transport = `出发地：${profile.origin}。请先确认往返目的地的车站、车次或自驾路线；本站未实时计算路程。 ${day.transport}`;
    }
  });
  return result;
}

export function getTripIssues(profile: Profile): string[] {
  const days = buildTrip(profile), issues: string[] = [];
  const high = days.filter(day => day.effort === 'high');
  if (profile.mobility === 'gentle' && high.length) issues.push(`这份路线仍包含高强度山地章节：${high.map(day => day.title).join('、')}；不满足减少高强度山地的条件，请换章节或改用单城路线。`);
  if (profile.mobility === 'gentle') issues.push('低强度与常规步行是编辑分类，仍可能有台阶、坡道和长距离步行；不代表已核实无障碍或全程可用推车。');
  if (profile.interest === 'nature' && days.length && !days.some(day => ['nature', 'water'].includes(practical[day.cityId].kinds[day.originalIndex]))) issues.push('现有已选章节没有对应的山水自然主线，玩法偏好尚未充分满足；可换城市或调整章节，不把文化或温泉章节当成已安排的山地游。');
  if (profile.arrival === 'morning' || profile.arrival === 'afternoon' || profile.arrival === 'evening') issues.push(`${arrivalLabels[profile.arrival]}，首日已给交通与安顿留时间，被移除的原景点没有自动补到其他时段。`);
  if (profile.origin && (!profile.arrival || profile.arrival === 'full-day')) issues.push(`出发地为${profile.origin}，当前按首日已有完整游玩时间安排；若当天仍需长途移动，请选择实际抵达时段。`);
  if (profile.arrival === 'previous-night') issues.push('提前抵达前夜已计入住宿预留；行程日期按首个游玩日计算，订房时另核对前一晚的入住日期。');
  const transfers = days.filter((day, index) => index > 0 && (day.cityId !== days[index - 1].cityId || day.region !== days[index - 1].region));
  if (transfers.length) issues.push(`跨日片区有变化：${transfers.slice(0, 3).map(day => day.region).join('、')}；住宿与次日出发入口须一起核对，不能按同一景区步行衔接。`);
  if (profile.mode === 'public') issues.push('公共交通方案未查询实际班次；山区、船游和跨县线路须先落实到达与返程接驳，再订不可退的后续行程。');
  if (profile.budgetLimit) {
    const totalLimit = profile.budgetLimit * (profile.budgetScope === 'per-person' ? profile.party : 1), minimum = estimateBudget(profile, days.length).total[0];
    if (totalLimit < minimum) issues.push(`填写的${profile.budgetScope === 'per-person' ? '每人' : '全团'}预算上限折合全团 ¥${totalLimit}，低于这份方案的基础预留 ¥${minimum}；尚未满足预算，需减少天数、调整条件或另核实实际费用。`);
  }
  return issues;
}
export function tripTitle(profile: Profile): string {
  return templates.find(t => t.id === profile.template)?.title || `${cityById[profile.cityId].shortName} · 我的 ${profile.indices.length} 天旅行`;
}
export function estimateBudget(profile: Profile, dayCount: number) {
  const rates = { value: { room: [180, 320], meal: [60, 100] }, comfort: { room: [320, 550], meal: [100, 160] }, boutique: { room: [550, 900], meal: [160, 240] } }[profile.budget];
  const arrivalNight = profile.arrival === 'previous-night' || (!profile.arrival && profile.template === 'custom' && profile.indices.length > 0 && Math.min(...profile.indices) > 0);
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
  if (profile.origin) lines.push(`出发地：${profile.origin}`);
  if (profile.arrival) lines.push(`抵达设置：${arrivalLabels[profile.arrival]}`);
  if (profile.mobility) lines.push(`步行条件：${mobilityLabels[profile.mobility]}`);
  if (profile.budgetLimit) lines.push(`预算上限：${profile.budgetScope === 'per-person' ? '每人' : '全团'} ¥${profile.budgetLimit}；预留额度不等于已匹配的实时报价。`);
  if (budget.arrivalNight) lines.push('抵达安排：所选路线从完整游玩日开始，建议提前一晚抵达；住宿预算已加这一晚。若当天抵达，请将首日上午改为交通并减少景点。', '');
  days.forEach((day, index) => {
    lines.push(`D${index + 1} ${planDate(profile.date, index)} | ${day.title}`, `所在片区：${day.region} · ${day.effort === 'high' ? '较高体力' : day.effort === 'moderate' ? '常规步行' : '低强度编辑建议'}`, ...day.stops.flatMap(stop => [`${stop.time}｜${stop.title}`, stop.detail]), `交通：${day.transport}`, `早餐：${day.breakfast}`, `午餐：${day.lunch}`, `晚餐：${day.dinner}`, `餐食：${day.meal}`, `当晚住宿：${index < days.length - 1 ? day.overnight : '返程日；如延住可参考：' + day.overnight}`, `提醒：${day.tip}`, '');
  });
  cityIds.forEach(id => { const city = cityById[id], info = practical[id]; lines.push(`【${city.shortName} · 住宿片区】`, ...info.stays.map(stay => `${stay.area}｜${stay.bestFor}。${stay.reason} ${stay.check}`), `【${city.shortName} · 吃什么、在哪吃】`, ...info.food.map(food => `${food.area}：${food.order} ${food.timing}`), `到达：${city.arrival}`, `季节：${city.season}`, '资料来源：', ...city.sources.map(source => `${source.title}：${source.url}`), ''); });
  const issues = getTripIssues(profile);
  if (issues.length) lines.push('【这份方案仍需确认】', ...issues.map(issue => `· ${issue}`), '');
  lines.push(`预算预留（全团）：¥${budget.total[0]}–${budget.total[1]}`, `按 ${budget.rooms} 间双人房、${budget.nights} 晚估算。住宿 ¥${budget.stay.join('–')}，餐食 ¥${budget.meals.join('–')}，当地交通预留 ¥${budget.transport.join('–')}，门票项目预留 ¥${budget.tickets.join('–')}。`, '以上是规划用额度，不是酒店或门票实时报价；不含往返大交通、跨城火车票、自驾租车费及超出预留的索道、船游等项目。', '自选章节可能影响跨天接驳；以实际到达时间、车船班次、天气和预约为准。', profile.note ? `我的备注：${profile.note}` : '', '', 'https://wander-ai-hubei.pages.dev/');
  return lines.join('\n');
}
export function sharePlanUrl(profile: Profile): string {
  const query = new URLSearchParams({ plan: profile.template, city: profile.cityId, days: profile.indices.join(','), date: profile.date, people: String(profile.party), group: profile.group, mode: profile.mode, budget: profile.budget, interest: profile.interest, pace: profile.pace });
  if (profile.origin) query.set('origin', profile.origin);
  if (profile.arrival) query.set('arrival', profile.arrival);
  if (profile.mobility) query.set('mobility', profile.mobility);
  if (profile.budgetLimit) query.set('budgetLimit', String(profile.budgetLimit));
  if (profile.budgetScope) query.set('budgetScope', profile.budgetScope);
  return `https://wander-ai-hubei.pages.dev/?${query}`;
}
export function parsePlanUrl(search: string): Profile | undefined {
  const query = new URLSearchParams(search);
  if (!query.has('plan')) return undefined;
  return normalizeProfile({ template: query.get('plan'), cityId: query.get('city'), indices: query.get('days')?.split(',').filter(Boolean).map(Number), date: query.get('date'), party: Number(query.get('people')), group: query.get('group'), mode: query.get('mode'), budget: query.get('budget'), interest: query.get('interest'), pace: query.get('pace'), ...(query.has('origin') ? { origin: query.get('origin') } : {}), ...(query.has('arrival') ? { arrival: query.get('arrival') } : {}), ...(query.has('mobility') ? { mobility: query.get('mobility') } : {}), ...(query.has('budgetLimit') ? { budgetLimit: Number(query.get('budgetLimit')) } : {}), ...(query.has('budgetScope') ? { budgetScope: query.get('budgetScope') } : {}) });
}
