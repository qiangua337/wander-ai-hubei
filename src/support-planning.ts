import { cityById } from './data';
import { buildTrip, defaultProfile, normalizeProfile, recommendDays, templates, validDate, groupLabels, interestLabels, budgetLabels, type Profile } from './planning';
import type { SupportAction, SupportContext, SupportReply } from './support';

export type SupportTripDraft = {
  cityIds?: string[]; days?: number; party?: number;
  group?: Profile['group']; mode?: Profile['mode']; budget?: Profile['budget'];
  interest?: Profile['interest']; pace?: Profile['pace']; date?: string; note?: string;
  awaiting?: 'city' | 'days' | 'party';
};

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

export function copyTripDraft(value?: SupportTripDraft): SupportTripDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const draft: SupportTripDraft = {};
  if (Array.isArray(value.cityIds)) draft.cityIds = [...new Set(value.cityIds.filter(id => typeof id === 'string'))];
  for (const key of ['days', 'party', 'group', 'mode', 'budget', 'interest', 'pace', 'date', 'awaiting'] as const) {
    if (value[key] !== undefined) Object.assign(draft, { [key]: value[key] });
  }
  if (typeof value.note === 'string') draft.note = value.note.trim().slice(0, 500);
  return draft;
}

const suggestionsFor = (draft: SupportTripDraft) => draft.awaiting === 'city'
  ? ['想去武汉', '想去恩施', '想去宜昌和恩施']
  : draft.awaiting === 'days' ? ['改成2天', '改成3天', '改成5天']
  : draft.awaiting === 'party' ? ['2人一起', '2大1小，亲子轻松', '我一个人']
  : ['改成3天', '换成自驾', '想轻松一点', '怎么保存分享行程？'];

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
  if (draft.date && !validDate(draft.date)) return tripReply('这个出发日期无效，请按“年-月-日”重新填写，例如 2026-12-08；还未确定也可以先不填日期。', draft);
  const validChoices = { group: Object.keys(groupLabels), mode: ['public', 'drive'], budget: Object.keys(budgetLabels), interest: Object.keys(interestLabels), pace: ['classic', 'relaxed'] };
  if (Object.entries(validChoices).some(([key, allowed]) => draft[key as keyof typeof validChoices] !== undefined && !allowed.includes(draft[key as keyof typeof validChoices] as string))) return tripReply('有一项旅行偏好暂不支持。请选择已有的同行人群、交通、玩法、预算与节奏，再整理行程。', draft);
  if (draft.group === 'solo' && draft.party !== 1) return tripReply(`“独自旅行”和 ${draft.party} 人不一致。可以改为 1 人，或说明是朋友、亲子、长辈同行，我再整理。`, { ...draft, awaiting: 'party' });
  const group = draft.group || (draft.party === 1 ? 'solo' : 'friends');
  const pace = draft.pace || (group === 'family' || group === 'senior' ? 'relaxed' : 'classic');
  const base = defaultProfile(template?.cityId || cityIds[0], draft.date || '', draft.party);
  const profile = normalizeProfile({ ...base, template: template?.id || 'custom', indices: recommendDays(base.cityId, draft.days, draft.interest || 'balanced'), group, mode: draft.mode || 'public', interest: draft.interest || 'balanced', budget: draft.budget || 'comfort', pace, note: draft.note || '' });
  if (buildTrip(profile).length !== draft.days) return tripReply('现有路线未能覆盖你选择的天数，请调整天数或目的地后再整理。', draft);
  const defaults = [!draft.interest && interestLabels[profile.interest], !draft.mode && '公共交通＋接驳', !draft.budget && budgetLabels[profile.budget], !draft.pace && (pace === 'relaxed' ? '亲子／长辈默认慢游' : '经典节奏')].filter(Boolean);
  const notes = [
    '已按这些条件整理好具体行程。可以继续说“改成3天”“4人”“换自驾”或“喜欢美食”。',
    defaults.length ? `未指定的项目先按：${defaults.join('、')}。` : '',
    template ? `跨城采用固定主线：${template.segments.map(segment => `${cityById[segment.cityId].shortName}${segment.indices.length}天`).join(' → ')}；玩法偏好不会改动经典模板的景点。跨城日上午留给交通，原上午景点移除。` : '',
    draft.note ? '补充想法已附入方案；饮食禁忌和特殊需求未自动核实或替换，请向餐馆、酒店和运营方确认。' : '',
  ].filter(Boolean);
  return tripReply(notes.join('\n\n'), { ...draft, awaiting: undefined }, [{ kind: 'plan', cityId: profile.cityId, label: '带入规划并继续调整', profile: { ...profile, indices: [...profile.indices] } }], profile);
}

