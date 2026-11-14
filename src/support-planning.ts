import { cityById } from './data';
import { buildTrip, defaultProfile, estimateBudget, normalizeProfile, recommendConstrainedDays, templates, validDate, groupLabels, interestLabels, budgetLabels, arrivalLabels, departureLabels, getDepartureLabel, getTripTimingConflict, type Profile } from './planning';
import { returnWalks } from './data/return-mornings';
import { clockWindow, formatClock, normalizeReturnLogistics, normalizeStation, parseClock, readReturnMinutes, type ReturnLogistics } from './return-timing';
import type { SupportAction, SupportContext, SupportReply } from './support';

export type SupportTripDraft = {
  cityIds?: string[]; days?: number; party?: number;
  group?: Profile['group']; mode?: Profile['mode']; budget?: Profile['budget'];
  interest?: Profile['interest']; pace?: Profile['pace']; date?: string; note?: string;
  origin?: string; arrival?: Profile['arrival']; departure?: Profile['departure']; mobility?: Profile['mobility']; budgetLimit?: number; budgetScope?: Profile['budgetScope'];
  departureTime?: string; departureStation?: string; returnLogistics?: ReturnLogistics;
  awaiting?: 'city' | 'days' | 'party' | 'budget-scope' | 'mobility' | 'arrival' | 'departure';
};

function cleanOrigin(value: string): string {
  const text = value.trim().replace(/^(?:我|我们|计划|准备)(?:在|从)?/, '').trim();
  if (/号|小区|栋|单元|门牌|房间|住址/.test(text)) return text.match(/^(.{1,12}?市)/)?.[1] || '';
  return text.slice(0, 24);
}

/** Departure information is not another sightseeing destination. Keep only a city-level label. */
export function extractTripOrigin(question: string): { origin?: string; question: string } {
  const match = question.match(/从\s*([^，,。；;\n]{1,100}?)\s*(?:出发|启程|动身)/)
    || question.match(/(?:出发地|出发城市|起点)\s*(?:改为|改成|换成|是|为|[:：])?\s*([^，,。；;\n]{1,100})/);
  if (!match) return { question };
  const origin = cleanOrigin(match[1]);
  return { ...(origin ? { origin } : {}), question: question.replace(match[0], '') };
}

const cityActionForDraft = (cityId: string): SupportAction => ({ kind: 'city', cityId, label: `看${cityById[cityId].shortName}的实际攻略` });

function originIsInCity(origin: string, cityId: string): boolean {
  const city = cityById[cityId];
  const aliases = [city.name, city.shortName, city.shortName.replace(/州$/, ''), ...(cityId === 'wuhan' ? ['汉口', '武昌', '汉阳', '江城'] : [])];
  return aliases.some(alias => origin.startsWith(alias));
}

const countPattern = '-?\\d+(?:\\.\\d+)?|[零〇一二两三四五六七八九十百]{1,5}';
const numberValue = (text: string) => {
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const digits: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  let result = 0, current = 0;
  for (const character of text) {
    if (character === '百') { result += (current || 1) * 100; current = 0; }
    else if (character === '十') { result += (current || 1) * 10; current = 0; }
    else current = digits[character] ?? 0;
  }
  return result + current;
};

const returnPeriods = '凌晨|上午|早上|早晨|中午|午后|下午|傍晚|晚上|晚间|夜里';
const clockNumber = '(?:\\d{1,2}|[零〇一二两三四五六七八九十]{1,3})';
const returnClock = `(?:\\d{1,2}[:：]\\d{2}|${clockNumber}点(?:半|一刻|三刻|${clockNumber}分|\\d{2}(?!\\d)|[一二三四五]?十[一二三四五六七八九]?)?)`;
const returnTime = `(?:(?:${returnPeriods})(?:\\s*${returnClock})?|${returnClock})`;
const returnVerbs = '返程|回程|返航|回家|回去|返回|离开|回(?!答|复|头|访|顾|来|到点)(?:[\\u4e00-\\u9fff]{2}|\\s*$)';
const lastDayMarker = /最后(?:一)?天|末日|返程日|第(?:\d{1,2}|[一二两三四五六七八九十]{1,3})(?:天|日)/;
const namedStation = '[\\u4e00-\\u9fff]{1,16}?(?:站|机场)';
const returnStationAssignment = new RegExp(`(?:返程(?:车)?站|乘车站|上车站)\\s*(?:改到|改成|改为|换成|是|为|在|[:：])?\\s*(${namedStation})`);
const shortRouteStations = [...new Set(Object.values(returnWalks).flatMap(walks => (walks || []).flatMap(walk => Object.keys(walk.stationBuffers))))];
const knownReturnStation = new RegExp([...shortRouteStations, '利川站', '神农架站'].map(station => `${station.slice(0, -1)}(?:火车|高铁)?站`).sort((a, b) => b.length - a.length).join('|'));
const bareReturnTime = new RegExp(`^${returnTime}$`);

function returnWindow(time: string): Pick<SupportTripDraft, 'departure' | 'departureTime'> {
  const period = time.match(new RegExp(`^(?:${returnPeriods})`))?.[0] || '';
  const text = time.slice(period.length).trim();
  const dayPart = /凌晨|上午|早上|早晨/.test(period) ? 'morning'
    : /中午|午后|下午/.test(period) ? 'afternoon' : period ? 'evening' : undefined;
  if (!text) return { departure: dayPart };
  const clock = text.match(/^(\d{1,2})[:：](\d{2})$/);
  const point = text.match(new RegExp(`^(${clockNumber})点(.*)$`));
  if (!clock && !point) return {};
  let hours = clock ? Number(clock[1]) : numberValue(point![1]);
  const suffix = point?.[2] || '';
  const minutes = clock ? Number(clock[2]) : ({ 半: 30, 一刻: 15, 三刻: 45 }[suffix] ?? numberValue(suffix.replace(/分$/, '')));
  if (hours > 23 || minutes > 59 || (!period && !clock && hours >= 1 && hours <= 12)) return {};
  if (dayPart && dayPart !== 'morning' && hours > 0 && hours < 12) hours += 12;
  else if (period === '凌晨' && hours === 12) hours = 0;
  const departure = clockWindow(hours * 60 + minutes);
  if (dayPart && departure !== dayPart && !(period === '傍晚' && hours === 17)) return {};
  return { departure, departureTime: formatClock(hours * 60 + minutes) };
}

