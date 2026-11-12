import { cities, cityById, destinations, destinationById, type CityGuide, type Destination } from './data';
import { practical } from './data/practical';
import { travelFaq } from './data/help';
import { templates, type Profile } from './planning';
import { findDestinations } from './travel';
import { answerTripQuestion, copyTripDraft, extractTripOrigin, planSupportTrip, readReturnTiming, type SupportTripDraft } from './support-planning';
export { planSupportTrip, type SupportTripDraft } from './support-planning';

export type SupportContext = { cityId?: string; trip?: SupportTripDraft };
export type SupportAction = { kind: 'city' | 'place' | 'plan' | 'template' | 'wishlist' | 'explore'; label: string; cityId?: string; placeId?: string; templateId?: string; profile?: Profile };
export type SupportReply = { text: string; sources: { title: string; url: string }[]; actions: SupportAction[]; suggestions: string[]; context: SupportContext; plan?: Profile };

const placeAliases: Record<string, string[]> = {
  'hubei-museum': ['省博', '湖北博物馆', '湖北省博物馆', '曾侯乙编钟'],
  'east-lake': ['东湖'], 'qingchuan': ['晴川阁', '古琴台'],
  'xiling-gorge': ['西陵峡', '灯影峡', '两坝一峡'],
  'three-gorges-dam': ['三峡大坝'], 'tenglong': ['腾龙洞'],
  'dongpo': ['东坡赤壁', '黄冈赤壁', '黄州赤壁'], 'chibi': ['三国赤壁', '赤壁古战场'],
};
const cityAliases: Record<string, string[]> = {
  wuhan: ['武昌', '汉口', '汉阳', '江城'], enshi: ['恩施', '利川', '建始', '咸丰'],
  yichang: ['秭归', '长阳'], shiyan: ['丹江口'], huanggang: ['黄州', '罗田', '麻城'],
  xianning: ['通山', '咸安', '赤壁市'], jingmen: ['钟祥', '京山'],
};
const fallbackSuggestions = ['武汉住哪里顺路？', '宜昌和恩施五天怎么走？', '行程怎样保存和分享？'];
const compact = (text: string) => text.replace(/[\s·，。？！、,!?：:；;（）()“”"'—–-]/g, '').toLowerCase();
const validCity = (id?: string) => typeof id === 'string' && Object.hasOwn(cityById, id) ? id : undefined;
const cityAction = (cityId: string): SupportAction => ({ kind: 'city', cityId, label: `看${cityById[cityId].shortName}攻略` });
const planAction = (cityId: string): SupportAction => ({ kind: 'plan', cityId, label: `规划${cityById[cityId].shortName}行程` });
const placeAction = (place: Destination): SupportAction => ({ kind: 'place', placeId: place.id, label: `看${place.title}攻略` });
function mentionedCityIds(question: string): string[] {
  const officialMatches = cities.flatMap(city => [...new Set([city.name, city.shortName])].flatMap(name => {
    const nameText = compact(name);
    const matches: { cityId: string; start: number; end: number }[] = [];
    let start = question.indexOf(nameText);
    while (start !== -1) {
      matches.push({ cityId: city.id, start, end: start + nameText.length });
      start = question.indexOf(nameText, start + nameText.length);
    }
    return matches;
  }));
  const ids = new Set(officialMatches.map(match => match.cityId));
  for (const city of cities) {
    for (const alias of cityAliases[city.id] || []) {
      const aliasText = compact(alias);
      let start = question.indexOf(aliasText);
      while (start !== -1) {
        const end = start + aliasText.length;
        // A short nickname cannot consume any characters from a different city's formal name.
        if (!officialMatches.some(match => match.cityId !== city.id && start < match.end && end > match.start)) ids.add(city.id);
        start = question.indexOf(aliasText, end);
      }
    }
  }
  return [...ids];
}
function placeReply(place: Destination): SupportReply {
  return reply(`${place.title} · ${cityById[place.cityId].shortName}\n建议停留：${place.duration}\n\n${place.overview}\n\n值得看：${place.highlights.join('；')}。\n\n出发前：${place.tips.join(' ')}`, place.cityId, [placeAction(place), planAction(place.cityId)]);
}
function citySuggestions(city?: CityGuide): string[] {
  return city ? [`${city.shortName}住哪里？`, `${city.shortName}吃什么？`, `${city.shortName}怎么玩？`] : fallbackSuggestions;
}
function reply(text: string, cityId?: string, actions: SupportAction[] = [], sources = cityId ? cityById[cityId].sources.slice(0, 2) : [], suggestions = citySuggestions(cityId ? cityById[cityId] : undefined)): SupportReply {
  return { text, sources: sources.map(source => ({ ...source })), actions, suggestions: [...suggestions], context: cityId ? { cityId } : {} };
}
function daysInQuestion(question: string): number | undefined {
  const numeric = question.match(/(?:^|[^\d])([1-9]\d{0,2})\s*(?:天|日)/);
  if (numeric) return Number(numeric[1]);
  const chinese: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const match = question.match(/([一二两三四五六七八九]?十[一二三四五六七八九]?|[一二两三四五六七八九])\s*(?:天|日)/);
  if (!match) return /周末/.test(question) ? 2 : undefined;
  if (!match[1].includes('十')) return chinese[match[1]];
  const [tens, units] = match[1].split('十');
  return (chinese[tens] || 1) * 10 + (chinese[units] || 0);
}
function templateReply(template: typeof templates[number], requestedDays?: number): SupportReply {
  const dayCount = template.segments.reduce((total, segment) => total + segment.indices.length, 0);
  const route = template.segments.map(segment => `${cityById[segment.cityId].shortName} ${segment.indices.length} 天`).join(' → ');
  const sections = template.segments.map(segment => `${cityById[segment.cityId].shortName}：${segment.indices.map(index => cityById[segment.cityId].days[index].title).join('；')}`).join('\n');
  const mismatch = requestedDays && requestedDays !== dayCount ? `你提到 ${requestedDays} 天；本站对应的编辑路线是 ${dayCount} 天，不能直接压缩成同样的游玩强度。\n\n` : '';
  return reply(`${mismatch}${template.title}\n${route}\n\n${sections}\n\n跨城日的上午留给退房、车站与交通，原上午景点不再安排。打开完整方案后，可以核对逐日安排、逐晚住宿、美食与预算预留。`, undefined,
    [{ kind: 'template', templateId: template.id, label: `看 ${dayCount} 天完整方案` }],
    template.segments.flatMap(segment => cityById[segment.cityId].sources.slice(0, 1)),
    ['跨城交通怎么安排？', '行程怎样保存和分享？', '带孩子怎么放慢节奏？']);
}

/** A synchronous query helper over this site's editorial data, with no model or network request. */
function answerGuide(question: string, context: SupportContext = {}): SupportReply {
  const previousCity = validCity(context?.cityId);
  if (typeof question !== 'string' || !question.trim()) return reply('你好，我是小游。可以帮你查湖北的住宿片区、地方餐食、到达交通和编辑路线。想先了解哪座城市？', previousCity, [{ kind: 'explore', label: '去选一座城市' }]);
  if (question.length > 240) return reply('一次最多问 240 个字。可以先告诉我城市，再分别问住宿、美食或路线，我会逐项帮你查站内攻略。', previousCity);
  const q = question.trim();
  const scopeQuestion = extractTripOrigin(readReturnTiming(q, Boolean(context.trip)).remaining).question;
  const normalized = compact(scopeQuestion);
  if (/赤壁/.test(scopeQuestion) && !/东坡|黄冈|黄州|三国|咸宁|古战场|赤壁市/.test(scopeQuestion)) {
    return reply('“赤壁”可能指两个不同的地方：黄冈的东坡赤壁，或咸宁的三国赤壁古战场。你想了解哪一处？', undefined, [placeAction(destinationById.dongpo), placeAction(destinationById.chibi)], [], ['黄冈东坡赤壁怎么玩？', '三国赤壁古战场怎么玩？']);
  }

  const places = destinations.filter(place => [place.title, ...(placeAliases[place.id] || [])].some(alias => compact(alias).length >= 2 && normalized.includes(compact(alias))));
  const mentionedCities = mentionedCityIds(normalized);
  places.forEach(place => { if (!mentionedCities.includes(place.cityId)) mentionedCities.push(place.cityId); });
  const place = places.length === 1 ? places[0] : undefined;
  // Resolve scope before carrying context into weather, prices, or other early replies.
  const outsidePlace = /北京|上海|天津|重庆|广州|深圳|成都|杭州|南京|长沙|西安|洛阳|苏州|桂林|厦门|青岛|三亚|大理|丽江|张家界|郑州|济南|昆明|贵阳|海口|拉萨|乌鲁木齐|哈尔滨|长春|沈阳|太原|石家庄|福州|南昌|合肥|南宁|兰州|银川|西宁|呼和浩特|香港|澳门|台湾|云南|四川|贵州|湖南|广东|广西|河南|河北|浙江|江苏|山东|山西|陕西|海南|福建|江西|安徽|甘肃|青海|宁夏|新疆|西藏|内蒙古|辽宁|吉林|黑龙江/.test(scopeQuestion);
  const otherNamedPlace = /(?:去|到|在|换成|目的地[是为]?)([\u4e00-\u9fff]{2,8}(?:市|省|自治区|特别行政区))/.test(scopeQuestion);
  const outsideScope = !mentionedCities.length && (outsidePlace || otherNamedPlace);
  const cityId = mentionedCities.length === 1 ? mentionedCities[0] : mentionedCities.length === 0 && !outsideScope ? previousCity : undefined;
  const city = cityId ? cityById[cityId] : undefined;
  const actions = city ? [cityAction(city.id), planAction(city.id)] : [{ kind: 'explore' as const, label: '按城市探索湖北' }];
  const placeActions = place ? [placeAction(place), ...actions] : actions;
  const days = daysInQuestion(q);
  const routeIntent = /行程|路线|安排|规划|玩几天|待几天|怎么玩|怎么游|几日|几天|游玩|周末|[0-9一二两三四五六七八九十][天日]/.test(q);
  const budgetIntent = /预算|花费|开销|费用预留|多少钱够|大概花多少/.test(q);
  const feeQuestion = /免费|收费/.test(q);
  const siteCostQuestion = /本站|网站|小游|助手|问答|wander/i.test(q) && /免费|收费|多少钱|价格/.test(q) && !/景点|景区|门票|票价|房价|住宿|酒店|余票|空房/.test(q);
  const livePrice = !siteCostQuestion && (feeQuestion || /票价|门票|房价|余票|有票|空房|余房|库存|今日开放|今天开放|现在开放|开放时间|开放吗|开门|几点开|闭馆|闭园|关门|几点关|营业时间|预约|预订|订房|订票|买票|下单|支付|退款|酒店.*(?:价格|多少钱)/.test(q) || (!budgetIntent && /多少钱|价格/.test(q)));

  if (/人工|真人|退票|退款|付款|支付|订单|投诉/.test(q)) {
    return reply('本站不提供人工或真人客服，也不创建旅游订单，无法代付、退票、退款或处理订单投诉。请回到实际购票或预订平台的订单页面，通过该平台公布的官方客服处理。这里可以继续查站内旅行攻略，或打开规划整理你的行程。', cityId, actions, []);
  }
  if (/天气|气温|下雨|降雨|预报|会不会雨/.test(q)) {
    return reply(`我无法查询实时天气、气温或停航信息，也不会根据旧攻略推断今天或明天的天气。${city ? `你问到的是${city.shortName}。` : ''}请在出发前查看天气服务和景区当期公告；风雨时为山地步道、船游和返程接驳留出替代安排。${city ? '下方是站内收录的目的地官方资料，供继续查找旅行公告，不能代替实时天气服务。' : ''}`, cityId, placeActions);
  }
  if (livePrice) {
    const lodging = /房价|空房|余房|订房|酒店|宾馆|民宿/.test(q);
    const topics: string[] = [];
    if (/今日开放|今天开放|现在开放|开放时间|开放吗|开门|几点开|闭馆|闭园|关门|几点关|营业时间/.test(q)) topics.push('当期开放时间');
    if (lodging && /房价|价格|多少钱/.test(q)) topics.push('实时房价');
    if (lodging && /空房|余房|库存|订房/.test(q)) topics.push('实时空房情况');
    if (!lodging && /票价|门票|价格|多少钱/.test(q)) topics.push('当前票价');
    if (!lodging && /余票|有票|库存/.test(q)) topics.push('实时余票或库存');
    if (feeQuestion) topics.push(lodging ? '当期住宿收费与优惠政策' : '当期门票收费与优惠政策');
    const booking = /预约|预订|订房|订票|买票|下单/.test(q);
    if (booking) topics.push('当期预约名额与可预订情况');
    const channel = lodging ? '酒店或预订平台' : place ? '景区或场馆' : '相关景区、场馆或运营方';
    const advice = place ? `\n\n${place.title}的站内提示：${place.tips.slice(0, 2).join(' ')}` : '';
    const priceNote = /票价|门票|房价|价格|多少钱/.test(q) ? '\n\n规划中的费用是预留额度，不能作为当前报价。' : '';
    return reply(`我无法查询${topics.length ? topics.join('、') : '当前价格或供应信息'}。${booking ? '这里也不能代为预约或预订。' : ''}请通过${channel}的官方渠道核对。${advice}${priceNote}`, cityId, placeActions);
  }
  if (/你是谁|你是.*AI|你是.*人工|真人|人工客服|大模型|机器人|客服|需要.*key|你能做什么|你能干什么|能帮我做什么|有什么功能/i.test(q)) {
    return reply('我是小游，一个基于站内攻略做问题匹配的本地旅行问答助手，不连接大模型，也不是真人客服。无需 key、登录或下载模型。告诉我湖北目的地、天数、总人数与偏好，我能用编辑路线整理逐日游览、住宿片区、美食和交通，并带入规划器继续调整；实时天气、价格和预订需要另向官方确认。', cityId, actions, []);
  }
  if (/保存|分享|下载|导出|离线|复制/.test(q)) {
    return reply(travelFaq.find(item => item.q.includes('保存'))?.a || '规划结果可以保存在当前浏览器，也可以复制、下载或分享。', cityId, [...(city ? [planAction(city.id)] : []), { kind: 'wishlist', label: '打开旅行心愿单' }], [], ['如何查看我的收藏？', '武汉两天怎么玩？']);
  }
  if (/收藏|心愿单|心愿清单/.test(q)) {
    return reply('点击景点卡片的爱心即可收藏。心愿单按城市整理，可查看攻略、移除景点或进入该城市规划。收藏只保存在当前浏览器；城市编辑路线可以调整，收藏地点不会自动全部排入行程。', cityId, [{ kind: 'wishlist', label: '打开旅行心愿单' }], []);
  }
  if (siteCostQuestion) return reply('本站的攻略浏览、收藏、行程整理和小游问答免费，无需注册。小游使用站内资料在本地匹配，无需 key。实际出行的门票、酒店与交通费用请向相关官方渠道确认。', cityId, actions, []);
  if (/登录|注册|账号|会员|隐私|聊天记录/.test(q)) {
    return reply('浏览攻略、收藏和整理行程无需注册。收藏、草稿与已保存方案放在当前浏览器；分享链接包含旅行设置和日期，不含自由备注。小游按站内资料本地匹配，不连接大模型，也不会向外部服务发送你的问题。本站不创建真实旅游订单。', cityId, actions, []);
  }

  if (outsideScope) {
    return reply('本站目前只整理湖北旅行资料，这个目的地不在攻略范围内，所以不能沿用上一座湖北城市的吃住建议。你可以另选湖北的一座城市，或通过目的地的官方旅游渠道了解当地信息。', undefined, [{ kind: 'explore', label: '探索湖北目的地' }], [], fallbackSuggestions);
  }

  const planned = answerTripQuestion(q, context, mentionedCities, places.length > 0);
  if (planned) return planned;

  if (mentionedCities.length > 1) {
    const template = routeIntent ? templates.find(item => item.segments.length === mentionedCities.length && item.segments.every(segment => mentionedCities.includes(segment.cityId))) : undefined;
    if (template) return templateReply(template, days);
    const names = mentionedCities.map(id => cityById[id].shortName).join('、');
    return reply(`你提到了${names}。${routeIntent ? '本站暂没有完全对应这组城市的经典模板；跨城需要给交通单独留时间。' : '吃住和接驳要按城市分别看。'}先选一座城市，我再给你具体建议。`, undefined, mentionedCities.slice(0, 4).map(cityAction), [], mentionedCities.slice(0, 3).map(id => `${cityById[id].shortName}怎么玩？`));
  }
  const stayIntent = /住哪|住在|住宿|酒店|宾馆|落脚|民宿/.test(q);
  const foodIntent = /吃|美食|过早|小吃|早餐|午餐|晚餐|特产|口味|辣不辣/.test(q);
  const transportIntent = /交通|怎么去|如何去|怎么到|如何到|怎么走|自驾|高铁|火车|公交|地铁|接驳|机场|车站|包车/.test(q);
  const familyIntent = /亲子|孩子|带娃|宝宝|儿童|老人|长辈|爸妈|父母|老年|轻松|休闲|不累|慢游|体力/.test(q);
  const seasonIntent = /季节|什么时候去|几月|春天|夏天|秋天|冬天|春季|夏季|秋季|冬季|月份/.test(q);
  if (!city && !stayIntent && !foodIntent) {
    const chooseCity: SupportAction[] = [{ kind: 'explore', label: '选一座城市，继续细化' }];
    if (/跨城.*(?:交通|怎么走|怎么去|安排)|(?:交通|怎么走).*跨城|不自驾|山区.*(?:公共交通|公交|接驳|怎么去)|(?:公共交通|公交).*山区/.test(q)) {
      const crossCity = /跨城/.test(q) ? travelFaq.find(item => item.q.includes('第一次'))?.a : undefined;
      const publicTransport = travelFaq.find(item => item.q.includes('不自驾'))?.a;
      return reply([crossCity, publicTransport, '选定城市后，可以继续看当地到达方式和具体行程。'].filter(Boolean).join('\n\n'), undefined, chooseCity, [], ['宜昌怎么去？', '恩施交通怎么安排？', '神农架不自驾怎么玩？']);
    }
    if (familyIntent) return reply(`${travelFaq.find(item => item.q.includes('带孩子'))?.a || '先按同行人的体力选择目的地。'}\n\n选一座城市后，我再帮你看适合的片区和路线。`, undefined, chooseCity, [], ['武汉带孩子怎么放慢节奏？', '宜昌带长辈怎么玩？', '恩施适合亲子吗？']);
  }
  if (routeIntent && !city && (days === 2 || days === 5 || days === 7)) {
    const template = templates.find(item => item.segments.reduce((total, segment) => total + segment.indices.length, 0) === days);
    if (template) return templateReply(template, days);
  }
  if (!city && (stayIntent || foodIntent || transportIntent || familyIntent || seasonIntent || budgetIntent || routeIntent)) {
    return reply('想了解湖北的哪座城市？告诉我目的地后，我可以继续查住宿片区、地方餐食、交通和路线。比如“宜昌住哪里”或“恩施怎么玩”。', undefined, [{ kind: 'explore', label: '先选一座城市' }]);
  }
  if (city && stayIntent) {
    const stays = practical[city.id].stays.map(stay => `${stay.area}\n适合：${stay.bestFor}。${stay.reason}\n订前确认：${stay.check}`).join('\n\n');
    return reply(`${city.shortName}可以按行程片区找住宿：\n\n${stays}\n\n这些是住宿片区建议，不是酒店实时报价或空房推荐。`, city.id, actions);
  }
  if (city && foodIntent) {
    const food = practical[city.id].food.map(item => `${item.area}\n${item.order}\n顺路安排：${item.timing}`).join('\n\n');
    return reply(`${city.shortName}的地方餐桌，可以这样顺路安排：\n\n${food}\n\n餐馆现价、营业与供应请在出发前核对。`, city.id, actions);
  }
  if (place && transportIntent) {
    const aliases = [place.title, ...(placeAliases[place.id] || [])].map(compact);
    const transport = [...new Set(cityById[place.cityId].days.filter(day => day.stops.some(stop => aliases.some(alias => compact(stop.title).includes(alias)))).map(day => day.transport))];
    return reply(`${place.title}的交通与接驳：\n${transport.length ? transport.join('\n') : '站内尚未整理这个景点的具体接驳线路，请先查地图与景区官方交通说明。'}\n\n景点提示：${place.tips.join(' ')}\n\n这里不提供实时导航、具体班次或准确车程。请在地图中确认景区入口、换乘点和返程方式。`, place.cityId, [placeAction(place), planAction(place.cityId)]);
  }
  if (place && routeIntent && !familyIntent && !seasonIntent && !budgetIntent) return placeReply(place);
  if (city && transportIntent) return reply(`${city.shortName}到达与接驳：\n${city.arrival}\n\n不提供实时班次或导航车程；山区和船游提前确认返程接驳。`, city.id, placeActions);
  if (city && familyIntent) {
    const familyPlaces = findDestinations(city.id, '', 'family', []).slice(0, 3);
    return reply(`${city.shortName}慢一点玩，可以先围绕一个片区安排。${familyPlaces.length ? `站内亲子研学去处可先了解：${familyPlaces.map(item => item.title).join('、')}。` : `可先读“${city.days[0].title}”这一城市章节，再按体力取舍。`}\n\n规划时选择亲子或长辈同行，并选“轻松慢游”，下午活动会成为可选。山区台阶、儿童推车和无障碍通行须逐个景区核对，不保证索道覆盖全程。`, city.id, [...familyPlaces.map(placeAction), planAction(city.id)]);
  }
  if (city && seasonIntent) return reply(`${city.shortName}的季节与节奏建议：\n${city.season}\n\n这是站内的季节性建议，不是当期花期、叶色或天气预报。出发前再核对景区公告与天气。`, city.id, actions);
  if (city && budgetIntent) return reply(`${city.shortName}的预算可以先分成住宿、餐食、当地交通和景点项目四部分。打开规划后，按实际人数、天数、房间与预算档位计算预留额度。\n\n这是编辑设置的规划额度，不是实时报价；往返出发地与跨城大交通、租车等不默认包含。`, city.id, [planAction(city.id), cityAction(city.id)]);
  if (city && routeIntent && !(/多久|多长|时长/.test(q) && place)) {
    const count = Math.min(days || 2, city.days.length);
    const note = days && days > city.days.length ? `本站为${city.shortName}整理了 ${city.days.length} 个逐日章节，不能据此直接填满 ${days} 天。\n\n` : '';
    const outline = city.days.slice(0, count).map((day, index) => `第 ${index + 1} 天 · ${day.title}\n${day.stops.map(stop => stop.title).join(' → ')}\n这一餐：${day.meal}`).join('\n\n');
    return reply(`${note}${city.shortName}可以先参考这 ${count} 个逐日章节：\n\n${outline}\n\n时段是编辑建议，交通、排队与休息另外留余量。打开城市规划后，可继续调整天数、交通与预算。`, city.id, place ? [placeAction(place), planAction(city.id)] : actions);
  }
  if (place) return placeReply(place);
  if (places.length > 1) return reply(`你提到了${places.map(item => item.title).join('、')}。可以分别打开攻略，先比较停留时长和所在片区，再决定是否放在同一天。`, cityId, places.slice(0, 4).map(placeAction));
  if (city && mentionedCities.length === 1 && [city.name, city.shortName].some(name => compact(name) === normalized)) return reply(`${city.shortName}：${city.tagline}\n\n${city.intro}\n\n你想先了解住宿、美食、交通，还是逐日路线？`, city.id, actions);
  return reply('我目前只会查本站的湖北旅行和使用资料，这个问题还没有匹配到合适的答案。可以带上城市，换成“住哪里”“吃什么”“怎么去”或“怎么玩”试试。', cityId, actions, [], citySuggestions(city));
}

export function answerSupport(question: string, context: SupportContext = {}): SupportReply {
  const result = answerGuide(question, context);
  if (!context.trip || result.context.trip) return result;
  const previous = copyTripDraft(context.trip), cityIds = previous.cityIds || [];
  const otherDestination = typeof question === 'string' && /北京|上海|天津|重庆|广州|深圳|成都|杭州|南京|长沙|西安|洛阳|苏州|桂林|厦门|青岛|三亚|大理|丽江|张家界|郑州|济南|昆明|贵阳|海口|拉萨|乌鲁木齐|哈尔滨|长春|沈阳|太原|石家庄|福州|南昌|合肥|南宁|兰州|银川|西宁|呼和浩特|香港|澳门|台湾|云南|四川|贵州|湖南|广东|广西|河南|河北|浙江|江苏|山东|山西|陕西|海南|福建|江西|安徽|甘肃|青海|宁夏|新疆|西藏|内蒙古|辽宁|吉林|黑龙江/.test(question);
  if (!result.context.cityId && otherDestination) return result;
  if (result.context.cityId && cityIds.length && !cityIds.includes(result.context.cityId)) return result;
  const profile = planSupportTrip(previous).plan;
  let actions = result.actions;
  if (profile) {
    const resume: SupportAction = { kind: 'plan', cityId: profile.cityId, label: '继续调整这份行程', profile: { ...profile, indices: [...profile.indices] } };
    actions = actions.some(action => action.kind === 'plan')
      ? actions.map(action => action.kind === 'plan' && !action.profile ? resume : action)
      : [resume, ...actions];
  }
  return { ...result, actions, context: { ...result.context, trip: previous } };
}