type ParsedRequest = { patch: SupportTripDraft; fields: boolean; error?: string; hasDays: boolean; hasParty: boolean };
function parseRequest(question: string): ParsedRequest {
  const patch: SupportTripDraft = {};
  const date = question.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
  const durationText = question.replace(/\d{4}[年/-]\d{1,2}[月/-]\d{1,2}日?/g, '').replace(/\d{1,2}月\d{1,2}日/g, '');
  const day = durationText.match(new RegExp(`(${countPattern})\\s*(?:天|日)`));
  if (day) patch.days = numberValue(day[1]);
  else if (/周末/.test(question)) patch.days = 2;
  const adults = question.match(new RegExp(`(${countPattern})\\s*(?:个|位|名)?(?:大人|成人|老人|长辈|大)(?!峡)`));
  const children = question.match(new RegExp(`(${countPattern})\\s*(?:个|位|名)?(?:小孩|孩子|儿童|小朋友|娃|小)(?!吃)`));
  const people = question.match(new RegExp(`(${countPattern})\\s*(?:个)?(?:人|位(?!\\s*(?:大人|成人|老人|长辈|小孩|孩子|儿童|小朋友|宝宝)))`));
  const household = question.match(new RegExp(`一家\\s*(${countPattern})\\s*口`));
  if (adults || children) patch.party = (adults ? numberValue(adults[1]) : 0) + (children ? numberValue(children[1]) : 0);
  else if (people) patch.party = numberValue(people[1]);
  else if (household) patch.party = numberValue(household[1]);
  if (people && patch.party !== undefined && numberValue(people[1]) !== patch.party) return { patch, fields: true, hasDays: Boolean(day), hasParty: true, error: '成人、儿童合计与总人数不一致，请确认总共几个人。例如“2大1小，共3人”。' };
  if (/独自|我一个人|独行|单人|一人出发/.test(question)) { patch.group = 'solo'; if (patch.party === undefined) patch.party = 1; }
  else if (/长辈|老人|爸妈|父母|老年/.test(question)) patch.group = 'senior';
  else if (children || household || /亲子|带娃|带孩子|带小孩|宝宝|儿童/.test(question)) patch.group = 'family';
  else if (/朋友|情侣|夫妻|同学|闺蜜|结伴/.test(question)) patch.group = 'friends';
  if (/不(?:想|要)?自驾|非自驾|没有车|不(?:想|要)?开车|公共交通|高铁|火车|公交|地铁/.test(question)) patch.mode = 'public';
  else if (/自驾|开车|租车/.test(question)) patch.mode = 'drive';
  const positive = question.replace(/(?:不喜欢|不想|不要|不爱)(?:爬山|徒步|美食|吃辣|人文|历史|自然)/g, '');
  if (/经典综合|均衡|综合|都可以|没(?:有)?偏好|随便/.test(positive)) patch.interest = 'balanced';
  else if (/美食|吃喝|吃逛|小吃|过早|地方风味/.test(positive)) patch.interest = 'food';
  else if (/历史|人文|文化|博物馆|古城|名楼/.test(positive)) patch.interest = 'culture';
  else if (/自然|山水|峡谷|森林|徒步|爬山|山野/.test(positive)) patch.interest = 'nature';
  if (/经济|省钱|穷游|实惠|低预算/.test(question)) patch.budget = 'value';
  else if (/品质|精品|高端|豪华|度假/.test(question)) patch.budget = 'boutique';
  else if (/舒适/.test(question)) patch.budget = 'comfort';
  if (/经典节奏|快一点|紧凑|快节奏|多玩|不要慢游|不想慢游/.test(question)) patch.pace = 'classic';
  else if (/轻松|慢游|慢一点|慢点|不累|不太累|不想太累|不赶|不要太赶|别太赶|休闲|少走|休息/.test(question)) patch.pace = 'relaxed';
  if (date) patch.date = `${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}`;
  if (/日期待定|先不填日期|取消日期|日期不确定/.test(question)) patch.date = '';
  const requirements = question.split(/[，,。；;\n]/).filter(part => /不吃|忌口|过敏|清真|素食|不能吃|不喜欢爬山|不想爬山|不要爬山/.test(part)).map(part => part.trim()).filter(Boolean);
  if (requirements.length) patch.note = requirements.join('；').slice(0, 300);
  return { patch, fields: Object.keys(patch).length > 0, hasDays: patch.days !== undefined, hasParty: patch.party !== undefined };
}

/** Return undefined for ordinary guide questions, so the existing food/place help keeps working. */
export function answerTripQuestion(question: string, context: SupportContext, mentionedCities: string[], hasPlace: boolean): SupportReply | undefined {
  const parsed = parseRequest(question), previous = context.trip ? copyTripDraft(context.trip) : undefined;
  const explicit = /规划|具体行程|行程推荐|推荐行程|推荐路线|生成.*行程|安排.*行程|帮.*(?:计划|安排|行程|路线)|定制|做.*攻略|制定|制订/.test(question);
  const modify = /改|换|调整|重新|喜欢|偏好|想看|想吃|希望|轻松一点|慢一点|慢点|不要太赶|不赶|快一点|经典节奏|不自驾|先不填日期|取消日期/.test(question);
  const ordinary = /住哪|住宿.*推荐|吃什么|有什么.*美食|美食.*(?:什么|推荐)|怎么(?:去|坐车|到)|交通.*(?:方式|安排)|季节|什么时候|怎么放慢|适合.*(?:亲子|孩子)|预算|花费|费用/.test(question);
  if (hasPlace && !explicit && !/整体|全程|行程/.test(question)) return undefined;
  if (ordinary && !explicit && !parsed.hasDays && !(previous && ((modify && parsed.fields) || (previous.awaiting && parsed.hasParty)))) return undefined;
  const route = /行程|路线|怎么玩|怎么游|游玩|周末|几天|几日|安排|好玩/.test(question);
  const start = explicit || parsed.hasDays || (parsed.hasParty && (route || mentionedCities.length > 0)) || (mentionedCities.length > 0 && route && !ordinary);
  const continuation = previous && (parsed.fields || (mentionedCities.length > 0 && (Boolean(previous.awaiting) || /只去|改去|换成|想去/.test(question))));
  if (!start && !continuation) return undefined;
  const cityIds = mentionedCities.length ? [...mentionedCities] : previous?.cityIds?.length ? [...previous.cityIds] : context.cityId && Object.hasOwn(cityById, context.cityId) ? [context.cityId] : undefined;
  const draft = { ...previous, ...parsed.patch, ...(cityIds ? { cityIds } : {}) };
  if (parsed.patch.note) draft.note = [previous?.note, parsed.patch.note].filter(Boolean).join('；').slice(0, 500);
  if (parsed.error) return tripReply(parsed.error, { ...draft, awaiting: 'party' });
  return planSupportTrip(draft);
}