/** A timed return clause describes travel home, not another city to visit or a new local transport preference. */
export function readReturnTiming(question: string, hasTrip = false) {
  let departure: Profile['departure'];
  let departureTime: string | undefined;
  let departureStation: string | null | undefined;
  let needsWindow = false;
  let dayNumber: number | undefined;
  const parts = question.split(/([，,。；;！!？?\n])/);
  // "下午三点，武昌站返程" is one return instruction when the following clause explicitly names the station.
  for (let i = 0; i + 2 < parts.length; i += 2) {
    if (!bareReturnTime.test(parts[i].trim()) || !/^[，,]$/.test(parts[i + 1])) continue;
    if (!knownReturnStation.test(parts[i + 2]) || !new RegExp(`${returnVerbs}|发车|走(?:了|吧)?\\s*$`).test(parts[i + 2])) continue;
    parts.splice(i, 3, `${parts[i]} ${parts[i + 2]}`);
  }
  const remaining = parts.map(part => {
    const clear = part.match(/返程(?:时间|时段)?(?:待定|不确定|未定)|取消返程(?:时间|时段|限制)|先不填返程|不限制返程/);
    if (clear?.index !== undefined) {
      departure = 'flexible'; departureTime = undefined; needsWindow = false; dayNumber = undefined;
      return part.slice(0, clear.index);
    }
    const clearStation = part.match(/(?:返程(?:车)?站|上车站)(?:待定|不确定|未定)|取消返程(?:车)?站/);
    if (clearStation?.index !== undefined) {
      departureStation = null;
      return part.slice(0, clearStation.index);
    }
    const marker = part.match(lastDayMarker);
    const start = marker?.index ?? 0;
    const clause = part.slice(start).replace(new RegExp(`(?:不是|不在|不要|不想|不打算)\\s*${returnTime}`, 'g'), match => ' '.repeat(match.length));
    const assignment = clause.match(returnStationAssignment);
    const known = clause.match(knownReturnStation);
    const specified = clause.match(new RegExp(`(?:从|在|由)(${namedStation})(?=\\s*(?:返程|回|走|坐|乘|\\d|上午|下午|晚上|$))`));
    const station = normalizeStation(assignment?.[1] || specified?.[1] || known?.[0]);
    const returnContext = hasTrip || Boolean(marker || departure);
    const arriving = /抵达|到达|到(?:了)?\s*[\u4e00-\u9fff]{1,16}(?:站|机场)/.test(clause);
    const stationShorthand = station && returnContext && known && !arriving;
    const action = `(?:${returnVerbs}${marker && !arriving ? '|高铁|火车|航班|飞机' : ''}${station ? '|发车' : ''}${stationShorthand ? `|${known[0]}` : ''}${returnContext ? '|走(?:了|吧)?\\s*$' : ''})`;
    const before = Array.from(clause.matchAll(new RegExp(`${returnTime}(?=[^。；]{0,14}${action})`, 'g'))).at(-1);
    const after = before ? null : clause.match(new RegExp(`${action}[^\\d。；]{0,10}?(${returnTime})`));
    const time = before?.[0] || after?.[1];
    if (!time && !assignment && !(station && (new RegExp(returnVerbs).test(clause) || (returnContext && /走(?:了|吧)?\s*$/.test(clause))))) return part;
    if (station) departureStation = station;
    else if (time && /乘机|飞机|航班|机场/.test(clause)) departureStation = '机场';
    if (time) {
      ({ departure, departureTime } = returnWindow(time));
      needsWindow = !departure;
      const numbered = marker?.[0].match(/^第(.+)[天日]$/);
      dayNumber = numbered ? numberValue(numbered[1]) : undefined;
    }
    const matchIndex = before?.index ?? after?.index ?? clause.length;
    const stationIndex = assignment?.index ?? specified?.index ?? known?.index ?? clause.length;
    return part.slice(0, marker ? start : Math.min(matchIndex, stationIndex));
  }).join('');
  return { departure, departureTime, departureStation, needsWindow, dayNumber, remaining };
}

export function copyTripDraft(value?: SupportTripDraft): SupportTripDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const draft: SupportTripDraft = {};
  if (Array.isArray(value.cityIds)) draft.cityIds = [...new Set(value.cityIds.filter(id => typeof id === 'string'))];
  for (const key of ['days', 'party', 'group', 'mode', 'budget', 'interest', 'pace', 'date', 'awaiting', 'arrival', 'departure', 'departureTime', 'departureStation', 'mobility', 'budgetLimit', 'budgetScope'] as const) {
    if (value[key] !== undefined) Object.assign(draft, { [key]: value[key] });
  }
  if (typeof value.note === 'string') draft.note = value.note.trim().slice(0, 500);
  if (typeof value.origin === 'string') draft.origin = cleanOrigin(value.origin);
  const routeTemplate = templates.find(template => template.segments.length === draft.cityIds?.length && template.segments.every(segment => draft.cityIds?.includes(segment.cityId)));
  const lastCity = routeTemplate?.segments.at(-1)?.cityId || draft.cityIds?.at(-1);
  if (lastCity && Object.hasOwn(cityById, lastCity)) {
    const logistics = normalizeReturnLogistics(value.returnLogistics, lastCity);
    if (logistics) draft.returnLogistics = logistics;
  }
  return draft;
}

