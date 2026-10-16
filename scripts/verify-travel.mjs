import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cities, cityById, destinations, featuredDestinations, imageCredits } = await server.ssrLoadModule('/src/data.ts');
  const { findDestinations, planDays, selectPlanDays, planDate, formatPlan } = await server.ssrLoadModule('/src/travel.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { defaultProfile, normalizeProfile, validDate, recommendDays, buildTrip, estimateBudget, formatDetailedPlan, sharePlanUrl, parsePlanUrl, templates } = await server.ssrLoadModule('/src/planning.ts');
  const expectedCities = ['wuhan', 'yichang', 'enshi', 'shiyan', 'xiangyang', 'jingzhou', 'jingmen', 'huangshi', 'ezhou', 'huanggang', 'xianning', 'xiaogan', 'suizhou', 'xiantao', 'qianjiang', 'tianmen', 'shennongjia'];
  assert.deepEqual(cities.map(city => city.id).sort(), expectedCities.sort());
  assert.equal(destinations.length, 70);
  assert.equal(new Set(destinations.map(place => place.id)).size, 70);
  let dayCount = 0;
  for (const city of cities) {
    assert(destinations.filter(place => place.cityId === city.id).length >= 3, city.name);
    assert(city.days.length >= 2 && city.days.length <= 4, city.name);
    assert(city.sources.length > 0 && city.sources.every(source => source.url.startsWith('https://')), city.name);
    for (const day of city.days) {
      assert.equal(day.stops.length, 3, city.name);
      assert(day.stops.every(stop => stop.title.length > 1 && stop.detail.length >= 20), day.title);
      assert(day.transport && day.meal && day.tip, day.title);
      dayCount++;
    }
  }
  for (const place of destinations) {
    assert(cityById[place.cityId], place.id);
    assert(place.overview.length >= 35 && place.highlights.length >= 2 && place.tips.length >= 1, place.id);
  }
  assert.equal(featuredDestinations.length, 6);
  for (const place of featuredDestinations) {
    assert(place.image && fs.existsSync(path.join(root, 'public', place.image)), `Featured photo missing: ${place.id}`);
  }
  for (const photo of imageCredits) assert(photo.filename && fs.existsSync(path.join(root, 'public/images', photo.filename)), photo.subject);
  assert.equal(findDestinations('wuhan', '', 'all', []).length, 6);
  assert.equal(findDestinations('xianning', '', 'all', []).length, 5);
  assert.deepEqual(findDestinations('all', '云梦', 'all', []).map(place => place.id), ['yunmeng']);
  assert.equal(findDestinations('wuhan', '云梦', 'all', []).length, 0);
  assert(findDestinations('all', '', 'nature', []).every(place => place.category === 'nature'));
  assert.deepEqual(findDestinations('all', '', 'saved', ['enshi', 'shennongjia', 'unknown']).map(place => place.id), ['enshi', 'shennongjia']);
  assert.equal(findDestinations('all', '不存在的景点xyz', 'all', []).length, 0);
  const before = JSON.stringify(cityById.wuhan);
  const relaxed = planDays(cityById.wuhan, 2, 'relaxed');
  assert.equal(relaxed.length, 2);
  assert(relaxed.every(day => day.stops[1].title === '在原片区放慢脚步'));
  assert.equal(JSON.stringify(cityById.wuhan), before, 'Planning must not mutate source routes');
  assert.equal(planDays(cityById.wuhan, 100, 'classic').length, 3);
  assert.equal(planDays(cityById.wuhan, 0, 'classic').length, 1);
  assert.equal(planDays(cityById.wuhan, NaN, 'classic').length, 3);
  assert.deepEqual(findDestinations('all', '小龙虾', 'all', []).map(place => place.cityId), ['qianjiang', 'qianjiang', 'qianjiang']);
  const custom = selectPlanDays(cityById.yichang, [3, 1, 3, -1, 99, 1.2], 'classic');
  assert.deepEqual(custom.map(day => day.title), [cityById.yichang.days[1].title, cityById.yichang.days[3].title]);
  assert.equal(selectPlanDays(cityById.yichang, [], 'classic').length, 0);
  custom[0].stops[0].detail = 'Local change';
  assert.notEqual(cityById.yichang.days[1].stops[0].detail, 'Local change');
  assert(relaxed[0].stops[1].detail.includes(cityById.wuhan.days[0].stops[1].detail));
  assert.equal(planDate('2026-10-31', 1), '11月1日');
  assert.equal(planDate('', 1), '');
  assert.equal(planDate('not-a-date', 1), '');
  const customText = formatPlan(cityById.yichang, selectPlanDays(cityById.yichang, [3, 1], 'relaxed'), '2026-10-31', '3', 'relaxed', true);
  assert(customText.includes('自选章节提醒') && customText.includes('11月1日') && customText.includes('清江画廊') && !customText.includes('D3'));
  const text = formatPlan(cityById.wuhan, cityById.wuhan.days, '2026-10-31', '4');
  assert(text.includes('11月1日') && text.includes('4 位旅行者') && text.includes('交通：') && text.includes('资料来源'));
  assert.deepEqual(Object.keys(practical).sort(), cities.map(city => city.id).sort());
  for (const city of cities) {
    const info = practical[city.id];
    assert.equal(info.nights.length, city.days.length, `${city.id} overnight coverage`);
    assert.equal(info.kinds.length, city.days.length, `${city.id} day preference coverage`);
    assert.equal(info.stays.length, 2);
    assert.equal(info.food.length, 2);
    assert(info.stays.every(stay => stay.area && stay.bestFor && stay.reason && stay.check));
    const profile = { ...defaultProfile(city.id), indices: city.days.map((_, i) => i), party: 3, group: 'family', mode: 'drive', pace: 'relaxed' };
    const original = JSON.stringify(city);
    const itinerary = buildTrip(profile);
    assert.equal(itinerary.length, city.days.length);
    assert(itinerary.every(day => day.overnight && day.transport.includes('自驾') && day.tip.includes('同行节奏')));
    assert.equal(JSON.stringify(city), original);
    const output = formatDetailedPlan(profile);
    assert(output.includes('住宿片区') && output.includes('当晚住宿') && output.includes('吃什么、在哪吃') && output.includes('预算预留') && output.includes(city.sources[0].url));
  }
  assert(validDate('2028-02-29') && !validDate('2026-02-29') && !validDate('2026-13-01') && !validDate('2026-02-31'));
  const malicious = normalizeProfile({ cityId: 'toString', template: '__proto__', group: 'constructor', budget: 'toString', interest: '__proto__', party: 999, indices: [0, 0, 1, 999, -1, '2'], date: '2026-02-31' });
  assert.equal(malicious.cityId, 'wuhan'); assert.equal(malicious.group, 'friends'); assert.equal(malicious.budget, 'comfort');
  assert.equal(malicious.date, ''); assert.equal(malicious.party, 2); assert.deepEqual(malicious.indices, [0, 1]);
  assert.equal(findDestinations('all', '', 'family', []).length, 17);
  assert(findDestinations('all', '', 'all', [], 'half').every(place => !place.duration.includes('1 天') && !place.duration.includes('2 天')));
  assert.notDeepEqual(recommendDays('yichang', 2, 'nature'), recommendDays('yichang', 2, 'culture'));
  for (const [index, template] of templates.entries()) {
    const profile = { ...defaultProfile(template.cityId), template: template.id, date: '2026-10-30', party: 4, note: '私人备注不进入分享链接' };
    const itinerary = buildTrip(profile);
    assert.equal(itinerary.length, [2, 5, 7][index]);
    assert.equal(itinerary.filter(day => day.transfer).length, template.segments.length - 1);
    assert(itinerary.filter(day => day.transfer).every(day => day.stops[0].time.includes('转场') && day.stops[0].detail.includes('原上午景点')));
    const budget = estimateBudget(profile, itinerary.length);
    assert.equal(budget.rooms, 2);
    assert.equal(budget.nights, itinerary.length - 1);
    assert(budget.total[0] < budget.total[1]);
    assert.equal(budget.total[0], budget.stay[0] + budget.meals[0] + budget.transport[0] + budget.tickets[0]);
    const restored = parsePlanUrl(new URL(sharePlanUrl(profile)).search);
    assert.equal(restored.template, template.id); assert.equal(restored.date, profile.date); assert.equal(restored.party, profile.party);
    assert.equal(restored.note, '');
    assert.equal(formatDetailedPlan(restored).split('D').length, formatDetailedPlan({ ...profile, note: '' }).split('D').length);
  }
  const skipped = { ...defaultProfile('enshi'), indices: [1, 2] };
  assert(estimateBudget(skipped, 2).arrivalNight);
  assert.equal(estimateBudget(skipped, 2).nights, 2);
  assert(formatDetailedPlan(skipped).includes('提前一晚抵达'));
  console.log(JSON.stringify({ result: 'passed', cities: cities.length, destinations: destinations.length, featured: featuredDestinations.length, routeDays: dayCount, photos: imageCredits.length, checks: 'coverage, references, route depth, search, saved filters, custom days, family/duration filters, 17-city practical coverage, cross-city transfers, budget arithmetic, safe sharing roundtrip, invalid dates/inputs, immutability, photos' }, null, 2));
} finally {
  await server.close();
}
