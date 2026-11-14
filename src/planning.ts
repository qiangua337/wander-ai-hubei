import { cityById, type TripDay } from './data';
import { practical } from './data/practical';
import { railwayEntrySource, returnWalks, type ReturnSource } from './data/return-mornings';
import { routeDetails, type RouteEffort } from './data/route-details';
import { dayJourneys } from './data/day-journeys';
import { clockWindow, formatClock, manualTravelBuffer, normalizeClockInput, normalizeReturnLogistics, normalizeStation, parseClock, returnAreaLabel, returnBreakfastMinutes, returnBreakfastStart, type DepartureWindow, type ReturnLogistics, type StationSchedule } from './return-timing';
import { buildDaySchedule, renderScheduleText } from './day-schedule';
import { chapterKey, normalizeDayStarts, type DayStarts } from './day-starts';
import { planDate, selectPlanDays, validDate, type Pace } from './travel';
export { validDate } from './travel';

export type Profile = {
  cityId: string; template: string; indices: number[]; date: string; party: number;
  group: 'friends' | 'family' | 'senior' | 'solo'; mode: 'public' | 'drive';
  budget: 'value' | 'comfort' | 'boutique'; interest: 'balanced' | 'culture' | 'nature' | 'food';
  pace: Pace; note: string;
  origin?: string; arrival?: 'full-day' | 'morning' | 'afternoon' | 'evening' | 'previous-night';
  departure?: DepartureWindow; departureTime?: string; departureStation?: string; returnLogistics?: ReturnLogistics;
  dayStarts?: DayStarts;
  mobility?: 'standard' | 'gentle'; budgetLimit?: number; budgetScope?: 'total' | 'per-person';
};
export type PlannedDay = TripDay & {
  cityId: string; originalIndex: number; overnight: string; transfer?: string; region: string; effort: RouteEffort;
  breakfast?: string; lunch?: string; dinner?: string; sightseeingRemoved?: boolean;
  returnMorning?: { sight: string; conditional: boolean; minutes: number };
  stationSchedule?: StationSchedule;
  afternoonReturn?: { area?: string; stationMinutes: number; luggageMinutes: number; travelAllowance?: number };
  returnSources?: ReturnSource[];
};
export const templates = [
  { id: 'wuhan-weekend', title: '江城两日，刚刚好。', subtitle: '黄鹤楼、楚文化、东湖与一碗过早', label: '周末 · 2 天', cityId: 'wuhan', image: '/images/yellow-crane.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }] },
  { id: 'west-five', title: '沿着峡江，走进恩施。', subtitle: '宜昌—恩施—利川，山水与土家生活', label: '山水 · 5 天', cityId: 'enshi', image: '/images/enshi.jpg', segments: [{ cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
  { id: 'hubei-seven', title: '给湖北，完整的一周。', subtitle: '武汉—宜昌—恩施，城市与峡谷慢慢看', label: '经典跨城 · 7 天', cityId: 'yichang', image: '/images/xiling.jpg', segments: [{ cityId: 'wuhan', indices: [0, 1] }, { cityId: 'yichang', indices: [0, 1] }, { cityId: 'enshi', indices: [0, 1, 2] }] },
];
export const groupLabels = { friends: '朋友 / 情侣', family: '亲子出行', senior: '长辈同行', solo: '独自旅行' };
export const budgetLabels = { value: '轻装经济', comfort: '舒适优先', boutique: '品质度假' };
export const interestLabels = { balanced: '经典综合', culture: '历史人文', nature: '山水自然', food: '城市美食' };
export const arrivalLabels = { 'full-day': '从完整游玩日开始', morning: '首日上午抵达', afternoon: '首日下午抵达', evening: '首日晚间抵达', 'previous-night': '提前一晚抵达' };
export const departureLabels = { flexible: '返程时段待定', morning: '最后一天上午返程', afternoon: '最后一天下午返程', evening: '最后一天晚间返程' };
export function getDepartureLabel(profile: Pick<Profile, 'departure' | 'departureTime' | 'departureStation'>): string {
  const time = normalizeClockInput(profile.departureTime);
  const label = time ? `最后一天 ${time} 返程` : departureLabels[profile.departure || 'flexible'];
  return profile.departureStation ? `${label} · ${profile.departureStation}` : label;
}
export const mobilityLabels = { standard: '常规步行', gentle: '减少高强度山地' };
export function defaultProfile(cityId = 'wuhan', date = '', party = 2): Profile {
  const city = Object.hasOwn(cityById, cityId) ? cityById[cityId] : cityById.wuhan;
  return { cityId: city.id, template: 'custom', indices: city.days.map((_, i) => i).slice(0, 2), date, party, group: 'friends', mode: 'public', budget: 'comfort', interest: 'balanced', pace: 'classic', note: '' };
}
export function normalizeProfile(value: unknown, fallback = defaultProfile()): Profile {
  if (!value || typeof value !== 'object') return fallback;
  const v = value as Partial<Profile>;
  const cityId = typeof v.cityId === 'string' && Object.hasOwn(cityById, v.cityId) ? v.cityId : fallback.cityId;
  const template = templates.find(t => t.id === v.template);
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
  const departure = v.departure === undefined ? fallback.departure : v.departure;
  if (typeof departure === 'string' && Object.hasOwn(departureLabels, departure)) optional.departure = departure;
  const departureTime = normalizeClockInput(v.departureTime === undefined ? fallback.departureTime : v.departureTime);
  const departureMinutes = parseClock(departureTime);
  if (departureMinutes !== undefined) {
    optional.departureTime = departureTime;
    optional.departure = clockWindow(departureMinutes);
  }
  const station = normalizeStation(v.departureStation === undefined ? fallback.departureStation : v.departureStation);
  if (station) optional.departureStation = station;
  const returnLogistics = normalizeReturnLogistics(v.returnLogistics === undefined ? fallback.returnLogistics : v.returnLogistics, template?.segments.at(-1)?.cityId || cityId);
  if (returnLogistics) optional.returnLogistics = returnLogistics;
  const segments = template?.segments || [{ cityId, indices }];
  const chapters = new Set(segments.flatMap(segment => segment.indices.map(index => chapterKey(segment.cityId, index))));
  const dayStarts = normalizeDayStarts(v.dayStarts === undefined ? fallback.dayStarts : v.dayStarts, chapters);
  if (dayStarts) optional.dayStarts = dayStarts;
  const mobility = v.mobility === undefined ? fallback.mobility : v.mobility;
  if (mobility === 'standard' || mobility === 'gentle') optional.mobility = mobility;
  const budgetLimit = v.budgetLimit === undefined ? fallback.budgetLimit : v.budgetLimit;
  if (typeof budgetLimit === 'number' && Number.isFinite(budgetLimit) && budgetLimit > 0 && budgetLimit <= 1000000) optional.budgetLimit = budgetLimit;
  const budgetScope = v.budgetScope === undefined ? fallback.budgetScope : v.budgetScope;
  if (budgetScope === 'total' || budgetScope === 'per-person') optional.budgetScope = budgetScope;
  return {
    cityId, template: template?.id || 'custom', indices,
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
    day.sightseeingRemoved = true;
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

/** These urban morning chapters can remain before an evening departure, subject to actual connections. */
const returnMorningChapters: Record<string, number[]> = {
  wuhan: [0, 1, 2], yichang: [0], enshi: [0, 3], xiangyang: [0, 2], jingzhou: [0],
  ezhou: [0], huanggang: [0], xiaogan: [0, 1], suizhou: [0], qianjiang: [0], tianmen: [1],
};

function includesArrivalNight(profile: Profile): boolean {
  return profile.arrival === 'previous-night' || (!profile.arrival && profile.template === 'custom' && profile.indices.length > 0 && Math.min(...profile.indices) > 0);
}

export function getTripTimingConflict(profile: Profile): string | undefined {
  const template = templates.find(item => item.id === profile.template);
  const count = template ? template.segments.reduce((total, segment) => total + segment.indices.length, 0) : profile.indices.length;
  const phases = { morning: 1, afternoon: 2, evening: 3 };
  if (count !== 1 || !profile.arrival || !profile.departure || !(profile.arrival in phases) || !(profile.departure in phases)) return;
  if (phases[profile.departure as keyof typeof phases] <= phases[profile.arrival as keyof typeof phases]) return '同一天的返程时段不晚于抵达时段，无法按这两个时段排出行程。请选更晚的返程时段、提前抵达或增加天数。';
}

function applyAfternoonReturn(day: PlannedDay, profile: Profile, previous: PlannedDay | undefined, hasPriorStay: boolean) {
  const city = cityById[day.cityId];
  const station = normalizeStation(profile.departureStation);
  const byAir = station?.endsWith('机场');
  const departureTime = normalizeClockInput(profile.departureTime);
  const minutes = parseClock(departureTime);
  const lodging = previous?.cityId === day.cityId ? previous.overnight : practical[day.cityId].stays[0].area;
  const options = returnWalks[day.cityId] || [];
  const logistics = normalizeReturnLogistics(profile.returnLogistics, day.cityId);
  const suggestedArea = (!hasPriorStay && station ? options.find(option => Object.hasOwn(option.stationBuffers, station)) : undefined)
    || options.find(option => option.base.test(lodging));
  const nearby = logistics?.area ? options.find(option => option.id === logistics.area) : suggestedArea;
  const mapMinutes = logistics?.travelMinutes;
  const travelAllowance = mapMinutes !== undefined ? mapMinutes + manualTravelBuffer : station && nearby?.stationBuffers[station];
  const toStation = station && !byAir && typeof travelAllowance === 'number' ? travelAllowance : undefined;
  const luggageMinutes = logistics?.luggageMinutes ?? (hasPriorStay ? 20 : 15);
  const inStationMinutes = profile.group === 'senior' || profile.group === 'family' || profile.party >= 5 ? 75 : 60;
  const arrive = minutes !== undefined && toStation !== undefined ? minutes - inStationMinutes : undefined;
  const leave = arrive !== undefined && toStation !== undefined ? arrive - toStation : undefined;
  const finish = leave !== undefined ? leave - luggageMinutes : undefined;
  const available = finish === undefined ? undefined : finish - returnBreakfastStart - returnBreakfastMinutes;
  const defaultWalkFits = minutes === undefined || minutes >= 13 * 60 + 30;
  const walk = nearby && (!station || toStation !== undefined) && (available === undefined ? defaultWalkFits : available >= 15) ? nearby : undefined;
  const walkMinutes = walk ? (available !== undefined && available < walk.minutes ? 15 : walk.minutes) : undefined;
  const cutoff = finish !== undefined && finish >= 0 && leave !== undefined && arrive !== undefined
    ? { finishBy: formatClock(finish), leaveForStationBy: formatClock(leave), arriveBy: formatClock(arrive) }
    : undefined;
  const destination = station || '实际返程点';
  const bags = luggageMinutes === 0 ? '整理好随身行李。' : hasPriorStay ? '早上先退房并问清行李寄存。' : '带好随身行李，寄存时先确认取回地点。';
  const finishAction = luggageMinutes === 0 ? '结束上午安排' : '开始取行李';
  const goTitle = luggageMinutes === 0 ? `前往${destination}` : `取行李，前往${destination}`;
  const breakfast = finish !== undefined && finish < returnBreakfastStart + returnBreakfastMinutes
    ? '早点可前一晚备好或到站后吃，按倒推时间取行李和出发。'
    : nearby?.breakfast || '在住宿或接驳片区就近吃早餐，选出餐快的店。';

  day.title = `${city.shortName} · ${walk ? walk.sight + '后返程' : '早餐与返程接驳'}`;
  day.region = walk?.area || `${city.shortName} · 返程接驳`;
  day.effort = 'low';
  // The original full sightseeing chapter and ticket allowance are replaced even when there is an exterior walk.
  day.sightseeingRemoved = true;
  if (walk && walkMinutes !== undefined) day.returnMorning = { sight: walk.sight, conditional: !cutoff, minutes: walkMinutes };
  day.stationSchedule = cutoff;
  if (!byAir) day.afternoonReturn = { area: returnAreaLabel(logistics?.area, day.cityId) || nearby?.area, stationMinutes: inStationMinutes, luggageMinutes, travelAllowance: toStation };
  day.returnSources = [...(nearby?.sources || []), ...(byAir ? [] : [railwayEntrySource])];

  day.stops[0] = walk ? {
    time: `上午 · ${cutoff ? '约' : '可选约'} ${walkMinutes} 分钟`,
    title: walk.sight,
    detail: `${bags}${breakfast}${walkMinutes === 15 ? '只走街口或步道入口附近一小段，再按原路折返。' : walk.detail}${cutoff ? `建议最晚 ${cutoff.finishBy} ${finishAction}。` : '先确认车站和车程，余量足够再出发。'}`,
  } : {
    time: '上午 · 早餐和行李',
    title: `早餐与${byAir ? '机场接驳' : '返程准备'}`,
    detail: `${bags}${breakfast}${nearby && station && !byAir && toStation === undefined ? `住宿片区与${station}的接驳需先核对，上午先不跨区逛。` : ''}`,
  };
  day.stops[1] = cutoff ? {
    time: luggageMinutes === 0 ? `${cutoff.leaveForStationBy} 前出发` : `${cutoff.finishBy} 开始取行李 · ${cutoff.leaveForStationBy} 前出发`,
    title: goTitle,
    detail: `${luggageMinutes === 0 ? '携带随身行李直接出发。' : `取行李留 ${luggageMinutes} 分钟。`}${mapMinutes !== undefined ? `按你填的 ${mapMinutes} 分钟车程，另留 ${manualTravelBuffer} 分钟等车或换乘。` : `去站交通暂按 ${toStation} 分钟预留。`}出发前查地图上的实际路线、路况和进站口。需要更久就提前结束活动。`,
  } : {
    time: '离开街区前 · 核对接驳',
    title: goTitle,
    detail: byAir ? '先按航司要求确认值机、托运和安检时间，再往前留取行李与去机场的车程。'
      : `用发车时间倒推交通与取行李时间。乘火车可先留 ${inStationMinutes} 分钟进站候车，再看车站提示。自驾按实际停车和路况留余量。时间紧就缩短步行。`,
  };
  day.stops[2] = cutoff ? {
    time: `${cutoff.arriveBy} 前到站 · ${departureTime} 发车`,
    title: `${destination}安检与候车`,
    detail: `留约 ${inStationMinutes} 分钟进站、找检票口和候车。高峰期按车站提示再提前。`,
  } : {
    time: departureTime ? `下午 · ${departureTime} 返程` : '下午 · 按票面时刻返程',
    title: byAir ? '到机场后按要求办理乘机手续' : station ? '到站后安检与候车' : '按确认的方式返程',
    detail: byAir ? '以票面航站楼和航司通知为准。' : '乘车时核对出发站和进站口，按票面及车站公告预留时间。',
  };
  day.breakfast = breakfast;
  day.lunch = walk && (finish === undefined || finish >= 12 * 60 + 30)
    ? walk.lunch
    : '时间紧就把午餐带走，或到站后补给。按计划出发去车站。';
  day.dinner = '返程途中或抵达后用餐，按实际到达和供餐时间决定。';
  day.meal = `早餐：${day.breakfast}\n午餐：${day.lunch}\n晚餐：${day.dinner}`;
  day.transport = `${day.stops[1].detail} ${day.stops[2].detail}`;
  day.tip = walk
    ? '遇排队、下雨或车程变长时可以缩短或取消短逛。以票面、车站公告和当天交通为准。'
    : available !== undefined && available < 15 ? '按当前时间预留，上午以行李与接驳为主。' : '先落实行李与接驳。有余量时只在实际落脚处附近短走。';
}

function applyDeparture(day: PlannedDay, profile: Profile, singleDay: boolean, previous?: PlannedDay) {
  if (!profile.departure || profile.departure === 'flexible') return;
  const departure = profile.departure;
  const arrivalDay = singleDay && ['morning', 'afternoon', 'evening'].includes(profile.arrival || '');
  const hasPriorStay = !singleDay || includesArrivalNight(profile);
  if (departure === 'afternoon' && !arrivalDay && !day.transfer) {
    applyAfternoonReturn(day, profile, previous, hasPriorStay);
    return;
  }
  const preserveMorning = departure === 'evening' && !arrivalDay && !day.transfer && returnMorningChapters[day.cityId]?.includes(day.originalIndex);
  const originalMorning = day.stops[0];
  const fromArrival = arrivalDay ? originalMorning.detail.replace(/住宿接驳/g, '行李寄存与市内接驳') : '';
  day.title = `${cityById[day.cityId].shortName} · ${preserveMorning ? '上午片区游览，晚间返程' : '返程缓冲与交通衔接'}`;
  if (!preserveMorning) day.region = `${cityById[day.cityId].shortName} · ${hasPriorStay ? '住宿与返程接驳' : '返程接驳'}`;
  day.effort = preserveMorning ? day.effort : 'low';
  day.sightseeingRemoved = !preserveMorning;
  const baggage = hasPriorStay ? '先在住宿地退房并确认行李怎么取' : '带好随身行李，或确认临时寄存和取回时间';
  const connection = '乘车或乘机按票面核对站点、出发时刻与到站余量。自驾请按实际路线预留取车和休息时间。';
  day.stops[0] = preserveMorning ? originalMorning : arrivalDay ? { ...originalMorning, detail: fromArrival } : {
    time: departure === 'morning' ? '上午 · 取行李与返程' : '上午 · 休整与行李安排',
    title: departure === 'morning' ? '取行李，前往返程交通点' : '就近早餐，准备返程',
    detail: `${baggage}。${departure === 'morning' ? connection : '确认接驳后如有余量，可在落脚片区短暂活动。'}`,
  };
  day.stops[1] = {
    time: departure === 'morning' ? '下午 · 返程途中' : departure === 'afternoon' ? '下午 · 返程交通' : '下午 · 取行李与接驳',
    title: arrivalDay && profile.arrival === 'afternoon' ? '抵达后确认返程接驳' : departure === 'morning' ? '继续返程，途中用餐' : '取行李与返程接驳',
    detail: departure === 'morning' ? '根据实际到达时间安排午餐和休息。' : `${arrivalDay && profile.arrival === 'afternoon' ? '下午抵达后先落实接驳与行李寄存，当日往返不安排过夜入住。' : ''}${baggage}。${connection}原下午景点取消，给接驳留时间。`,
  };
  day.stops[2] = { time: '晚间 · 返程与休息', title: departure === 'evening' ? '按已确认班次或路线返程' : '返程后休息', detail: `${departure === 'evening' ? connection : '按实际到达时间安排休息。'}不固定安排目的地夜游或晚餐。` };
  if (!preserveMorning && !arrivalDay) day.breakfast = '落脚片区就近吃早餐。早班出发请提前确认供餐或准备便携早餐。';
  day.lunch = departure === 'morning' ? '返程途中或到达地安排午餐，按实际交通衔接确认供餐。' : '在取行李或返程接驳片区就近用餐，时间紧时提前准备便携餐食。';
  if (arrivalDay && profile.arrival === 'afternoon') day.lunch = '午餐优先在出发地或去程途中解决。抵达后按返程时间决定是否补给。';
  day.dinner = '返程途中或到达地安排晚餐，按实际到达和供餐时间确认。';
  day.meal = `早餐：${day.breakfast}\n午餐：${day.lunch}\n晚餐：${day.dinner}`;
  day.transport = `${fromArrival ? `${fromArrival} ` : ''}先确认取行李与接驳安排。${connection}`;
  const activityNote = preserveMorning ? '只保留城区上午活动。预约、排队或接驳不合适时可取消。' : '原景点已移除，留出返程时间。';
  const lodgingNote = hasPriorStay ? '前一晚的住宿请结合实际返程点选。住在山区时提前确认车辆。' : '当天没有住宿预留，如需寄存行李请核对费用与营业时间。';
  day.tip = `${activityNote}${lodgingNote}`;
  if (profile.mobility === 'gentle') day.tip += ' 取行李与换乘仍可能有台阶，通行条件需另行确认。';
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
      const journey = dayJourneys[city.id][originalIndex];
      const current: PlannedDay = { ...day, cityId: city.id, originalIndex, overnight: journey.night, region: meta.region, effort: meta.effort, title: `${city.shortName} · ${day.title}` };
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
    const next = result[index + 1];
    const returnNext = next && index === result.length - 2 && profile.departure && profile.departure !== 'flexible';
    if (day.cityId === 'xianning') {
      day.overnight = day.originalIndex === 0 || (day.originalIndex === 1 && (next?.originalIndex !== 2 || returnNext)) ? '赤壁城区' : '咸宁温泉城区';
      if (day.originalIndex === 1 && !returnNext && next?.cityId === day.cityId && next.originalIndex === 2) day.stops[2] = { ...day.stops[2], title: '按已确认交通移宿咸宁温泉片区', detail: '次日在咸宁城区安排温泉与休息，今晚从赤壁按已确认交通前往咸宁住宿，避免次日再往返；先落实车辆、入住和晚间供餐。' };
    }
    if (day.cityId === 'enshi' && day.originalIndex === 3 && index > 0) day.overnight = result[index - 1].overnight;
    if (day.cityId === 'shennongjia' && !returnNext && next?.cityId === day.cityId && next.originalIndex === 2) {
      day.overnight = '九湖镇 · 坪阡古镇周边（按次日大九湖换乘安排的编辑建议）';
      day.stops[2] = { ...day.stops[2], title: '按已确认车辆移宿坪阡', detail: '次日安排大九湖，可把今晚落脚处移到九湖镇坪阡古镇周边；提前确认车辆、路况、入住与供餐，不临时夜间穿山。' };
    } else if (day.cityId === 'shennongjia' && returnNext && day.originalIndex === 1 && next.originalIndex === 2) {
      day.overnight = '木鱼镇或靠近已确认返程站点的片区';
    }
    addMeals(day, profile);
    if (day.cityId === 'wuhan' && day.originalIndex === 2 && result[index - 1]?.overnight.includes('武昌')
      && (next || !profile.departure || profile.departure === 'flexible' || profile.departure === 'evening')) {
      day.title = '武汉 · 汉口老街、江汉关与江滩';
      day.region = '汉口 · 江汉路与沿江';
      day.breakfast = '先在武昌住处附近吃早餐，再过江；糊汤粉可以留到汉口午餐。';
      day.lunch = '江汉关与沿江一带就近吃糊汤粉或家常简餐。';
      day.dinner = '汉口江汉路附近吃家常晚餐。';
      day.meal = `早餐：${day.breakfast}\n午餐：${day.lunch}\n晚餐：${day.dinner}`;
      day.stops[1] = { ...day.stops[1], title: '汉口江滩', detail: '走同一岸的街巷和江滩。轻松游可以把江滩缩成一小段。' };
      day.stops[2] = { ...day.stops[2], title: '汉口晚餐与休息', detail: '在汉口吃晚饭。需要回武昌取行李时，预留返程地铁。' };
      day.transport = (profile.mode === 'drive' ? '自驾先确认汉口停车点，再步行串联江汉路、江汉关和江滩。' : '从武昌搭地铁到汉口，江汉路、江汉关和江滩步行串联。') + '晚上按住宿或返程站点决定是否回武昌。';
      day.tip = '喜欢晴川阁或古琴台，可以把它留给另一段汉阳路线。 ' + day.tip;
    } else if (day.cityId === 'wuhan' && day.originalIndex === 2) {
      day.stops[2] = { ...day.stops[2], title: '汉阳晚餐与休息', detail: '过江游览后就在汉阳吃饭；若酒店或车票在汉口，先安排接驳与取行李。' };
    }
    if (index === 0) {
      applyArrival(day, profile);
      if (profile.origin) day.transport = `出发地：${profile.origin}。请先确认往返目的地的车站、车次或自驾路线；本站未实时计算路程。 ${day.transport}`;
    }
  });
  if (result.length) {
    const last = result[result.length - 1];
    const previous = result.at(-2);
    if (last.transfer && profile.departure && profile.departure !== 'flexible') {
      last.title = `${cityById[last.cityId].shortName} · 跨城与返程接驳`;
      last.effort = 'low';
      last.sightseeingRemoved = true;
      last.stops[1] = { time: '抵达后', title: '确认行李与下一段返程接驳', detail: '先核对下一程车站、进站口与票面时间，必要时就近补给。' };
      last.stops[2] = { time: profile.departureTime || '按票面', title: '按票面返程', detail: '两段交通之间预留足够换站、候车与取行李时间。' };
      last.transport = `${last.stops[0].detail} ${last.stops[1].detail} ${last.stops[2].detail}`;
    } else {
      applyDeparture(last, profile, result.length === 1, previous);
    }
  }
  return result;
}

export function getTripIssues(profile: Profile): string[] {
  const days = buildTrip(profile), issues: string[] = [];
  const timingConflict = getTripTimingConflict(profile);
  if (timingConflict) issues.push(timingConflict);
  const high = days.filter(day => day.effort === 'high');
  if (profile.mobility === 'gentle' && high.length) issues.push(`这份路线仍包含高强度山地章节：${high.map(day => day.title).join('、')}；不满足减少高强度山地的条件，请换章节或改用单城路线。`);
  if (profile.mobility === 'gentle') issues.push('低强度与常规步行是编辑分类，仍可能有台阶、坡道和长距离步行；不代表已核实无障碍或全程可用推车。');
  if (profile.interest === 'nature' && days.length && !days.some((day, index) => !day.sightseeingRemoved &&
    ['nature', 'water'].includes(practical[day.cityId].kinds[day.originalIndex]) && !wasVisitSkipped(days, index, profile))) {
    issues.push('现有已选章节没有对应的山水自然主线，玩法偏好尚未充分满足；可换城市或调整章节，不把文化或温泉章节当成已安排的山地游。');
  }
  if (!timingConflict && profile.departure && profile.departure !== 'flexible') {
    const last = days.at(-1);
    const activity = last?.returnMorning ? '上午是同片区短逛，可视接驳时间缩短。' : '';
    const budgetNote = last?.sightseeingRemoved ? '返程日预算保留餐食与当地交通。' : '';
    const connection = last?.stationSchedule ? '已倒排出发和到站时间。' : '按票面和实际车程核对行李与接驳时间。';
    issues.push(`${getDepartureLabel(profile)}。${connection}${activity}${budgetNote}`);
  }
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
function wasVisitSkipped(days: PlannedDay[], index: number, profile: Profile): boolean {
  const day = days[index];
  return Boolean(profile.dayStarts?.[chapterKey(day.cityId, day.originalIndex)])
    && Boolean(buildDaySchedule(day, profile, days[index - 1], index === days.length - 1).mainVisitSkipped);
}
export function estimateBudget(profile: Profile, dayCount: number) {
  const rates = { value: { room: [180, 320], meal: [60, 100] }, comfort: { room: [320, 550], meal: [100, 160] }, boutique: { room: [550, 900], meal: [160, 240] } }[profile.budget];
  const arrivalNight = includesArrivalNight(profile);
  const nights = Math.max(0, dayCount - 1) + (arrivalNight ? 1 : 0), rooms = Math.ceil(profile.party / 2), vehicles = Math.ceil(profile.party / 4);
  const stay = rates.room.map(rate => rate * nights * rooms);
  const meals = rates.meal.map(rate => rate * profile.party * dayCount);
  const transport = (profile.mode === 'drive' ? [160, 260].map(rate => rate * vehicles) : [40, 90].map(rate => rate * profile.party)).map(rate => rate * dayCount);
  const scheduledReturn = profile.departure && profile.departure !== 'flexible';
  const days = scheduledReturn || profile.dayStarts ? buildTrip(profile) : [];
  const noTicketDays = days.filter((day, index) => (scheduledReturn && index === days.length - 1 && day.sightseeingRemoved)
    || wasVisitSkipped(days, index, profile)).length;
  const ticketDays = Math.max(0, dayCount - noTicketDays);
  const tickets = [100, 250].map(rate => rate * profile.party * ticketDays);
  return { nights, rooms, arrivalNight, ticketDays, roomRange: rates.room, stay, meals, transport, tickets, total: [0, 1].map(i => stay[i] + meals[i] + transport[i] + tickets[i]) };
}
export function formatDetailedPlan(profile: Profile): string {
  const days = buildTrip(profile), budget = estimateBudget(profile, days.length);
  const cityIds = [...new Set(days.map(day => day.cityId))];
  const lines = ['Wander AI · 寻游湖北', tripTitle(profile), `${profile.date || '日期待定'} · ${profile.party} 人 · ${groupLabels[profile.group]} · ${profile.mode === 'drive' ? '自驾' : '公共交通＋接驳'} · ${budgetLabels[profile.budget]}`, '时间为路线规划预留。车船班次、景区开放与实际路况请以票面及出发当天的官方信息为准。', ''];
  if (profile.origin) lines.push(`出发地：${profile.origin}`);
  if (profile.arrival) lines.push(`抵达设置：${arrivalLabels[profile.arrival]}`);
  if (profile.departure || profile.departureStation) lines.push(`返程设置：${getDepartureLabel(profile)}`);
  const returnArea = days.at(-1)?.afternoonReturn?.area;
  if (returnArea) lines.push(`返程落脚片区：${returnArea}`);
  if (profile.mobility) lines.push(`步行条件：${mobilityLabels[profile.mobility]}`);
  if (profile.budgetLimit) lines.push(`预算上限：${profile.budgetScope === 'per-person' ? '每人' : '全团'} ¥${profile.budgetLimit}；预留额度不等于已匹配的实时报价。`);
  if (budget.arrivalNight) lines.push('抵达安排：所选路线从完整游玩日开始，建议提前一晚抵达；住宿预算已加这一晚。若当天抵达，请将首日上午改为交通并减少景点。', '');
  days.forEach((day, index) => {
    const isLast = index === days.length - 1;
    const schedule = buildDaySchedule(day, profile, days[index - 1], isLast);
    const lodging = isLast && profile.departure && profile.departure !== 'flexible'
      ? `返程安排：${getDepartureLabel(profile)}，当晚无住宿预留。`
      : `当晚住宿：${isLast ? '返程日。如延住可参考 ' : ''}${day.overnight}`;
    lines.push(`D${index + 1} ${planDate(profile.date, index)} | ${schedule.title || day.title}`,
      ...(schedule.mainVisitSkipped ? [`所在片区：${schedule.from}周边`] : [`所在片区：${day.region} · ${day.effort === 'high' ? '较高体力' : day.effort === 'moderate' ? '常规步行' : '低强度编辑建议'}`]),
      ...renderScheduleText(schedule),
      ...(day.stationSchedule ? [`去站安排：${day.stationSchedule.leaveForStationBy} 前出发，${day.stationSchedule.arriveBy} 前到站。`] : []),
      ...(!schedule.title ? [`交通补充：${day.transport}`, `提醒：${day.tip}`] : []),
      lodging, ...schedule.sources.map(source => `${source.title}：${source.url}`), '');
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
  if (profile.departure) query.set('departure', profile.departure);
  if (profile.departureTime) query.set('departureTime', profile.departureTime);
  if (profile.departureStation) query.set('departureStation', profile.departureStation);
  for (const [key, time] of Object.entries(normalizeDayStarts(profile.dayStarts) || {})) query.append('start', `${key}@${time}`);
  const logistics = profile.returnLogistics;
  if (logistics?.area) query.set('returnArea', logistics.area);
  if (logistics?.travelMinutes !== undefined) query.set('returnTravel', String(logistics.travelMinutes));
  if (logistics?.luggageMinutes !== undefined) query.set('returnLuggage', String(logistics.luggageMinutes));
  if (profile.mobility) query.set('mobility', profile.mobility);
  if (profile.budgetLimit) query.set('budgetLimit', String(profile.budgetLimit));
  if (profile.budgetScope) query.set('budgetScope', profile.budgetScope);
  return `https://wander-ai-hubei.pages.dev/?${query}`;
}
export function parsePlanUrl(search: string): Profile | undefined {
  const query = new URLSearchParams(search);
  if (!query.has('plan')) return undefined;
  const dayStarts = Object.fromEntries(query.getAll('start').map(value => value.split('@', 2)).filter(parts => parts.length === 2));
  return normalizeProfile({ template: query.get('plan'), cityId: query.get('city'), indices: query.get('days')?.split(',').filter(Boolean).map(Number), date: query.get('date'), party: Number(query.get('people')), group: query.get('group'), mode: query.get('mode'), budget: query.get('budget'), interest: query.get('interest'), pace: query.get('pace'), ...(query.has('origin') ? { origin: query.get('origin') } : {}), ...(query.has('arrival') ? { arrival: query.get('arrival') } : {}), ...(query.has('departure') ? { departure: query.get('departure') } : {}), departureTime: query.get('departureTime'), departureStation: query.get('departureStation'), dayStarts, returnLogistics: { area: query.get('returnArea'), travelMinutes: query.get('returnTravel'), luggageMinutes: query.get('returnLuggage') }, ...(query.has('mobility') ? { mobility: query.get('mobility') } : {}), ...(query.has('budgetLimit') ? { budgetLimit: Number(query.get('budgetLimit')) } : {}), ...(query.has('budgetScope') ? { budgetScope: query.get('budgetScope') } : {}) });
}