function suggestionsFor(draft: SupportTripDraft): string[] {
  if (draft.awaiting === 'budget-scope') return ['预算按全团总额', '预算按每人计算', '取消预算上限'];
  if (draft.awaiting === 'mobility') return ['少台阶', '可以接受山地活动'];
  if (draft.awaiting === 'arrival') return ['首日上午抵达', '首日下午抵达', '提前一晚抵达'];
  if (draft.awaiting === 'departure') return ['最后一天上午返程', '最后一天下午返程', '最后一天晚上返程'];
  if (draft.awaiting === 'city') {
    const choices = [
      { text: '想去武汉', cityIds: ['wuhan'], days: cityById.wuhan.days.length, fixed: false },
      { text: '想去恩施', cityIds: ['enshi'], days: cityById.enshi.days.length, fixed: false },
      { text: '想去宜昌和恩施', cityIds: ['yichang', 'enshi'], days: 5, fixed: true },
      { text: '想去宜昌', cityIds: ['yichang'], days: cityById.yichang.days.length, fixed: false },
      { text: '想去武汉宜昌和恩施', cityIds: ['wuhan', 'yichang', 'enshi'], days: 7, fixed: true },
    ].filter(choice => !(choice.cityIds.length === draft.cityIds?.length && choice.cityIds.every(id => draft.cityIds?.includes(id))) && (draft.days === undefined || (Number.isInteger(draft.days) && draft.days > 0 && (choice.fixed ? draft.days === choice.days : draft.days <= choice.days))));
    return choices.length ? choices.slice(0, 3).map(choice => choice.text) : ['改成3天，想去武汉', '改成4天，想去恩施', '改成7天，想去武汉宜昌和恩施'];
  }
  const cityIds = (draft.cityIds || []).filter(id => Object.hasOwn(cityById, id));
  const template = cityIds.length > 1 ? templates.find(item => item.segments.length === cityIds.length && item.segments.every(segment => cityIds.includes(segment.cityId))) : undefined;
  const maximum = template ? template.segments.reduce((total, segment) => total + segment.indices.length, 0) : cityIds.length === 1 ? recommendConstrainedDays(cityIds[0], cityById[cityIds[0]].days.length, draft.interest || 'balanced', draft.mobility).length : 3;
  if (draft.awaiting === 'days') return (template ? [maximum] : Array.from({ length: maximum }, (_, index) => index + 1)).filter(days => days !== draft.days).slice(0, 3).map(days => `改成${days}天`);
  const effectiveGroup = draft.group || (draft.party === 1 ? 'solo' : 'friends');
  if (draft.awaiting === 'party') return [
    { text: draft.group === 'solo' ? '2人，朋友同行' : '2人一起', party: 2, group: draft.group === 'solo' ? 'friends' : effectiveGroup },
    { text: '2大1小，亲子轻松', party: 3, group: 'family' },
    { text: '我一个人', party: 1, group: 'solo' },
  ].filter(item => item.party !== draft.party || item.group !== effectiveGroup).map(item => item.text);
  const days = !template && cityIds.length === 1 && maximum > 1 && draft.days !== undefined ? (draft.days < maximum ? draft.days + 1 : draft.days - 1) : undefined;
  const party = draft.party === 6 ? 5 : (draft.party || 1) + 1;
  const relaxed = draft.pace ? draft.pace === 'relaxed' : draft.mobility === 'gentle' || effectiveGroup === 'family' || effectiveGroup === 'senior';
  return [
    days ? `改成${days}天` : `改成${party}人${effectiveGroup === 'solo' ? '，朋友同行' : ''}`,
    draft.mode === 'drive' ? '改为公共交通' : '换成自驾',
    relaxed ? '改为经典节奏' : '想轻松一点',
    draft.departure && draft.departure !== 'flexible' ? '返程时段待定' : '最后一天下午返程',
  ];
}

function tripReply(text: string, draft: SupportTripDraft, actions: SupportAction[] = [], plan?: Profile): SupportReply {
  const cityIds = (draft.cityIds || []).filter(id => Object.hasOwn(cityById, id));
  const sources = [...new Map(cityIds.flatMap(id => cityById[id].sources.slice(0, 2)).map(source => [source.url, { ...source }])).values()];
  return {
    text, actions, sources, suggestions: suggestionsFor(draft),
    context: { ...(cityIds.length === 1 ? { cityId: cityIds[0] } : {}), trip: copyTripDraft(draft) },
    ...(plan ? { plan } : {}),
  };
}

