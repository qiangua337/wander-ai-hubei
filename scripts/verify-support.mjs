import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cities, cityById, destinations, destinationById } = await server.ssrLoadModule('/src/data.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { templates, buildTrip, estimateBudget, normalizeProfile, recommendDays } = await server.ssrLoadModule('/src/planning.ts');
  const { travelFaq } = await server.ssrLoadModule('/src/data/help.ts');
  const { answerSupport, planSupportTrip } = await server.ssrLoadModule('/src/support.ts');
  const before = JSON.stringify({ cities, destinations, practical, templates });
  const sourceUrls = new Set(cities.flatMap(city => city.sources.map(source => source.url)));
  const templateIds = new Set(templates.map(template => template.id));
  const allowedActions = new Set(['city', 'place', 'plan', 'template', 'wishlist', 'explore']);
  let checked = 0;

  function checkReply(reply) {
    assert(reply && typeof reply === 'object');
    assert.equal(typeof reply.text, 'string');
    assert(reply.text.length > 0 && reply.text.length < 5000, 'Answers must be nonempty and bounded.');
    assert(!/<(?:script|img|iframe|svg|div|a|p|span)\b/i.test(reply.text), 'Replies are plain text, not user-supplied HTML.');
    assert(Array.isArray(reply.sources) && Array.isArray(reply.actions) && Array.isArray(reply.suggestions));
    assert(reply.context && typeof reply.context === 'object');
    if (reply.context.cityId) assert(Object.hasOwn(cityById, reply.context.cityId));
    for (const source of reply.sources) {
      assert.equal(typeof source.title, 'string');
      assert(source.title.length > 0);
      assert(source.url.startsWith('https://') && sourceUrls.has(source.url), 'Only existing official sources are allowed.');
    }
    for (const action of reply.actions) {
      assert(allowedActions.has(action.kind));
      assert.equal(typeof action.label, 'string');
      assert(action.label.length > 0);
      if (action.cityId) assert(Object.hasOwn(cityById, action.cityId));
      if (action.placeId) assert(Object.hasOwn(destinationById, action.placeId));
      if (action.templateId) assert(templateIds.has(action.templateId));
      if (action.kind === 'city' || action.kind === 'plan') assert(action.cityId);
      if (action.kind === 'place') assert(action.placeId);
      if (action.kind === 'template') assert(action.templateId);
      if (action.profile) {
        assert.equal(action.kind, 'plan', 'A complete profile opens the existing planner.');
        assert.deepEqual(normalizeProfile(action.profile), action.profile, 'The planner action must carry a valid complete profile.');
      }
    }
    if (reply.plan) {
      assert.deepEqual(normalizeProfile(reply.plan), reply.plan, 'Plan previews use the same normalized profile as the planner.');
      assert(buildTrip(reply.plan).length > 0, 'A generated plan must contain actual editorial days.');
      const action = reply.actions.find(item => item.kind === 'plan' && item.profile);
      assert(action && /带入规划.*调整/.test(action.label), 'A generated plan needs a clear path to continue editing.');
      assert.deepEqual(action.profile, reply.plan, 'Opening the planner must preserve every generated setting.');
    }
    assert(reply.suggestions.every(value => typeof value === 'string' && value.length > 0 && value.length <= 240));
    checked++;
    return reply;
  }
  function ask(question, context = {}) {
    const originalContext = JSON.stringify(context);
    const reply = answerSupport(question, context);
    assert.equal(JSON.stringify(context), originalContext, 'Question answering must not rewrite caller context.');
    return checkReply(reply);
  }
  function planDraft(draft) {
    const original = JSON.stringify(draft);
    const reply = planSupportTrip(draft);
    assert.equal(JSON.stringify(draft), original, 'Structured planning must not mutate its input.');
    return checkReply(reply);
  }

  // Data-backed answers must work beyond the three cities featured on the home page.
  for (const city of cities) {
    const stay = ask(`${city.shortName}住哪里比较顺路？`);
    assert.equal(stay.context.cityId, city.id);
    assert(stay.text.includes(practical[city.id].stays[0].area), `${city.shortName} needs its own stay information.`);
    const food = ask(`${city.shortName}吃什么？`);
    assert.equal(food.context.cityId, city.id);
    assert(food.text.includes(practical[city.id].food[0].order) || city.food.some(name => food.text.includes(name)), `${city.shortName} needs its own local food information.`);
    const arrival = ask('那怎么去？', stay.context);
    assert.equal(arrival.context.cityId, city.id);
    assert(arrival.text.includes(city.arrival), 'A follow-up should retain the city and use its travel advice.');
  }

  const missingCity = ask('推荐住在哪里？');
  assert(/城市|目的地|哪里|哪座|哪里玩/.test(missingCity.text));
  assert(!missingCity.context.cityId, 'Do not silently assume Wuhan when a city is required.');
  const crossTransport = ask('跨城交通怎么安排？');
  assert(crossTransport.text.includes(travelFaq.find(item => item.q.includes('不自驾')).a), 'The suggested transport follow-up must offer existing practical guidance.');
  assert(/跨城日/.test(crossTransport.text) && crossTransport.actions.some(action => action.kind === 'explore'));
  const genericFamily = ask('带孩子怎么放慢节奏？');
  assert(genericFamily.text.includes(travelFaq.find(item => item.q.includes('带孩子')).a), 'The suggested family follow-up must reuse the existing accessibility and pace advice.');
  assert(genericFamily.actions.some(action => action.kind === 'explore') && !genericFamily.context.cityId);

  const seven = ask('武汉宜昌恩施七天怎么安排？');
  assert(!seven.plan && /人数|几位|几人|多少人/.test(seven.text), 'Ask for the missing party rather than generating a default party.');
  assert.equal(seven.context.trip?.days, 7);
  assert.deepEqual(new Set(seven.context.trip?.cityIds), new Set(['wuhan', 'yichang', 'enshi']));
  const five = ask('宜昌和恩施五天路线');
  assert(!five.plan && five.context.trip?.days === 5 && /人数|几位|几人|多少人/.test(five.text));
  for (const question of ['武汉十二天行程', '武汉12天行程']) {
    const longerTrip = ask(question);
    assert(longerTrip.text.includes('12 天'), 'Long durations must not be truncated to the last digit.');
    assert(!longerTrip.plan && /不能|最多|超出|章节|现有/.test(longerTrip.text), 'Do not invent more itinerary chapters than the site contains.');
  }
  const season = ask('恩施适合什么季节去？');
  assert.equal(season.context.cityId, 'enshi');
  assert(season.text.includes(cityById.enshi.season), 'Season advice should use the existing city guide.');
  const family = ask('带孩子去武汉，行程怎么放慢？');
  assert.equal(family.context.cityId, 'wuhan');
  assert(/休息|慢游|体力|亲子|孩子/.test(family.text));
  assert(family.actions.some(action => action.kind === 'plan' && action.cityId === 'wuhan') || family.context.trip?.group === 'family');
  const budget = ask('武汉预算怎么安排？');
  assert.equal(budget.context.cityId, 'wuhan');
  assert(/预算|预留|人数|档位/.test(budget.text));
  assert(budget.actions.some(action => action.kind === 'plan' && action.cityId === 'wuhan'));

  for (const [question, cityId, placeId] of [
    ['省博怎么玩？', 'wuhan', 'hubei-museum'],
    ['黄鹤楼值得看什么？', 'wuhan', 'wuhan'],
    ['武当山建议玩多久？', 'shiyan', 'wudang'],
  ]) {
    const reply = ask(question);
    assert.equal(reply.context.cityId, cityId);
    assert(reply.actions.some(action => action.kind === 'place' && action.placeId === placeId));
  }
  const tower = ask('黄鹤楼怎么玩？');
  assert(tower.text.includes(destinationById.wuhan.overview), 'A place question should start from the place guide.');
  assert(!tower.text.includes('逐日章节'), 'A place question must not be replaced by a whole-city route.');
  const towerTransport = ask('黄鹤楼怎么去？');
  assert(!towerTransport.text.includes(cityById.wuhan.arrival), 'City railway arrival is not a place connection.');
  assert(/黄鹤楼/.test(towerTransport.text) && /接驳|换乘|交通/.test(towerTransport.text));
  assert(towerTransport.actions.some(action => action.kind === 'place' && action.placeId === 'wuhan'));
  const qianjiang = ask('潜江城市美食有什么？');
  assert.equal(qianjiang.context.cityId, 'qianjiang', 'A city name takes priority over an overlapping nickname substring.');
  assert(qianjiang.text.includes(practical.qianjiang.food[0].order));
  const mixedCityName = ask('汉口和宜昌怎么安排？');
  assert(!mixedCityName.context.cityId && ((/武汉/.test(mixedCityName.text) && /宜昌/.test(mixedCityName.text)) || ['wuhan', 'yichang'].every(id => mixedCityName.context.trip?.cityIds?.includes(id))), 'A non-overlapping nickname still identifies a second city.');

  const ambiguousChibi = ask('赤壁怎么玩？');
  assert(/东坡/.test(ambiguousChibi.text) && /三国/.test(ambiguousChibi.text), 'An ambiguous Chibi question must distinguish the two travel places.');
  assert(!ambiguousChibi.context.cityId, 'Do not choose one Chibi location without clarification.');
  const dongpo = ask('黄冈东坡赤壁怎么玩？');
  assert.equal(dongpo.context.cityId, 'huanggang');
  assert(dongpo.actions.some(action => action.kind === 'place' && action.placeId === 'dongpo'));
  const threeKingdoms = ask('三国赤壁怎么玩？');
  assert.equal(threeKingdoms.context.cityId, 'xianning');
  assert(threeKingdoms.actions.some(action => action.kind === 'place' && action.placeId === 'chibi'));

  for (const question of ['今天武汉天气怎么样？', '黄鹤楼现在门票多少钱？', '宜昌酒店今晚房价多少？', '帮我预订明天恩施大峡谷的票']) {
    const reply = ask(question);
    assert(/无法|不能|不提供|不支持|未接入|没有接入|非实时|不是实时|不能实时|暂无实时|不具备/.test(reply.text), 'Live questions must disclose the limitation.');
    assert(!/¥\s*\d|\d+\s*(?:℃|摄氏度)/.test(reply.text), 'No invented current prices or temperatures.');
    assert(!/预订成功|订单已创建|已为你预约|当前票价为|实时余票为/.test(reply.text), 'Never claim to complete bookings or look up inventory.');
    assert(reply.sources.length > 0 && reply.actions.length > 0, 'Known destinations should offer official source and planning paths.');
  }
  for (const question of ['湖北省博物馆今天几点闭馆？', '湖北省博物馆几点关门？', '湖北省博物馆现在开放吗？']) {
    const closing = ask(question);
    assert(/无法|不能|不提供/.test(closing.text) && /当期开放时间/.test(closing.text), 'Closing and opening questions require a current-data boundary.');
    assert(!/\d{1,2}[：:]\d{2}/.test(closing.text), 'Do not invent a closing time.');
    assert(!/房价|空房|余票|支付|退款/.test(closing.text), 'An opening-time answer should stay focused on opening times.');
  }
  for (const [question, topic, irrelevant] of [
    ['黄鹤楼门票多少钱？', /票价/, /房价|空房|支付|退款/],
    ['湖北省博物馆怎么预约？', /预约/, /票价|房价|空房|支付|退款/],
    ['宜昌酒店今晚房价多少？', /房价/, /票价|余票|支付|退款/],
    ['宜昌酒店还有空房吗？', /空房/, /票价|房价|余票|支付|退款/],
  ]) {
    const focused = ask(question);
    assert(/无法|不能|不提供/.test(focused.text) && topic.test(focused.text), 'Each current-data answer should name the requested information.');
    assert(!irrelevant.test(focused.text), 'Avoid unrelated prices, inventory, or payment caveats.');
    assert(/官方/.test(focused.text) && focused.sources.length > 0, 'Keep a path to official confirmation.');
  }

  const unknown = ask('请解一道量子力学方程');
  assert(/旅行|攻略|湖北|暂|试试|可以|目前/.test(unknown.text));
  const unknownWithCity = ask('哈哈哈哈哈哈', { cityId: 'wuhan' });
  assert(!unknownWithCity.text.includes(cityById.wuhan.intro), 'Unrelated text must not receive an unrelated city guide as if it answered the question.');
  const tooLong = ask('甲'.repeat(10000));
  assert(tooLong.text.length < 2000 && !tooLong.text.includes('甲'.repeat(300)), 'Long input must be handled without echoing it.');
  const outside = ask('北京住哪里？', { cityId: 'wuhan' });
  assert(!outside.text.includes(practical.wuhan.stays[0].area), 'An explicit out-of-province city must not inherit Wuhan stay advice.');
  assert(/北京|湖北|范围|未收录/.test(outside.text));
  const outsideWeather = ask('北京明天天气怎么样？', { cityId: 'wuhan' });
  assert(!outsideWeather.context.cityId && !outsideWeather.text.includes('武汉'), 'Explicit outside destinations must clear context before a weather answer.');
  assert(outsideWeather.sources.length === 0 && !outsideWeather.actions.some(action => action.cityId === 'wuhan'));
  const freePlaces = ask('武汉哪些景点免费？');
  assert(/无法/.test(freePlaces.text) && /门票收费|优惠/.test(freePlaces.text), 'Place charges need current official confirmation.');
  assert(!/隐私|无需注册/.test(freePlaces.text) && freePlaces.sources.length > 0);
  const siteCost = ask('小游是否收费？');
  assert(/免费/.test(siteCost.text) && /无需.*key/.test(siteCost.text), 'Website costs should be answered as a site-use question.');
  assert(!/无法查询/.test(siteCost.text));
  const sharing = ask('武汉行程怎么保存分享？');
  assert(/保存|浏览器/.test(sharing.text) && /分享/.test(sharing.text), 'Site-use intent takes priority over a mentioned city.');
  assert(!sharing.text.includes(cityById.wuhan.intro));
  const human = ask('我想找真人退票付款');
  assert(/没有|不提供|不支持|不能|未|暂无|并非/.test(human.text) && /人工|真人|订单|支付|预订/.test(human.text), 'Do not invent an order service or human support.');
  assert(!/1[3-9]\d{9}|微信号|转账到|付款成功|退款成功/.test(human.text));
  ask('<script>alert(1)</script>');
  ask('住哪里？', { cityId: '__proto__' });

  // A complete trip uses the existing planner's day, stay, food, and transport data.
  for (const city of cities) {
    const result = planDraft({ cityIds: [city.id], days: 1, party: 2, interest: 'balanced' });
    assert(result.plan, `${city.shortName} needs a usable one-day plan.`);
    assert.equal(result.plan.cityId, city.id);
    assert.equal(result.plan.party, 2);
    const days = buildTrip(result.plan);
    assert.equal(days.length, 1);
    assert(days.every(day => day.stops.length && day.meal && day.transport && day.overnight));
    assert(result.sources.length > 0, 'Generated itineraries keep official reference links.');
  }

  const pendingCity = ask('帮我规划3天行程，2人，喜欢山水');
  assert(!pendingCity.plan && /城市|目的地|哪座/.test(pendingCity.text));
  assert.equal(pendingCity.context.trip?.days, 3);
  assert.equal(pendingCity.context.trip?.party, 2);
  assert.equal(pendingCity.context.trip?.interest, 'nature');
  const pendingDays = ask('帮我规划恩施行程，2人，喜欢山水');
  assert(!pendingDays.plan && /天|多久/.test(pendingDays.text));
  const missingPeople = ask('恩施3天喜欢山水，帮我安排具体行程');
  assert(!missingPeople.plan && /人数|几位|几人|多少人/.test(missingPeople.text));
  const familyTrip = ask('2大1小，不自驾，轻松一点', missingPeople.context);
  assert(familyTrip.plan, 'Party and preferences complete the existing planning conversation.');
  assert.equal(familyTrip.plan.party, 3);
  assert.equal(familyTrip.plan.group, 'family');
  assert.equal(familyTrip.plan.mode, 'public', 'Negated self-drive must not match the positive self-drive intent.');
  assert.equal(familyTrip.plan.pace, 'relaxed');
  assert.equal(familyTrip.plan.interest, 'nature');
  assert.equal(buildTrip(familyTrip.plan).length, 3);
  assert(buildTrip(familyTrip.plan).every(day => /可选|弹性/.test(day.stops[1].detail + day.stops[1].time)));

  const chineseTrip = ask('恩施三天，两大一小，带娃轻松玩，喜欢山水，不自驾');
  assert(chineseTrip.plan, 'Chinese day and party numbers should generate the same usable plan.');
  assert.equal(chineseTrip.plan.party, 3);
  assert.equal(buildTrip(chineseTrip.plan).length, 3);
  assert.equal(chineseTrip.plan.group, 'family');
  assert.equal(chineseTrip.plan.mode, 'public');
  const seniorTrip = ask('武汉两天，3人带长辈，喜欢人文，安排一下行程');
  assert(seniorTrip.plan && seniorTrip.plan.group === 'senior' && seniorTrip.plan.pace === 'relaxed');
  assert.equal(seniorTrip.plan.interest, 'culture');
  const defaults = ask('武汉2天2人，帮我规划具体行程');
  assert(defaults.plan && defaults.plan.mode === 'public' && defaults.plan.interest === 'balanced' && defaults.plan.budget === 'comfort');
  assert(/公共交通|接驳/.test(defaults.text) && /综合|经典/.test(defaults.text), 'Defaults should be disclosed rather than silently attributed to the visitor.');

  const collectedCity = ask('恩施', ask('帮我规划具体行程').context);
  assert(!collectedCity.plan && collectedCity.context.trip?.cityIds?.includes('enshi'));
  const collectedDays = ask('三天', collectedCity.context);
  assert(!collectedDays.plan && collectedDays.context.trip?.days === 3);
  const collectedParty = ask('两大一小，喜欢山水，不自驾', collectedDays.context);
  assert(collectedParty.plan && collectedParty.plan.party === 3 && buildTrip(collectedParty.plan).length === 3, 'Short replies must fill the requested missing slots.');

  const originalFamilyPlan = JSON.stringify(familyTrip.plan);
  const adjustedDays = ask('改成2天', familyTrip.context);
  assert(adjustedDays.plan && buildTrip(adjustedDays.plan).length === 2 && adjustedDays.plan.party === 3);
  const adjustedPeople = ask('改成4人，朋友同行', adjustedDays.context);
  assert(adjustedPeople.plan && adjustedPeople.plan.party === 4);
  const adjustedMode = ask('换成自驾', adjustedPeople.context);
  assert(adjustedMode.plan && adjustedMode.plan.mode === 'drive' && adjustedMode.plan.party === 4);
  const adjustedInterest = ask('我喜欢美食', adjustedMode.context);
  assert(adjustedInterest.plan && adjustedInterest.plan.interest === 'food' && adjustedInterest.plan.mode === 'drive');
  const adjustedPace = ask('还是经典节奏，下午也玩', familyTrip.context);
  assert(adjustedPace.plan && adjustedPace.plan.pace === 'classic', 'An explicit pace must override the family default.');
  for (const question of ['2026年12月8日出发', '2026-12-08']) {
    const dateOnly = ask(question, familyTrip.context);
    assert(dateOnly.plan && dateOnly.plan.date === '2026-12-08' && buildTrip(dateOnly.plan).length === 3, 'A direct departure date must update the existing plan without requiring a modification keyword or turning day-of-month into trip duration.');
    assert.equal(dateOnly.plan.party, familyTrip.plan.party);
  }
  for (const question of ['不想自驾', '不要自驾']) {
    const noDrive = ask(question, adjustedMode.context);
    assert(noDrive.plan && noDrive.plan.mode === 'public', 'Negated driving preferences must override an existing drive plan.');
  }
  const cheaperTrip = ask('想省钱一点', familyTrip.context);
  assert(cheaperTrip.plan && cheaperTrip.plan.budget === 'value' && cheaperTrip.plan.party === 3, 'Direct valid preferences should continue the existing trip even without saying change.');
  for (const question of ['不要太赶', '不太累']) {
    const easierTrip = ask(question, defaults.context);
    assert(easierTrip.plan && easierTrip.plan.pace === 'relaxed', 'Common unhurried-pace phrases should map to the existing relaxed option.');
  }
  assert.equal(JSON.stringify(familyTrip.plan), originalFamilyPlan, 'Follow-up edits must not mutate an earlier answer or its planner action.');
  const stayWhilePlanning = ask('恩施住哪里方便？', familyTrip.context);
  assert(!stayWhilePlanning.plan && stayWhilePlanning.text.includes(practical.enshi.stays[0].area));
  assert.deepEqual(stayWhilePlanning.context.trip, familyTrip.context.trip, 'A practical city question should not discard the accumulated trip preferences.');
  const foodWhilePlanning = ask('恩施有什么好吃的？', stayWhilePlanning.context);
  assert(!foodWhilePlanning.plan && foodWhilePlanning.text.includes(practical.enshi.food[0].order), 'Food discovery is not automatically a request to edit the trip.');
  assert.deepEqual(foodWhilePlanning.context.trip, familyTrip.context.trip);
  const ordinaryFood = ask('恩施有什么美食推荐？', familyTrip.context);
  assert(!ordinaryFood.plan && ordinaryFood.text.includes(practical.enshi.food[0].order), 'An ordinary food query must not change the trip interest merely because it contains food.');
  const ordinaryTransport = ask('公共交通怎么安排？', familyTrip.context);
  assert(!ordinaryTransport.plan && ordinaryTransport.text.includes(cityById.enshi.arrival), 'An ordinary public-transport query should answer transport rather than regenerate the plan.');
  const placeWhilePlanning = ask('黄鹤楼怎么玩？', defaults.context);
  assert(!placeWhilePlanning.plan && placeWhilePlanning.actions.some(action => action.kind === 'place' && action.placeId === 'wuhan'));
  const sharingWhilePlanning = ask('这份行程怎么保存分享？', familyTrip.context);
  assert(!sharingWhilePlanning.plan && /分享/.test(sharingWhilePlanning.text));
  assert.deepEqual(sharingWhilePlanning.context.trip, familyTrip.context.trip);
  const outsideWhilePlanning = ask('北京住哪里？', familyTrip.context);
  assert(!outsideWhilePlanning.plan && !outsideWhilePlanning.context.trip, 'A named outside destination must not leave a stale Hubei itinerary active.');

  for (const party of [0, -1, 7, 2.5]) {
    const rejected = planDraft({ cityIds: ['enshi'], days: 2, party });
    assert(!rejected.plan && /人数|人|1.*6|一.*六/.test(rejected.text), 'Unsupported party values must not silently become two people.');
  }
  for (const days of [0, -1, 2.5, 12]) {
    const rejected = planDraft({ cityIds: ['wuhan'], days, party: 2 });
    assert(!rejected.plan && /天|章节/.test(rejected.text), 'Unsupported durations must not silently become a shorter plan.');
  }
  const tooManyPeople = ask('恩施2天，7人，帮我规划行程');
  assert(!tooManyPeople.plan && /人数|1.*6|一.*六/.test(tooManyPeople.text));
  const badCity = planDraft({ cityIds: ['__proto__'], days: 2, party: 2 });
  assert(!badCity.plan, 'An invalid city cannot fall back to Wuhan.');
  const badDate = planDraft({ cityIds: ['wuhan'], days: 2, party: 2, date: '2026-02-30' });
  assert(!badDate.plan && /日期|有效/.test(badDate.text), 'Invalid dates need a correction rather than being silently erased.');
  const calendar = ask('2026年12月8日去恩施玩三天，两位大人一位小孩，不自驾');
  assert(calendar.plan && calendar.plan.indices.length === 3 && calendar.plan.party === 3, 'Calendar dates are not itinerary durations, and classifiers do not turn adult counts into total counts.');
  assert.equal(calendar.plan.date, '2026-12-08');
  assert.equal(calendar.plan.group, 'family');
  const pendingWithStay = ask('3个人，住哪里方便？', missingPeople.context);
  assert(pendingWithStay.plan && pendingWithStay.plan.party === 3, 'Supplying the missing party can still complete a trip when the reply also asks about stays.');
  for (const question of ['武汉2.5天2人行程', '武汉2天2.5人行程']) {
    const fractional = ask(question);
    assert(!fractional.plan && /整数|人数|1–6/.test(fractional.text), 'Fractional natural-language counts must not be truncated to their last digit.');
  }
  const dated = planDraft({ cityIds: ['wuhan'], days: 2, party: 2, date: '2026-11-10', mode: 'drive', budget: 'value', pace: 'classic', interest: 'culture' });
  assert(dated.plan && dated.plan.date === '2026-11-10' && dated.plan.budget === 'value' && dated.plan.mode === 'drive');
  const stayResume = ask('住哪里方便？', dated.context);
  assert(!stayResume.plan, 'A stay follow-up should not repeat the itinerary preview.');
  const stayResumeAction = stayResume.actions.find(action => action.kind === 'plan');
  assert.equal(stayResumeAction?.label, '继续调整这份行程');
  assert.deepEqual(stayResumeAction?.profile, dated.plan, 'Returning to the planner from a stay answer must retain the complete party, date, interests and transport profile.');
  const dietary = ask('恩施3天2人，喜欢山水，不吃辣，花生过敏，帮我规划行程');
  assert(dietary.plan && /不吃辣/.test(dietary.plan.note) && /花生过敏/.test(dietary.plan.note), 'Dietary notes should travel into the editable plan.');
  assert(!/已确保|保证无|已满足|完全满足/.test(dietary.text), 'Dietary requirements must not be presented as verified restaurant accommodations.');

  const sevenComplete = ask('3人，不自驾，亲子轻松一点', seven.context);
  assert(sevenComplete.plan && sevenComplete.plan.template === 'hubei-seven');
  assert.equal(buildTrip(sevenComplete.plan).length, 7);
  const sevenDays = buildTrip(sevenComplete.plan);
  assert(sevenDays.filter(day => day.transfer).length === 2, 'The existing cross-city transfer mornings must survive support planning.');
  assert(sevenDays.filter(day => day.transfer).every(day => /转场|交通/.test(day.stops[0].time) && /跨城/.test(day.transport)));
  const crossBudget = estimateBudget(sevenComplete.plan, sevenDays.length);
  assert.equal(crossBudget.rooms, 2);
  assert.equal(crossBudget.nights, 6);
  const fiveComplete = planDraft({ cityIds: ['yichang', 'enshi'], days: 5, party: 2, interest: 'food' });
  assert(fiveComplete.plan && fiveComplete.plan.template === 'west-five' && buildTrip(fiveComplete.plan).length === 5);
  assert(/固定|既定|主线|不改变|保留/.test(fiveComplete.text), 'Cross-city preference labels must not pretend to change a fixed template.');
  const fiveDated = ask('2026-12-08', fiveComplete.context);
  const sharingResume = ask('怎么保存分享行程？', fiveDated.context);
  assert(!sharingResume.plan, 'The save/share answer should remain a focused help answer.');
  assert.equal(sharingResume.actions[0]?.label, '继续调整这份行程');
  assert.deepEqual(sharingResume.actions[0]?.profile, fiveDated.plan, 'A cross-city FAQ without an existing city-plan action must add a resume action carrying its original date, people and interests.');
  const mismatchedCross = planDraft({ cityIds: ['yichang', 'enshi'], days: 7, party: 2 });
  assert(!mismatchedCross.plan && /5|五/.test(mismatchedCross.text), 'Do not silently compress or stretch the fixed cross-city route.');
  const unsupportedCross = planDraft({ cityIds: ['wuhan', 'enshi'], days: 4, party: 2 });
  assert(!unsupportedCross.plan, 'An unsupported city combination needs clarification, not an invented transfer route.');
  const arrivalNight = planDraft({ cityIds: ['enshi'], days: 2, party: 3, interest: 'nature' });
  assert(arrivalNight.plan);
  assert.deepEqual(arrivalNight.plan.indices, recommendDays('enshi', 2, 'nature'));
  const arrivalBudget = estimateBudget(arrivalNight.plan, buildTrip(arrivalNight.plan).length);
  assert(!arrivalBudget.arrivalNight && arrivalBudget.nights === 1 && arrivalBudget.rooms === 2, 'New support plans explicitly start from a full sightseeing day; they must not silently add an arrival night based only on chapter index.');
  assert.equal(arrivalNight.plan.arrival, 'full-day');
  assert(/首日.*完整游玩日/.test(arrivalNight.text));

  const relativeBase = ask('恩施3天3人，2026-12-08出发，喜欢山水，不自驾，轻松一点');
  const relativeBefore = JSON.stringify(relativeBase);
  for (const [question, expectedDays] of [['减少一天', 2], ['多玩一天', 4], ['天数加一天', 4]]) {
    const changed = ask(question, relativeBase.context);
    assert(changed.plan && buildTrip(changed.plan).length === expectedDays, 'A relative duration changes the existing duration rather than replacing it with the amount.');
    assert.equal(changed.plan.party, 3);
    assert.equal(changed.plan.pace, 'relaxed', 'More days must not silently switch a relaxed itinerary to a faster pace.');
    assert.equal(changed.plan.date, '2026-12-08');
  }
  for (const [question, expectedParty] of [['增加1人', 4], ['人数加一个', 4], ['减少一人', 2]]) {
    const changed = ask(question, relativeBase.context);
    assert(changed.plan && changed.plan.party === expectedParty, 'Relative party changes use the existing total.');
    assert.equal(buildTrip(changed.plan).length, 3);
    assert.equal(changed.plan.interest, 'nature');
  }
  const soloRelative = ask('增加1人', ask('恩施2天，我一个人').context);
  assert(soloRelative.plan && soloRelative.plan.party === 2 && soloRelative.plan.group === 'friends', 'Adding a companion should end the previous solo setting.');
  const noDayBase = ask('减少一天');
  assert(!noDayBase.plan && noDayBase.context.trip?.days === undefined && noDayBase.context.trip?.awaiting === 'days');
  assert(/原来|几天/.test(noDayBase.text), 'A relative change without a base must ask for the desired total.');
  const noPartyBase = ask('增加1人', missingPeople.context);
  assert(!noPartyBase.plan && noPartyBase.context.trip?.party === undefined && noPartyBase.context.trip?.awaiting === 'party');
  assert(/总共|原来/.test(noPartyBase.text));
  const relativeOverflow = ask('再玩两天', relativeBase.context);
  assert(!relativeOverflow.plan && relativeOverflow.context.trip?.days === 5, 'Relative durations still respect the city chapter limit.');
  const relativeZero = ask('减少3人', relativeBase.context);
  assert(!relativeZero.plan && relativeZero.context.trip?.party === 0, 'A relative total outside the party limit must be rejected rather than clamped.');
  const relativeWithStay = ask('增加1人，住哪里方便？', relativeBase.context);
  assert(relativeWithStay.plan && relativeWithStay.plan.party === 4, 'An explicit party increase should still apply when the request also asks where to stay.');
  assert.equal(JSON.stringify(relativeBase), relativeBefore, 'Relative edits do not rewrite the original itinerary.');

  for (const question of ['换到武汉', '换武汉吧', '改到武汉', '改成武汉']) {
    const switched = ask(question, relativeBase.context);
    assert(switched.plan && switched.plan.cityId === 'wuhan', 'Explicit city changes should continue the current itinerary.');
    assert.equal(switched.plan.party, 3);
    assert.equal(buildTrip(switched.plan).length, 3);
    for (const key of ['date', 'interest', 'pace', 'mode', 'budget']) assert.equal(switched.plan[key], relativeBase.plan[key], `Switching cities preserves ${key}.`);
  }
  const longerEnshi = ask('恩施4天3人，喜欢山水，不自驾');
  const shorterCity = ask('换到武汉', longerEnshi.context);
  assert(!shorterCity.plan && shorterCity.context.trip?.days === 4 && shorterCity.context.trip?.party === 3, 'Changing cities must not silently shorten a trip that exceeds the new city capacity.');
  assert.deepEqual(shorterCity.context.trip?.cityIds, ['wuhan']);
  const ordinaryOtherCity = ask('武汉住哪里？', relativeBase.context);
  assert(!ordinaryOtherCity.plan && !ordinaryOtherCity.context.trip, 'A normal guide query for another city does not silently rewrite the active itinerary.');

  for (const city of cities) {
    const complete = planDraft({ cityIds: [city.id], days: Math.min(2, city.days.length), party: 3, mode: 'public', pace: 'classic' });
    assert(complete.plan);
    for (const suggestion of complete.suggestions.filter(text => !/保存|分享/.test(text))) {
      const followed = ask(suggestion, complete.context);
      assert(followed.plan, `A suggested edit for ${city.shortName} must produce a supported itinerary.`);
      assert.notDeepEqual(followed.plan, complete.plan, 'Suggested edits should make a real change.');
    }
  }
  for (const template of templates.filter(item => item.segments.length > 1)) {
    const count = template.segments.reduce((total, segment) => total + segment.indices.length, 0);
    const complete = planDraft({ cityIds: template.segments.map(segment => segment.cityId), days: count, party: 4, mode: 'public', pace: 'classic' });
    assert(complete.plan && !complete.suggestions.some(text => /改成\d+天/.test(text)), 'Fixed cross-city plans must not suggest unsupported durations.');
    for (const suggestion of complete.suggestions.filter(text => !/保存|分享/.test(text))) {
      const followed = ask(suggestion, complete.context);
      assert(followed.plan && buildTrip(followed.plan).length === count, 'Cross-city suggested edits preserve the supported fixed duration.');
      assert.notDeepEqual(followed.plan, complete.plan, 'Cross-city suggested edits should make a real change.');
    }
    const wrongDuration = ask('改成3天', complete.context);
    assert(!wrongDuration.plan && wrongDuration.suggestions.length > 0);
    for (const suggestion of wrongDuration.suggestions) {
      const recovered = ask(suggestion, wrongDuration.context);
      assert(recovered.plan && buildTrip(recovered.plan).length === count, 'Duration correction chips should recover the route instead of repeating an error.');
    }
  }
  for (const question of ['帮我安排湖北7天4人旅行', '帮我安排湖北5天3人旅行', '武汉和恩施4天3人行程', '帮我安排湖北12天3人行程']) {
    const chooseCity = ask(question);
    assert(!chooseCity.plan && chooseCity.context.trip?.awaiting === 'city' && chooseCity.suggestions.length > 0);
    for (const suggestion of chooseCity.suggestions) {
      const selectedCity = ask(suggestion, chooseCity.context);
      assert(selectedCity.plan, 'Destination suggestions must fit the requested duration or explicitly propose a supported duration in the chip.');
    }
  }
  for (const question of ['恩施3天3个人，其中1个小孩', '恩施三天，共三人，其中一位儿童', '恩施3天3个人，带1个孩子', '恩施3天，共3人，2大1小']) {
    const subset = ask(question);
    assert(subset.plan && subset.plan.party === 3 && subset.plan.group === 'family', 'A child subset must retain the stated total party and identify family travel.');
  }
  for (const question of ['恩施3天共3人，2大2小', '恩施3天3个人，其中4个小孩', '恩施3天3人，其中-1个小孩']) {
    const conflict = ask(question, relativeBase.context);
    assert(!conflict.plan && /人数|合计|整数/.test(conflict.text), 'Inconsistent or invalid adult/child counts still require correction.');
    assert.equal(conflict.context.trip?.party, 3, 'A rejected child subtotal must not overwrite the previous party size.');
  }

  // Core travel constraints must change the actual itinerary, not merely its labels.
  for (const [question, origin] of [
    ['从武汉出发，去恩施3天2人，喜欢山水', '武汉'],
    ['从北京出发，去恩施3天2人', '北京'],
    ['出发地是上海，想去恩施三天两个人', '上海'],
  ]) {
    const departing = ask(question);
    assert(!departing.plan && departing.context.trip?.origin === origin && departing.context.cityId === 'enshi' && departing.context.trip?.awaiting === 'arrival', 'A known departure from another city must clarify arrival instead of assuming sightseeing starts at 09:00.');
    assert.deepEqual(departing.suggestions, ['首日上午抵达', '首日下午抵达', '提前一晚抵达']);
    assert(!/尚未整理.*跨城模板/.test(departing.text));
    const confirmed = ask('首日下午抵达', departing.context);
    assert(confirmed.plan && confirmed.plan.origin === origin && confirmed.plan.cityId === 'enshi', 'Departure cities do not become extra sightseeing destinations.');
    assert(buildTrip(confirmed.plan).every(day => day.cityId === 'enshi'));
    const first = buildTrip(confirmed.plan)[0];
    assert(first.transport.includes(origin) && /交通|到达/.test(first.stops[0].time), 'Actual trip transport keeps the departure and removes pre-arrival sightseeing.');
    assert(!/恩施土司城/.test(first.stops[0].title) && /途中|出发地/.test(first.breakfast));
  }
  const originArrival = ask('从武汉出发，恩施3天2人');
  for (const [answer, arrival] of [['上午九点', 'morning'], ['下午两点', 'afternoon'], ['晚上八点', 'evening'], ['提前一晚抵达', 'previous-night']]) {
    const confirmed = ask(answer, originArrival.context);
    assert(confirmed.plan && confirmed.plan.arrival === arrival, 'Arrival clarification accepts normal short replies without asking the same question again.');
    if (arrival !== 'previous-night') assert(/交通|到达/.test(buildTrip(confirmed.plan)[0].stops[0].time));
  }
  const localDeparture = ask('从武汉出发，武汉2天2人');
  assert(localDeparture.plan && localDeparture.plan.arrival === 'full-day', 'A city-level local departure does not need a long-distance arrival clarification.');
  const localAlias = ask('从汉口出发，武汉2天2人');
  assert(localAlias.plan && localAlias.plan.origin === '汉口');
  const explicitFullDay = ask('从武汉出发，恩施3天2人，首日完整游玩');
  assert(explicitFullDay.plan && explicitFullDay.plan.arrival === 'full-day', 'An explicitly confirmed full sightseeing day is respected.');
  const departureOnly = ask('从武汉出发，三天2人');
  assert(!departureOnly.plan && departureOnly.context.trip?.origin === '武汉' && !departureOnly.context.cityId, 'A departure city alone is not a destination choice.');
  const scopedOutside = ask('从武汉出发，去北京3天2人');
  assert(!scopedOutside.plan && /湖北|范围/.test(scopedOutside.text), 'A non-Hubei sightseeing destination is still out of scope.');
  const cityLevelOrigin = planDraft({ cityIds: ['wuhan'], days: 2, party: 2, origin: '北京市海淀区某路88号', arrival: 'afternoon' });
  assert(cityLevelOrigin.plan && cityLevelOrigin.plan.origin === '北京市', 'The departure label must not retain an exact street address.');

  const limited = ask('恩施3天2人，老人不能爬山，少台阶');
  assert(limited.plan && limited.plan.mobility === 'gentle' && limited.plan.interest !== 'nature', 'A negative climbing requirement must not turn into a positive nature preference.');
  const limitedDays = buildTrip(limited.plan);
  assert(limitedDays.every(day => day.effort !== 'high'), 'A gentle plan actually excludes high-effort days.');
  assert(!limitedDays.some(day => day.stops.some(stop => /七星寨|云龙地缝/.test(stop.title))), 'The rejected mountain mainline must not survive under a slow-pace label.');
  const notEnoughGentle = ask('恩施4天2人，不能爬山');
  assert(!notEnoughGentle.plan && /只有|不能|高强度/.test(notEnoughGentle.text), 'Limited content cannot be padded with high-effort chapters.');
  const fixedGentle = ask('宜昌恩施5天2人，少台阶');
  assert(!fixedGentle.plan && /固定|高强度/.test(fixedGentle.text), 'Fixed templates with a high-effort chapter are not claimed as adapted.');
  const removeLimit = ask('取消少台阶限制', fixedGentle.context);
  assert(removeLimit.plan && removeLimit.plan.mobility === 'standard');
  const seniorMountain = ask('恩施3天2人，带老人，公共交通');
  assert(!seniorMountain.plan && seniorMountain.context.trip?.awaiting === 'mobility' && /台阶|山地/.test(seniorMountain.text), 'Unknown senior stamina must be clarified before offering a mountain plan.');
  assert.deepEqual(seniorMountain.suggestions, ['少台阶', '可以接受山地活动']);
  const seniorGentle = ask('少台阶', seniorMountain.context);
  assert(seniorGentle.plan && buildTrip(seniorGentle.plan).every(day => day.effort !== 'high'));
  const seniorAccepts = ask('可以接受山地活动', seniorMountain.context);
  assert(seniorAccepts.plan && seniorAccepts.plan.mobility === 'standard' && buildTrip(seniorAccepts.plan).some(day => day.effort === 'high'), 'Explicit acceptance completes the original mountain plan without a clarification loop.');
  const seniorDeclines = ask('不能接受山地活动', seniorMountain.context);
  assert(seniorDeclines.plan && seniorDeclines.plan.mobility === 'gentle' && buildTrip(seniorDeclines.plan).every(day => day.effort !== 'high'), 'A negative answer to the stamina question must not be parsed as consent.');

  for (const [question, arrival] of [
    ['武汉2天2人，上午九点到武汉', 'morning'],
    ['武汉2天2人，下午两点到武汉', 'afternoon'],
    ['武汉2天2人，14:00到武汉', 'afternoon'],
    ['武汉2天2人，晚上八点到武汉', 'evening'],
  ]) {
    const arriving = ask(question);
    assert(arriving.plan && arriving.plan.arrival === arrival);
    assert.equal(arriving.plan.indices[0], 0, 'The first chapter is the arrival buffer.');
    const first = buildTrip(arriving.plan)[0];
    assert(/交通|到达/.test(first.stops[0].time) && !/黄鹤楼/.test(first.stops[0].title), 'A morning arrival cannot retain the original morning sightseeing.');
    if (arrival !== 'morning') assert(!/户部巷|中华路/.test(first.stops[1].title), 'Afternoon or evening arrival also removes the original afternoon outing.');
    if (arrival === 'evening') assert(/入住|住宿/.test(first.stops[2].title) && !/江岸|夜游/.test(first.stops[2].title));
    assert(/出发地|途中/.test(first.breakfast), 'The breakfast recommendation must follow the arrival window.');
  }
  const arrivedNature = ask('恩施2天2人喜欢山水，下午到恩施');
  assert(arrivedNature.plan && arrivedNature.plan.indices[0] === 0 && /交通/.test(buildTrip(arrivedNature.plan)[0].stops[0].time));
  const previousNight = ask('恩施2天3人，喜欢山水，提前一晚到');
  assert(previousNight.plan && previousNight.plan.arrival === 'previous-night');
  assert(estimateBudget(previousNight.plan, 2).arrivalNight && estimateBudget(previousNight.plan, 2).nights === 2, 'Only the explicit previous-night choice adds that night to a new support plan.');

  const unspecifiedBudget = ask('武汉3天2人，预算2000元');
  assert(!unspecifiedBudget.plan && unspecifiedBudget.context.trip?.budgetLimit === 2000 && unspecifiedBudget.context.trip?.awaiting === 'budget-scope');
  assert(/全团|每个|每人/.test(unspecifiedBudget.text), 'A numeric amount needs a total versus per-person clarification.');
  const totalBudget = ask('全团总额', unspecifiedBudget.context);
  assert(totalBudget.plan && totalBudget.plan.budgetLimit === 2000 && totalBudget.plan.budgetScope === 'total' && totalBudget.plan.budget === 'value');
  const totalRange = estimateBudget(totalBudget.plan, buildTrip(totalBudget.plan).length).total;
  assert(totalRange[0] <= 2000 && totalRange[1] > 2000 && /不能保证|仍可能超/.test(totalBudget.text), 'A partly affordable planning range must disclose the possible overrun.');
  const clarifiedTotal = ask('不是每人，是全团总额', unspecifiedBudget.context);
  assert(clarifiedTotal.plan && clarifiedTotal.plan.budgetScope === 'total', 'A scope clarification must not retain the negated per-person interpretation.');
  const individualBudget = ask('预算按每人计算', unspecifiedBudget.context);
  assert(individualBudget.plan && individualBudget.plan.budgetScope === 'per-person' && individualBudget.text.includes('4,000'));
  const tooLowBudget = ask('武汉3天2人，总预算500元');
  assert(!tooLowBudget.plan && /超过|超出/.test(tooLowBudget.text), 'A target below the planning floor cannot produce a supposedly compliant plan.');
  const noLimit = ask('取消预算上限', totalBudget.context);
  assert(noLimit.plan && noLimit.plan.budgetLimit === undefined && noLimit.context.trip?.budgetLimit === undefined);
  for (const question of ['武汉3天2人预算2,000元', '武汉3天2人预算2k元']) {
    const formatted = ask(question);
    assert(!formatted.plan && formatted.context.trip?.budgetLimit === 2000 && formatted.context.trip?.awaiting === 'budget-scope');
  }
  const retainConstraints = ask('增加1人', ask('从武汉出发，恩施3天2人，少台阶，下午到，人均预算5000元').context);
  assert(retainConstraints.plan && retainConstraints.plan.party === 3);
  for (const [key, expected] of Object.entries({ origin: '武汉', mobility: 'gentle', arrival: 'afternoon', budgetScope: 'per-person', budgetLimit: 5000 })) assert.equal(retainConstraints.plan[key], expected, `A normal edit retains the travel constraint ${key}.`);

  const roundTrip = ask('从武汉出发，恩施3天2人，自驾，首日上午到');
  assert(roundTrip.plan && roundTrip.plan.mode === 'drive');
  for (const [question, departure] of [
    ['最后一天下午三点坐高铁回武汉', 'afternoon'],
    ['最后一天18:30回上海', 'evening'],
    ['最后一天早上走', 'morning'],
  ]) {
    const returning = ask(question, roundTrip.context);
    assert(returning.plan && returning.plan.departure === departure);
    assert.equal(returning.plan.origin, '武汉');
    assert.equal(returning.plan.cityId, 'enshi');
    assert.equal(returning.plan.arrival, 'morning');
    assert.equal(returning.plan.mode, 'drive', 'Intercity return transport does not override the local mode.');
    assert.equal(buildTrip(returning.plan).length, 3);
  }
  const explicitReturn = ask('武汉2天2人首日上午到最后一天下午3点的高铁返程');
  assert(explicitReturn.plan && explicitReturn.plan.arrival === 'morning' && explicitReturn.plan.departure === 'afternoon');
  assert(!buildTrip(explicitReturn.plan).at(-1).stops.some(stop => /省博|东湖/.test(stop.title)));
  const ambiguousReturn = ask('最后一天三点的高铁', roundTrip.context);
  assert(!ambiguousReturn.plan && ambiguousReturn.context.trip?.awaiting === 'departure');
  assert.equal(ask('下午', ambiguousReturn.context).plan?.departure, 'afternoon');
  const wrongDay = ask('第二天下午回家', roundTrip.context);
  assert(!wrongDay.plan && /第 2 天.*3 天/.test(wrongDay.text));
  const sameDayConflict = ask('武汉1天2人，下午到，下午返程');
  assert(!sameDayConflict.plan && /返程时段不晚于抵达时段/.test(sameDayConflict.text));
  assert.equal(ask('最后一天晚上返程', sameDayConflict.context).plan?.departure, 'evening');
  const clearedReturn = ask('返程时段待定', explicitReturn.context);
  assert(clearedReturn.plan && clearedReturn.plan.departure === 'flexible');
  assert(buildTrip(clearedReturn.plan).at(-1).stops.some(stop => /省博|东湖|湖北省博物馆/.test(stop.title)));

  const shortMorning = ask('武汉2天2人，最后一天下午才返程，上午想吃点东西再逛逛');
  assert(shortMorning.plan && buildTrip(shortMorning.plan).at(-1).returnMorning?.conditional);
  const confirmedReturn = ask('最后一天下午三点半从武昌火车站坐高铁回上海', shortMorning.context);
  assert(confirmedReturn.plan && confirmedReturn.plan.cityId === 'wuhan');
  assert.equal(confirmedReturn.plan.departureTime, '15:30');
  assert.equal(confirmedReturn.plan.departureStation, '武昌站');
  assert.match(confirmedReturn.text, /昙华林.*13:45.*14:30/);
  const longerConnection = ask('去车站要75分钟，取行李三十分钟', confirmedReturn.context);
  assert(longerConnection.plan);
  assert.deepEqual(longerConnection.plan.returnLogistics, { travelMinutes: 75, luggageMinutes: 30 });
  assert.deepEqual(buildTrip(longerConnection.plan).at(-1).stationSchedule, { finishBy: '12:30', leaveForStationBy: '13:00', arriveBy: '14:30' });
  assert.equal(longerConnection.plan.party, 2);
  assert.equal(longerConnection.plan.departureStation, '武昌站');
  const newStationWithBags = ask('返程站改成汉口站', longerConnection.context);
  assert.deepEqual(newStationWithBags.plan?.returnLogistics, { luggageMinutes: 30 });
  const noBags = ask('取行李0分钟', longerConnection.context);
  assert.equal(noBags.plan?.returnLogistics?.luggageMinutes, 0);
  const invalidConnection = ask('地图车程 500 分钟', longerConnection.context);
  assert(!invalidConnection.plan && /1–360/.test(invalidConnection.text));
  assert.deepEqual(invalidConnection.context.trip.returnLogistics, longerConnection.plan.returnLogistics);
  const changedTime = ask('返程时间改到16:10', confirmedReturn.context);
  assert.equal(changedTime.plan?.departureTime, '16:10');
  assert.equal(changedTime.plan?.departureStation, '武昌站');
  const arrivalAtRail = ask('首日下午三点到武汉站', confirmedReturn.context);
  assert.equal(arrivalAtRail.plan?.arrival, 'afternoon');
  assert.equal(arrivalAtRail.plan?.departureStation, '武昌站');
  const changedStation = ask('返程站改成汉口站', changedTime.context);
  assert.equal(changedStation.plan?.departureStation, '汉口站');
  assert.equal(changedStation.plan?.departureTime, '16:10');
  assert(!buildTrip(changedStation.plan).at(-1).returnMorning);
  const removeExact = ask('返程时段待定', confirmedReturn.context);
  assert.equal(removeExact.plan?.departure, 'flexible');
  assert.equal(removeExact.plan?.departureTime, undefined);
  const splitTime = ask('武汉2天2人，下午3点，武昌站返程');
  assert.equal(splitTime.plan?.departureTime, '15:00');
  assert.equal(splitTime.plan?.departureStation, '武昌站');
  const flight = ask('武汉2天2人，最后一天下午三点的飞机');
  assert.equal(flight.plan?.departureStation, '机场');
  assert(!buildTrip(flight.plan).at(-1).stationSchedule);

  assert.equal(JSON.stringify({ cities, destinations, practical, templates }), before, 'Question answering must not mutate source travel content.');
  console.log(JSON.stringify({ result: 'passed', questions: checked, cities: cities.length, checks: '17-city stay/food/follow-up and structured plans, conversational edits, Chinese party/day parsing, arrival and return scheduling, preferences, cross-city transfers, budgeting, references, live data boundaries, immutability' }, null, 2));
} finally {
  await server.close();
}
