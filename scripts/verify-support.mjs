import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cities, cityById, destinations, destinationById } = await server.ssrLoadModule('/src/data.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { templates } = await server.ssrLoadModule('/src/planning.ts');
  const { travelFaq } = await server.ssrLoadModule('/src/data/help.ts');
  const { answerSupport } = await server.ssrLoadModule('/src/support.ts');
  const before = JSON.stringify({ cities, destinations, practical, templates });
  const sourceUrls = new Set(cities.flatMap(city => city.sources.map(source => source.url)));
  const templateIds = new Set(templates.map(template => template.id));
  const allowedActions = new Set(['city', 'place', 'plan', 'template', 'wishlist', 'explore']);
  let checked = 0;

  function ask(question, context = {}) {
    const originalContext = JSON.stringify(context);
    const reply = answerSupport(question, context);
    assert.equal(JSON.stringify(context), originalContext, 'Question answering must not rewrite caller context.');
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
    }
    assert(reply.suggestions.every(value => typeof value === 'string' && value.length > 0 && value.length <= 240));
    checked++;
    return reply;
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
  assert(seven.actions.some(action => action.kind === 'template' && action.templateId === 'hubei-seven'));
  assert(['武汉', '宜昌', '恩施'].every(name => seven.text.includes(name)), 'A cross-city answer must cover the whole route.');
  const five = ask('宜昌和恩施五天路线');
  assert(five.actions.some(action => action.kind === 'template' && action.templateId === 'west-five'));
  for (const question of ['武汉十二天行程', '武汉12天行程']) {
    const longerTrip = ask(question);
    assert(longerTrip.text.includes('12 天'), 'Long durations must not be truncated to the last digit.');
    assert(/不能.*填满/.test(longerTrip.text), 'Do not invent more itinerary chapters than the site contains.');
  }
  const season = ask('恩施适合什么季节去？');
  assert.equal(season.context.cityId, 'enshi');
  assert(season.text.includes(cityById.enshi.season), 'Season advice should use the existing city guide.');
  const family = ask('带孩子去武汉，行程怎么放慢？');
  assert.equal(family.context.cityId, 'wuhan');
  assert(/休息|慢游|体力|亲子|孩子/.test(family.text));
  assert(family.actions.some(action => action.kind === 'plan' && action.cityId === 'wuhan'));
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
  assert(!mixedCityName.context.cityId && /武汉/.test(mixedCityName.text) && /宜昌/.test(mixedCityName.text), 'A non-overlapping nickname still identifies a second city.');

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

  assert.equal(JSON.stringify({ cities, destinations, practical, templates }), before, 'Question answering must not mutate source travel content.');
  console.log(JSON.stringify({ result: 'passed', questions: checked, cities: cities.length, checks: '17-city stay/food/follow-up, aliases, cross-city templates, live data and booking boundaries, references, actions, unknown/long input, immutability' }, null, 2));
} finally {
  await server.close();
}