/** Shared validation and construction for the chat and its structured quick-planning form. */
export function planSupportTrip(input: SupportTripDraft): SupportReply {
  const draft = copyTripDraft(input);
  const explore: SupportAction[] = [{ kind: 'explore', label: '按市探索目的地' }];
  if (typeof input?.origin === 'string' && input.origin.trim() && !draft.origin) return tripReply('出发地只需要城市名称，不需要街道、门牌或详细住址。请改填出发城市后再整理。', draft);
  if (draft.cityIds?.some(id => !Object.hasOwn(cityById, id))) return tripReply('目前只能整理本站收录的湖北目的地。请重新选一座湖北城市。', { ...draft, cityIds: [], awaiting: 'city' }, explore);
  if (!draft.cityIds?.length) return tripReply('先告诉我想去湖北哪座城市？也可以选宜昌＋恩施或武汉＋宜昌＋恩施的经典跨城主线。天数、人数和偏好会一起保留。', { ...draft, awaiting: 'city' }, explore);
  const cityIds = draft.cityIds;
  const template = cityIds.length > 1 ? templates.find(item => item.segments.length === cityIds.length && item.segments.every(segment => cityIds.includes(segment.cityId))) : undefined;
  if (cityIds.length > 1 && !template) return tripReply(`本站尚未整理${cityIds.map(id => cityById[id].shortName).join('、')}的完整跨城模板，不能直接拼出可靠接驳。可以先选其中一座城市，或换成宜昌＋恩施、武汉＋宜昌＋恩施。`, { ...draft, awaiting: 'city' }, explore);
  const maximum = template ? template.segments.reduce((total, segment) => total + segment.indices.length, 0) : cityById[cityIds[0]].days.length;
  if (draft.days === undefined) return tripReply(`这趟准备玩几天？${template ? `所选跨城主线固定为 ${maximum} 天。` : `${cityById[cityIds[0]].shortName}现有 1–${maximum} 天编辑章节可选。`}接着告诉我人数，我就把吃住交通一起安排。`, { ...draft, awaiting: 'days' });
  if (!Number.isInteger(draft.days) || draft.days < 1) return tripReply('游玩天数请填正整数，至少安排 1 天；半日景点可以先在攻略中比较。', { ...draft, awaiting: 'days' });
  if ((template && draft.days !== maximum) || draft.days > maximum) return tripReply(template
    ? `你希望玩 ${draft.days} 天；这条跨城编辑主线固定为 ${maximum} 天，不能直接压缩或填长。可以改成 ${maximum} 天，或只选一座城市再安排。`
    : `${cityById[cityIds[0]].shortName}现有 ${maximum} 个逐日章节，不能据此直接填满 ${draft.days} 天。请选择 1–${maximum} 天，或另选跨城经典主线。`, { ...draft, awaiting: 'days' });
  if (draft.party === undefined) return tripReply(`已记下 ${cityIds.map(id => cityById[id].shortName).join('＋')} ${draft.days} 天。几个人一起出发？成人与儿童都计入总人数，例如“2大1小”。亲子、长辈或喜欢山水、美食，也可以一起告诉我。`, { ...draft, awaiting: 'party' });
  if (!Number.isInteger(draft.party) || draft.party < 1 || draft.party > 6) return tripReply(`当前规划支持 1–6 人，你填写的是 ${draft.party} 人。请确认实际人数；超过 6 人的团体需要另行核算车辆、房间与接驳，本站不会按 6 人代替。`, { ...draft, awaiting: 'party' });
  const firstCityId = template?.segments[0].cityId || cityIds[0];
  if (draft.origin && !draft.arrival && !originIsInCity(draft.origin, firstCityId)) return tripReply(`从${draft.origin}出发，第一站是${cityById[firstCityId].shortName}。这 ${draft.days} 天是否包含去程？请告诉我首日抵达时段，或是否已经提前一晚到达，我再给交通、吃饭和入住留出时间，不先安排当天上午的景点。`, { ...draft, awaiting: 'arrival' });
  if (draft.budgetLimit !== undefined && (!Number.isFinite(draft.budgetLimit) || draft.budgetLimit <= 0 || draft.budgetLimit > 1000000)) return tripReply('预算目标请填写大于 0、最多 100 万元的金额，再说明是全团总额还是每人预算。', draft);
  if (draft.budgetLimit !== undefined && !draft.budgetScope) return tripReply(`已记下预算目标 ¥${draft.budgetLimit.toLocaleString()}。这是所有同行人的全团总额，还是每个人的预算？我会按同一口径核对住宿、餐食、当地交通和项目预留。`, { ...draft, awaiting: 'budget-scope' });
  if (draft.date && !validDate(draft.date)) return tripReply('这个出发日期无效，请按“年-月-日”重新填写，例如 2026-12-08；还未确定也可以先不填日期。', draft);
  if (draft.departureTime !== undefined && parseClock(draft.departureTime) === undefined) return tripReply('请把发车时间写成 24 小时制，例如 15:30。也可以只选上午、下午或晚间。', { ...draft, awaiting: 'departure' });
  const validChoices = { group: Object.keys(groupLabels), mode: ['public', 'drive'], budget: Object.keys(budgetLabels), interest: Object.keys(interestLabels), pace: ['classic', 'relaxed'], arrival: ['full-day', 'morning', 'afternoon', 'evening', 'previous-night'], departure: Object.keys(departureLabels), mobility: ['standard', 'gentle'], budgetScope: ['total', 'per-person'] };
  if (Object.entries(validChoices).some(([key, allowed]) => draft[key as keyof typeof validChoices] !== undefined && !allowed.includes(draft[key as keyof typeof validChoices] as string))) return tripReply('有一项旅行偏好暂不支持。请选择已有的同行人群、交通、玩法、预算与节奏，再整理行程。', draft);
  if (draft.group === 'solo' && draft.party !== 1) return tripReply(`“独自旅行”和 ${draft.party} 人不一致。可以改为 1 人，或说明是朋友、亲子、长辈同行，我再整理。`, { ...draft, awaiting: 'party' });
  const group = draft.group || (draft.party === 1 ? 'solo' : 'friends');
  const pace = draft.pace || (draft.mobility === 'gentle' || group === 'family' || group === 'senior' ? 'relaxed' : 'classic');
  const base = defaultProfile(template?.cityId || cityIds[0], draft.date || '', draft.party);
  const interest = draft.interest || 'balanced';
  let indices = recommendConstrainedDays(base.cityId, draft.days, interest, draft.mobility);
  if (!template && indices.length < draft.days) {
    const available = recommendConstrainedDays(base.cityId, cityById[base.cityId].days.length, interest, draft.mobility).length;
    const refused = tripReply(`${cityById[base.cityId].shortName}现有资料里，符合少台阶、避免高强度条件的章节只有 ${available} 个，不能据此排满 ${draft.days} 天。不会把高强度山地行程补进来。可以缩短天数、改选城市，或明确取消这个体力限制后重新安排；低中强度也不代表完全无台阶。`, { ...draft, awaiting: undefined }, [cityActionForDraft(base.cityId)]);
    refused.suggestions = [...(available > 0 ? [`改成${available}天`] : []), '改成2天，换武汉', '取消少台阶限制'];
    return refused;
  }
  if (!template && ['morning', 'afternoon', 'evening'].includes(draft.arrival || '')) indices = [0, ...indices.filter(index => index !== 0).slice(0, draft.days - 1)].sort((a, b) => a - b);
  let profile = normalizeProfile({ ...base, template: template?.id || 'custom', indices, group, mode: draft.mode || 'public', interest, budget: draft.budget || 'comfort', pace, note: draft.note || '', origin: draft.origin, arrival: draft.arrival || 'full-day', departure: draft.departure, departureTime: draft.departureTime, departureStation: draft.departureStation, returnLogistics: draft.returnLogistics, mobility: draft.mobility || 'standard', budgetLimit: draft.budgetLimit, budgetScope: draft.budgetScope });
  const timingConflict = getTripTimingConflict(profile);
  if (timingConflict) {
    const refused = tripReply(timingConflict, { ...draft, awaiting: undefined });
    refused.suggestions = ['提前一晚抵达', '改成2天', ...(draft.departure === 'evening' ? [] : ['最后一天晚上返程'])];
    return refused;
  }
  const plannedDays = buildTrip(profile);
  if (plannedDays.length !== draft.days) return tripReply('现有路线未能覆盖你选择的天数，请调整天数或目的地后再整理。', draft);
  if (group === 'senior' && draft.mobility === undefined) {
    const demanding = plannedDays.filter(day => day.effort === 'high');
    if (demanding.length) return tripReply(`候选路线包含较多台阶的山地章节：${demanding.map(day => day.title).join('、')}。长辈能接受这类山地活动吗？选“少台阶”会避开高强度章节，选“可以接受山地活动”再保留山地主线。`, { ...draft, awaiting: 'mobility' });
  }
  const highDays = draft.mobility === 'gentle' ? plannedDays.filter(day => day.effort === 'high') : [];
  if (highDays.length) {
    const refused = tripReply(`这条${template ? '固定跨城主线' : '路线'}仍包含高强度章节：${highDays.map(day => day.title).join('、')}，不能作为已满足“少台阶／不爬山”的方案。可以换成较轻松的单城路线，或确认能接受高强度后取消限制。`, { ...draft, awaiting: undefined });
    refused.suggestions = ['改成2天，换武汉', '取消少台阶限制'];
    return refused;
  }
  const budgetNotes: string[] = [];
  if (draft.budgetLimit !== undefined && draft.budgetScope) {
    const target = draft.budgetLimit * (draft.budgetScope === 'per-person' ? draft.party : 1);
    const count = plannedDays.length;
    if (!draft.budget && estimateBudget(profile, count).total[1] > target) profile = normalizeProfile({ ...profile, budget: 'value' });
    const range = estimateBudget(profile, count).total;
    const scope = draft.budgetScope === 'per-person' ? `每人 ¥${draft.budgetLimit.toLocaleString()}（全团 ¥${target.toLocaleString()}）` : `全团 ¥${target.toLocaleString()}`;
    if (range[0] > target) {
      const minimum = draft.budgetScope === 'per-person' ? Math.ceil(range[0] / draft.party) : range[0];
      const refused = tripReply(`按你给的${scope}目标，这份 ${draft.days} 天、${draft.party} 人方案的${budgetLabels[profile.budget]}规划预留为全团 ¥${range[0].toLocaleString()}–${range[1].toLocaleString()}，连区间低端都超过目标，暂不把它作为符合预算的方案。可以提高预算、缩短天数或调整档位。预留不含往返及跨城大交通、租车等费用，也不是实时报价。`, { ...draft, awaiting: undefined });
      refused.suggestions = [...(draft.budget && draft.budget !== 'value' ? ['改为经济档位'] : []), `${draft.budgetScope === 'per-person' ? '人均预算' : '总预算'}${minimum}元`, '取消预算上限'];
      return refused;
    }
    budgetNotes.push(`预算目标：${scope}；当前${budgetLabels[profile.budget]}全团规划预留 ¥${range[0].toLocaleString()}–${range[1].toLocaleString()}。${range[1] > target ? '区间上限仍可能超出目标，不能保证控制在目标内；实际选择要向低端靠拢或继续缩减。' : '本次预留区间在目标内，但实际报价仍需另行确认。'}不含往返与跨城大交通、租车等费用。`);
  }
  const defaults = [!draft.interest && interestLabels[profile.interest], !draft.mode && '公共交通＋接驳', !draft.budget && `${budgetLabels[profile.budget]}${draft.budgetLimit !== undefined ? '（按预算目标核对）' : ''}`, !draft.pace && (pace === 'relaxed' ? '轻松慢游' : '经典节奏')].filter(Boolean);
  const departure = profile.departure;
  const hasReturnWindow = departure && departure !== 'flexible';
  const lastDay = plannedDays.at(-1);
  const morning = lastDay?.returnMorning;
  const stationSchedule = lastDay?.stationSchedule;
  const lastDayIsTransferOnly = hasReturnWindow && lastDay?.sightseeingRemoved && !morning;
  const morningNote = morning ? `上午${morning.conditional ? '可选' : '安排'}「${morning.sight}」，约 ${morning.minutes} 分钟。` : '';
  const stationNote = stationSchedule ? `建议 ${stationSchedule.leaveForStationBy} 前去站，${stationSchedule.arriveBy} 前到站。实际车程变长时提前出发。`
    : lastDay?.afternoonReturn ? '可在行程里补上车站、发车时间和地图车程，再倒推到站时间。' : '按票面和实际车程留出行李与接驳时间。';
  const arrivalNote = draft.arrival
    ? `抵达安排为${arrivalLabels[draft.arrival]}。${['morning', 'afternoon', 'evening'].includes(draft.arrival) ? '首日已给交通、用餐和安顿留时间。' : ''}`
    : '首日先按完整游玩日安排。如果当天才到，请告诉我抵达时段。';
  const notes = [
    `已按这些条件整理好具体行程。可以继续调整${template ? '人数、交通与节奏' : '天数、人数、交通与玩法'}，或带入规划器保存与下载。`,
    defaults.length ? `未指定的项目先按：${defaults.join('、')}。` : '',
    (draft.arrival || plannedDays.length > 1 || !hasReturnWindow) ? arrivalNote : '',
    hasReturnWindow ? `${getDepartureLabel(profile)}。${morningNote}${!morning && !lastDayIsTransferOnly ? '保留可选的城区上午活动。' : ''}${stationNote}` : '',
    plannedDays.length === 1 && lastDayIsTransferOnly ? '这一天只够安排接驳。想保留景点，可以增加游玩天数或调整返程时段。' : '',
    draft.origin ? `从${draft.origin}出发，游玩目的地是${cityIds.map(id => cityById[id].shortName).join('＋')}；往返大交通时间和费用需另外安排。` : '',
    draft.mobility === 'gentle' ? '已避开高强度章节；现有低中强度路线仍可能有台阶，不能视作无障碍或完全不走路。' : '',
    ...budgetNotes,
    template ? `跨城采用固定主线：${template.segments.map(segment => `${cityById[segment.cityId].shortName}${segment.indices.length}天`).join(' → ')}；玩法偏好不会改动经典模板的景点。跨城日上午留给交通，原上午景点移除。` : '',
    draft.note ? '补充想法已附入方案；饮食禁忌和特殊需求未自动核实或替换，请向餐馆、酒店和运营方确认。' : '',
  ].filter(Boolean);
  return tripReply(notes.join('\n\n'), { ...draft, departure: profile.departure, departureTime: profile.departureTime, departureStation: profile.departureStation, returnLogistics: profile.returnLogistics, awaiting: undefined }, [{ kind: 'plan', cityId: profile.cityId, label: '带入规划并继续调整', profile: { ...profile, indices: [...profile.indices] } }], profile);
}

function readLogisticsUpdate(question: string): { remaining: string; patch?: ReturnLogistics; error?: string } {
  const qualifiers = '(?:\\s*(?:大约|大概|预计|改成|改为|预留|需要|要|用时|约|是|为|[:：])){0,3}';
  const duration = qualifiers + '\\s*(' + countPattern + ')\\s*(?:分钟|分(?!钟))(?!\\s*[吗够？?])';
  const find = (label: string) => Array.from(question.matchAll(new RegExp(label + duration, 'g')))
    .filter(match => !/(?:不是|不用|不需要|不必|不要)\s*$/.test(question.slice(0, match.index))).at(-1);
  const travel = find('(?:(?:去|到)(?:车|火车|高铁)?站(?:车程)?|地图车程|返程车程|车程(?=改成|改为|是))');
  const luggage = find('(?:取行李|行李预留)');
  if (!travel && !luggage) return { remaining: question };
  const remaining = question.replace(travel?.[0] || /$^/, '').replace(luggage?.[0] || /$^/, '');
  const patch: ReturnLogistics = {};
  if (travel) {
    const minutes = readReturnMinutes(numberValue(travel[1]), 'travelMinutes');
    if (minutes === undefined) return { remaining, error: '去站车程请填 1–360 分钟。' };
    patch.travelMinutes = minutes;
  }
  if (luggage) {
    const minutes = readReturnMinutes(numberValue(luggage[1]), 'luggageMinutes');
    if (minutes === undefined) return { remaining, error: '取行李时间请填 0–120 分钟。随身携带可填 0。' };
    patch.luggageMinutes = minutes;
  }
  return { remaining, patch };
}

type ParsedRequest = { patch: SupportTripDraft; fields: boolean; error?: string; errorField?: 'days' | 'party' | 'city' | 'budget-scope' | 'departure' | 'logistics'; hasDays: boolean; hasParty: boolean };
function parseRequest(question: string, previous?: SupportTripDraft): ParsedRequest {
  const patch: SupportTripDraft = {};
  const logistics = readLogisticsUpdate(question);
  const returning = readReturnTiming(logistics.remaining, Boolean(previous));
  const origin = extractTripOrigin(returning.remaining);
  if (origin.question !== returning.remaining && !origin.origin) return { patch, fields: true, hasDays: false, hasParty: false, errorField: 'city', error: '出发地只需要城市名称，不需要街道、门牌或详细住址。请重新填写出发城市与想去的湖北目的地。' };
  if (origin.origin) patch.origin = origin.origin;
  if (/取消出发地|先不填出发地/.test(question)) patch.origin = '';
  const tripText = origin.question;
  if (returning.departure) { patch.departure = returning.departure; patch.departureTime = returning.departureTime; }
  else if (previous?.awaiting === 'departure' && bareReturnTime.test(question.trim())) {
    const time = returnWindow(question.trim());
    if (time.departure) { patch.departure = time.departure; patch.departureTime = time.departureTime; }
  }
  if (returning.departureStation !== undefined) patch.departureStation = returning.departureStation || undefined;
  const changedStation = returning.departureStation !== undefined && patch.departureStation !== previous?.departureStation;
  if (logistics.patch || (changedStation && previous?.returnLogistics)) {
    patch.returnLogistics = { ...previous?.returnLogistics, ...logistics.patch };
    if (changedStation && logistics.patch?.travelMinutes === undefined) delete patch.returnLogistics.travelMinutes;
  }
  if (/取消(?:预算上限|预算限制)|不设预算|不限预算|先不填预算/.test(question)) { patch.budgetLimit = undefined; patch.budgetScope = undefined; }
  else {
    const amount = question.match(/(?:总预算|预算|人均|每人|每位|全团|总共|一共|合计|总额)[^\d，,。；;\n]{0,10}((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(万|千|[kKwW])?\s*(?:元|块)?/);
    if (amount) patch.budgetLimit = Number(amount[1].replaceAll(',', '')) * (/万|w/i.test(amount[2] || '') ? 10000 : /千|k/i.test(amount[2] || '') ? 1000 : 1);
    if (patch.budgetLimit !== undefined || previous?.budgetLimit !== undefined) {
      const scopeText = question.replace(/(?:不是|非|不按|不要按)\s*(?:人均|每人|每位|单人预算|全团|全家|总额|总预算|总共|合计|总计)/g, '');
      if (/人均|每人|每位|单人预算/.test(scopeText)) patch.budgetScope = 'per-person';
      else if (/全团|全家|总预算|预算总额|总共|合计|总计|总额|一共/.test(scopeText)) patch.budgetScope = 'total';
    }
  }
  if (/(?:不(?:能|想|愿)?接受|无法接受|没法接受)[^，,。；;\n]{0,8}(?:山地|台阶|爬山)/.test(question)) patch.mobility = 'gentle';
  else if (/取消(?:少台阶|体力|不爬山|轻体力)限制|恢复标准体力|不限制台阶|可以爬山|接受爬山|可以接受山地活动|接受山地|能接受.*台阶/.test(question)) patch.mobility = 'standard';
  else if (/不(?:想|能|要|爱|愿|喜欢|适合)?(?:去)?(?:爬山|登山|登高|徒步)|少(?:走)?台阶|避免(?:爬山|登山|长台阶)/.test(question)) patch.mobility = 'gentle';
  if (/提前一晚|前一晚|前晚|前一天.*(?:抵达|到达|到)|昨晚.*(?:抵达|到达|到)/.test(tripText)) patch.arrival = 'previous-night';
  else if (/完整游玩日|完整一天|全天游玩|首日全天|首日完整/.test(tripText)) patch.arrival = 'full-day';
  else {
    const phase = tripText.match(/(?:上午|早上|早晨|下午|午后|中午|晚上|晚间|傍晚|夜里|凌晨)[^，,。；;\n]{0,14}(?:到达|抵达|到)/)?.[0]
      || tripText.match(/(?:到达|抵达)[^，,。；;\n]{0,10}(?:上午|早上|早晨|下午|午后|中午|晚上|晚间|傍晚|夜里|凌晨)/)?.[0];
    const clock = tripText.match(/(\d{1,2})(?:[:：]\d{2}|点)[^，,。；;\n]{0,8}(?:到达|抵达|到)/);
    if (phase) patch.arrival = /晚上|晚间|傍晚|夜里|凌晨/.test(phase) ? 'evening' : /下午|午后|中午/.test(phase) ? 'afternoon' : 'morning';
    else if (clock) patch.arrival = Number(clock[1]) >= 18 ? 'evening' : Number(clock[1]) >= 12 ? 'afternoon' : 'morning';
    else if (previous?.awaiting === 'arrival') {
      const timeReply = tripText.replace(/(?:不是|不在|不会)(?:上午|下午|晚上|中午)/g, '');
      const hour = timeReply.match(/(\d{1,2})(?:[:：]\d{2}|点)/);
      if (/晚上|晚间|傍晚|夜里|凌晨/.test(timeReply)) patch.arrival = 'evening';
      else if (/下午|午后|中午/.test(timeReply)) patch.arrival = 'afternoon';
      else if (/上午|早上|早晨/.test(timeReply)) patch.arrival = 'morning';
      else if (hour) patch.arrival = Number(hour[1]) >= 18 ? 'evening' : Number(hour[1]) >= 12 ? 'afternoon' : 'morning';
    }
  }
  const date = question.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
  const durationText = question.replace(/\d{4}[年/-]\d{1,2}[月/-]\d{1,2}日?/g, '').replace(/\d{1,2}月\d{1,2}日/g, '').replace(new RegExp(`(?:最后一|最后|第(?:${countPattern}))(?:天|日)`, 'g'), '');
  const relativeDays = durationText.match(new RegExp(`(?<!参)(?:天数\\s*)?(增加|加上|再加|加|延长|多(?:玩|待|留)?|再(?:玩|待|留)|减少|减去|缩短|少(?:玩|待|留)?|减)\\s*(${countPattern})\\s*(?:天|日)`));
  const relativeParty = durationText.match(new RegExp(`(?<!参)(?:人数\\s*)?(增加|加上|再加|加|多(?:带)?|减少|减去|减|少(?:带)?)\\s*(${countPattern})\\s*(?:个|名)?(?:人|位|大人|成人|孩子|小孩|儿童)`))
    || durationText.match(new RegExp(`人数\\s*(增加|加上|再加|加|多|减少|减去|减|少)\\s*(${countPattern})\\s*(?:个|名)?`));
  // Relative changes use the known trip total; their numeric amount is not an absolute replacement.
  const countsText = durationText.replace(relativeDays?.[0] || /$^/, '').replace(relativeParty?.[0] || /$^/, '');
  const day = countsText.match(new RegExp(`(${countPattern})\\s*(?:天|日)`));
  if (day) patch.days = numberValue(day[1]);
  else if (/周末/.test(question)) patch.days = 2;
  const adults = countsText.match(new RegExp(`(${countPattern})\\s*(?:个|位|名)?(?:大人|成人|老人|长辈|大)(?!峡)`));
  const children = countsText.match(new RegExp(`(${countPattern})\\s*(?:个|位|名)?(?:小孩|孩子|儿童|小朋友|娃|小)(?!吃)`));
  const people = countsText.match(new RegExp(`(${countPattern})\\s*(?:个)?(?:人|位(?!\\s*(?:大人|成人|老人|长辈|小孩|孩子|儿童|小朋友|宝宝)))`));
  const household = countsText.match(new RegExp(`一家\\s*(${countPattern})\\s*口`));
  const subtotals = (adults ? numberValue(adults[1]) : 0) + (children ? numberValue(children[1]) : 0);
  if ([adults, children].some(match => match && (!Number.isInteger(numberValue(match[1])) || numberValue(match[1]) < 0))) return { patch, fields: true, hasDays: Boolean(day), hasParty: true, error: '成人与儿童人数请填写非负整数，再确认总共几个人。', errorField: 'party' };
  if (people && ((adults && children && subtotals !== numberValue(people[1])) || (!(adults && children) && subtotals > numberValue(people[1])))) return { patch, fields: true, hasDays: Boolean(day), hasParty: true, error: '成人、儿童合计与总人数不一致，请确认总共几个人。例如“2大1小，共3人”。', errorField: 'party' };
  if (people) patch.party = numberValue(people[1]);
  else if (adults || children) patch.party = subtotals;
  else if (household) patch.party = numberValue(household[1]);
  for (const [field, match] of [['days', relativeDays], ['party', relativeParty]] as const) {
    if (!match) continue;
    const amount = numberValue(match[2]), base = patch[field] ?? previous?.[field];
    if (!Number.isInteger(amount) || amount < 1) return { patch, fields: true, hasDays: field === 'days' || Boolean(day), hasParty: field === 'party' || patch.party !== undefined, errorField: field, error: '增减数量请填正整数，也可以直接告诉我希望安排到几天、几人。' };
    if (base === undefined) return { patch, fields: true, hasDays: field === 'days' || Boolean(day), hasParty: field === 'party' || patch.party !== undefined, errorField: field, error: field === 'days' ? '还不知道原来计划玩几天，暂时不能计算增减。请直接告诉我这趟希望安排几天。' : '还不知道原来共有几个人，暂时不能计算增减。请直接告诉我调整后总共几个人。' };
    patch[field] = base + (/减少|减去|缩短|少|减/.test(match[1]) ? -amount : amount);
  }
  if (/独自|我一个人|独行|单人|一人出发/.test(question)) { patch.group = 'solo'; if (patch.party === undefined) patch.party = 1; }
  else if (/长辈|老人|爸妈|父母|老年/.test(question)) patch.group = 'senior';
  else if (children || household || /亲子|带娃|带孩子|带小孩|宝宝|儿童/.test(question) || (relativeParty && /孩子|小孩|儿童/.test(relativeParty[0]))) patch.group = 'family';
  else if (/朋友|情侣|夫妻|同学|闺蜜|结伴/.test(question)) patch.group = 'friends';
  else if (relativeParty && previous?.group === 'solo' && patch.party! > 1) patch.group = 'friends';
  if (/不(?:想|要)?自驾|非自驾|没有车|不(?:想|要)?开车|公共交通|高铁|火车|公交|地铁/.test(tripText)) patch.mode = 'public';
  else if (/自驾|开车|租车/.test(tripText)) patch.mode = 'drive';
  const positive = question.replace(/(?:不喜欢|不想|不要|不爱|不能|不愿|不打算|避免|不适合)(?:再|去)?(?:爬山|登山|登高|徒步|美食|吃辣|人文|历史|自然)/g, '');
  if (/经典综合|均衡|综合|都可以|没(?:有)?偏好|随便/.test(positive)) patch.interest = 'balanced';
  else if (/美食|吃喝|吃逛|小吃|过早|地方风味/.test(positive)) patch.interest = 'food';
  else if (/历史|人文|文化|博物馆|古城|名楼/.test(positive)) patch.interest = 'culture';
  else if (/自然|山水|峡谷|森林|徒步|爬山|山野/.test(positive)) patch.interest = 'nature';
  if (/经济|省钱|穷游|实惠|低预算/.test(question)) patch.budget = 'value';
  else if (/品质|精品|高端|豪华|度假/.test(question)) patch.budget = 'boutique';
  else if (/舒适/.test(question)) patch.budget = 'comfort';
  const paceText = question.replace(relativeDays?.[0] || /$^/, '');
  if (/经典节奏|快一点|紧凑|快节奏|多玩|不要慢游|不想慢游/.test(paceText)) patch.pace = 'classic';
  else if (/轻松|慢游|慢一点|慢点|不累|不太累|不想太累|不赶|不要太赶|别太赶|休闲|少走|休息/.test(paceText)) patch.pace = 'relaxed';
  if (date) patch.date = `${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}`;
  if (/日期待定|先不填日期|取消日期|日期不确定/.test(question)) patch.date = '';
  const requirements = question.split(/[，,。；;\n]/).filter(part => /不吃|忌口|过敏|清真|素食|不能吃/.test(part)).map(part => part.trim()).filter(Boolean);
  if (requirements.length) patch.note = requirements.join('；').slice(0, 300);
  const days = patch.days ?? previous?.days;
  if (returning.dayNumber && days && returning.dayNumber !== days) {
    return { patch: { ...patch, departure: previous?.departure, departureTime: previous?.departureTime, departureStation: previous?.departureStation, returnLogistics: previous?.returnLogistics }, fields: true, hasDays: patch.days !== undefined, hasParty: patch.party !== undefined, errorField: 'departure', error: `你说第 ${returning.dayNumber} 天返程，但这份行程有 ${days} 天。请确认总天数和最后一天的返程时段。` };
  }
  if (returning.needsWindow) {
    return { patch, fields: true, hasDays: patch.days !== undefined, hasParty: patch.party !== undefined, errorField: 'departure', error: '请确认返程是在上午、下午还是晚间。也可以填写 24 小时制时间，例如 15:00。' };
  }
  if (logistics.error) return { patch, fields: true, hasDays: patch.days !== undefined, hasParty: patch.party !== undefined, errorField: 'logistics', error: logistics.error };
  return { patch, fields: Object.keys(patch).length > 0, hasDays: patch.days !== undefined, hasParty: patch.party !== undefined };
}

/** Return undefined for ordinary guide questions, so the existing food/place help keeps working. */
export function answerTripQuestion(question: string, context: SupportContext, mentionedCities: string[], hasPlace: boolean): SupportReply | undefined {
  const previous = context.trip ? copyTripDraft(context.trip) : undefined, parsed = parseRequest(question, previous);
  const constraintEdited = ['origin', 'arrival', 'departure', 'departureStation', 'returnLogistics', 'mobility', 'budget', 'budgetLimit', 'budgetScope'].some(key => Object.hasOwn(parsed.patch, key));
  const explicit = /规划|具体行程|行程推荐|推荐行程|推荐路线|生成.*行程|安排.*行程|帮.*(?:计划|安排|行程|路线)|定制|做.*攻略|制定|制订/.test(question);
  const modify = /改|换|调整|重新|增加|减少|人数.*(?:加|减|多|少)|多带|少带|喜欢|偏好|想看|想吃|希望|轻松一点|慢一点|慢点|不要太赶|不赶|快一点|经典节奏|不自驾|先不填日期|取消日期/.test(question);
  const ordinary = /住哪|住宿.*推荐|吃什么|有什么.*美食|美食.*(?:什么|推荐)|怎么(?:去|坐车|到)|交通.*(?:方式|安排)|季节|什么时候|怎么放慢|适合.*(?:亲子|孩子)|预算|花费|费用/.test(question);
  if (hasPlace && !explicit && !/整体|全程|行程/.test(question)
    && !((parsed.patch.departure || parsed.patch.returnLogistics || parsed.errorField === 'logistics') && (previous || parsed.hasDays))) return undefined;
  if (ordinary && !explicit && !parsed.hasDays && !constraintEdited && !(previous && ((modify && parsed.fields) || (previous.awaiting && parsed.hasParty) || previous.awaiting === 'budget-scope'))) return undefined;
  const route = /行程|路线|怎么玩|怎么游|游玩|周末|几天|几日|安排|好玩/.test(question);
  const start = explicit || parsed.hasDays || constraintEdited || Boolean(parsed.error && parsed.errorField) || (parsed.hasParty && (route || mentionedCities.length > 0)) || (mentionedCities.length > 0 && route && !ordinary);
  const continuation = previous && (parsed.fields || (mentionedCities.length > 0 && (Boolean(previous.awaiting) || /只去|改去|改到|改成|换|想去/.test(question))));
  if (!start && !continuation) return undefined;
  const cityIds = mentionedCities.length ? [...mentionedCities] : previous?.cityIds?.length ? [...previous.cityIds] : context.cityId && Object.hasOwn(cityById, context.cityId) ? [context.cityId] : undefined;
  const draft = { ...previous, ...parsed.patch, ...(cityIds ? { cityIds } : {}) };
  if (mentionedCities.length && previous?.cityIds && (mentionedCities.length !== previous.cityIds.length || mentionedCities.some(id => !previous.cityIds?.includes(id)))) {
    if (!Object.hasOwn(parsed.patch, 'departureStation')) draft.departureStation = undefined;
    draft.returnLogistics = readLogisticsUpdate(question).patch;
  }
  if (parsed.patch.note) draft.note = [previous?.note, parsed.patch.note].filter(Boolean).join('；').slice(0, 500);
  if (parsed.error) return tripReply(parsed.error, { ...draft, awaiting: parsed.errorField === 'logistics' ? undefined : parsed.errorField || 'party' });
  return planSupportTrip(draft);
}
