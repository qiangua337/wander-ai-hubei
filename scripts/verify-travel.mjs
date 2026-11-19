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
  const { cityGroups, guideFromSearch, placesByCity, routeForPlace, shareGuideUrl, sortDestinations } = await server.ssrLoadModule('/src/discovery.ts');
  const { readBrowseShare, recentPlaceIds, shareBrowseUrl } = await server.ssrLoadModule('/src/browse-share.ts');
  const { buildDaySchedule } = await server.ssrLoadModule('/src/day-schedule.ts');
  const { attractionRoutes, availableTripDays } = await server.ssrLoadModule('/src/data/attraction-routes.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { practicalMapUrl } = await server.ssrLoadModule('/src/data/practical-maps.ts');
  const { localFoodShops } = await server.ssrLoadModule('/src/data/food-shops.ts');
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
  assert.equal(findDestinations('all', '宜昌、西陵峡', 'all', [])[0]?.id, 'xiling-gorge');
  assert.equal(findDestinations('all', '黄鹤楼', 'all', [])[0]?.id, 'wuhan');
  assert.equal(findDestinations('all', '省博？', 'all', [])[0]?.id, 'hubei-museum');
  assert.equal(findDestinations('all', '武汉 东湖', 'all', [])[0]?.id, 'east-lake');
  assert.deepEqual(cityGroups.flatMap(group => group.cities.map(city => city.id)).sort(), expectedCities);
  assert.deepEqual(Object.values(placesByCity).flat().map(place => place.id).sort(), destinations.map(place => place.id).sort());
  const filters = { city: 'wuhan', filter: 'nature', duration: 'half', keyword: '东湖 & 湖边', order: 'duration', view: 'places' };
  const browseLink = new URL(shareBrowseUrl({ ...filters, recent: ['enshi'], saved: ['tenglong'], travelers: '5' }));
  assert.equal(browseLink.hash, '#destinations');
  assert.deepEqual(readBrowseShare(browseLink.search), filters);
  assert(!['recent', 'saved', 'travelers'].some(key => browseLink.searchParams.has(key)), 'Private fields must never enter catalogue links.');
  assert.equal(readBrowseShare('?place=wuhan'), undefined, 'Existing place shares must not override catalogue browsing state.');
  const invalid = readBrowseShare('?browse=1&city=toString&type=saved&duration=bad&order=bad');
  assert.deepEqual(invalid, { city: 'all', filter: 'all', duration: 'any', keyword: '', order: 'recommended', view: 'places' });
  const cityIndex = readBrowseShare(new URL(shareBrowseUrl({ ...filters, view: 'cities' })).search);
  assert.deepEqual(cityIndex, { ...invalid, view: 'cities' });
  assert.deepEqual(recentPlaceIds(['enshi', 'fake', 'enshi', 'toString', 'tenglong', null, 'wuhan', 'east-lake', 'xiling-gorge']), ['enshi', 'tenglong', 'wuhan', 'east-lake']);
  for (const place of destinations) {
    assert.deepEqual(guideFromSearch(new URL(shareGuideUrl(place.cityId, place.id)).search), { cityId: place.cityId, placeId: place.id });
    const match = routeForPlace(place.id);
    assert(match, `Missing route for ${place.title}`);
    const profile = { ...defaultProfile(place.cityId), indices: [match.chapter] };
    const day = buildTrip(profile)[0];
    assert(day, `Missing route for ${place.title}`);
    assert(buildDaySchedule(day, profile, undefined, true).rows.some(row => row.kind === 'visit' && row.title === match.visit),
      `${place.title} must open an itinerary that actually visits it`);
  }
  const added = Object.entries(attractionRoutes).flatMap(([cityId, routes]) => routes.map(route => ({ cityId, ...route })));
  assert.deepEqual(added.map(route => route.placeId).sort(),
    ['mulan', 'xiling-gorge', 'three-gorges-waterfall', 'geocentric', 'tangya', 'shangjin', 'tiantang', 'jiugong', 'yinshui', 'tangchi', 'dahong', 'shahu', 'crayfish'].sort());
  for (const addition of added) {
    const { cityId, placeId, journey } = addition;
    const city = cityById[cityId], { chapter } = routeForPlace(placeId);
    assert(chapter >= city.days.length && availableTripDays(city)[chapter] === addition.day, placeId);
    for (const mode of ['public', 'drive']) {
      const profile = { ...defaultProfile(cityId, '2026-12-08', 3), indices: [chapter], mode };
      const restored = parsePlanUrl(new URL(sharePlanUrl(profile)).search);
      assert.deepEqual(restored.indices, [chapter], `Share must keep the selected one-day route for ${placeId}`);
      const [trip] = buildTrip(restored);
      const schedule = buildDaySchedule(trip, restored, undefined, true);
      assert.equal(schedule.from, journey.base);
      assert.equal(schedule.start, journey.start + ' 建议出门');
      const visits = schedule.rows.filter(row => row.kind === 'visit');
      assert.equal(visits.length, 2, placeId);
      assert(visits.every(row => row.time && row.duration > 0), placeId);
      const moves = schedule.rows.filter(row => row.kind === 'move');
      assert(moves.length >= 3 && moves.every(row => row.time && row.minutes[0] > 0 && row.minutes[1] >= row.minutes[0] && row.detail), placeId);
      for (const meal of ['早餐', '午餐', '晚餐']) assert(schedule.rows.some(row => row.meal === meal && row.time && row.detail), placeId);
      assert(schedule.rows.some(row => row.meal === '午餐' && row.title.includes(journey.lunch.area)), placeId);
      assert.equal(schedule.rows.at(-1).title, journey.night);
      assert.equal(schedule.rows.at(-1).detail, journey.lodgingNote);
      const clocks = schedule.rows.flatMap(row => row.time ? [row.time] : []);
      assert.deepEqual(clocks, [...clocks].sort(), placeId);
      const exported = formatDetailedPlan(restored);
      assert(schedule.sources.every(source => source.url.startsWith('https://') && exported.includes(source.url)), placeId);
      assert(exported.includes(journey.night) && exported.includes(journey.start), placeId);
    }
  }
  const wetland = added.find(route => route.placeId === 'shahu');
  assert(wetland.journey.morning.optional && wetland.journey.note.includes('梦里水乡'));
  const gorge = { ...defaultProfile('yichang'), indices: [routeForPlace('xiling-gorge').chapter], dayStarts: { 'yichang:4': '12:30' } };
  const lateGorge = buildDaySchedule(buildTrip(gorge)[0], gorge, undefined, true);
  assert(lateGorge.rows.some(row => row.kind === 'move' && row.detail.includes('从三游洞出口打车回西陵老城住处')),
    'A late walk that skips the planned lunch and second attraction must return from the actual first stop.');
  assert.deepEqual(guideFromSearch(new URL(shareGuideUrl('yichang')).search), { cityId: 'yichang' });
  assert.equal(guideFromSearch('?place=__proto__&guide=constructor'), undefined);
  const sortIds = ['wudang', 'hubei-museum', 'enshi', 'wuhan'];
  const sortInput = sortIds.map(id => destinations.find(place => place.id === id));
  assert(sortInput.every(Boolean), 'Sorting fixtures must refer to real destinations.');
  const sortInputBefore = JSON.stringify(sortInput);
  assert.deepEqual(sortDestinations(sortInput, 'recommended').map(place => place.id), sortIds, 'Recommended order preserves the editorial input sequence.');
  assert.deepEqual(sortDestinations(sortInput, 'duration').map(place => place.id), ['wuhan', 'hubei-museum', 'enshi', 'wudang'], 'A two-to-three-hour visit precedes half-day, full-day and one-to-two-day outings.');
  assert.equal(JSON.stringify(sortInput), sortInputBefore, 'Duration sorting must not reorder or change the supplied destinations.');
  const sortedCityIds = [...new Set(sortDestinations(sortInput, 'city').map(place => place.cityId))];
  assert.deepEqual(sortedCityIds, cities.filter(city => sortInput.some(place => place.cityId === city.id)).map(city => city.id), 'City sorting follows the city directory order.');
  assert.equal(JSON.stringify(sortInput), sortInputBefore, 'City sorting must not reorder or change the supplied destinations.');
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
  function verifyMapLink(link) {
    const rawUrl = practicalMapUrl(link);
    const url = new URL(rawUrl);
    assert(link.label);
    assert.equal(url.protocol, 'https:');
    if ('poiId' in link) {
      assert.equal(url.origin, 'https://www.amap.com');
      assert.match(url.pathname, /^\/place\/[A-Z0-9]+$/);
      return;
    }
    assert.equal(url.origin + url.pathname, 'https://uri.amap.com/search');
    assert.equal(url.searchParams.get('keyword'), link.keyword);
    assert.equal(url.searchParams.get('city'), link.cityCode);
    assert.match(link.cityCode, /^42\d{4}$/);
    assert(link.keyword.length <= 22 && !/[＋+，。；、]/u.test(link.keyword));
    assert(!rawUrl.includes('+'));
    assert.equal(url.searchParams.get('center'), link.center?.join(',') ?? null);
  }

  for (const info of Object.values(practical)) {
    for (const entry of [...info.stays, ...info.food]) {
      assert(entry.mapLinks.length, entry.area);
      entry.mapLinks.forEach(verifyMapLink);
    }
  }
  const oldTownLinks = practical.jingzhou.food[0].mapLinks;
  assert(oldTownLinks.some(link => link.keyword === '早堂面' && link.cityCode === '421003'));
  assert(oldTownLinks.some(link => link.keyword === '张居正街 餐厅' && link.cityCode === '421003'));
  assert(oldTownLinks.some(link => link.poiId === 'B02CC01RTZ'));
  for (const [cityId, shops] of Object.entries(localFoodShops)) {
    assert(cityById[cityId]);
    for (const shop of shops) {
      assert(shop.address && shop.dish && shop.routeFit && shop.evidence);
      assert(new Set(shop.sources.map(source => new URL(source.url).origin)).size >= 2);
      verifyMapLink(shop.map);
    }
  }
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
  const contradictoryParty = normalizeProfile({ ...defaultProfile('yichang'), party: 4, group: 'solo' });
  assert.equal(contradictoryParty.party, 4, 'Restoring a saved or shared profile must preserve its valid party size.');
  assert.equal(contradictoryParty.group, 'friends', 'A restored multi-person trip cannot be labelled as solo travel.');
  assert.equal(normalizeProfile({ ...defaultProfile('yichang'), party: 1, group: 'solo' }).group, 'solo', 'A genuine solo trip keeps its group choice.');
  assert.equal(normalizeProfile({ ...defaultProfile('yichang'), party: 1, group: 'family' }).group, 'family', 'Normalizing party size must not replace unrelated group preferences.');
  assert.equal(findDestinations('all', '', 'family', []).length, 17);
  const halfDayIds = new Set(findDestinations('all', '', 'all', [], 'half').map(place => place.id));
  const fullDayIds = new Set(findDestinations('all', '', 'all', [], 'day').map(place => place.id));
  assert(halfDayIds.has('hubei-museum'), 'A pure half-day museum visit belongs in the short-visit filter.');
  assert(!fullDayIds.has('hubei-museum'), 'A pure half-day museum visit must not appear as a full-day outing.');
  assert(fullDayIds.has('east-lake') && !halfDayIds.has('east-lake'), 'A half-day to one-day lake outing needs the full-day allowance.');
  assert(fullDayIds.has('wudang') && !halfDayIds.has('wudang'), 'A one-to-two-day mountain visit belongs only in the full-day filter.');
  assert(halfDayIds.has('wudang-museum') && !fullDayIds.has('wudang-museum'), 'A one-to-two-hour visit remains a short visit, not a full-day outing.');
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
  assert.equal(estimateBudget({ ...skipped, arrival: 'full-day' }, 2).nights, 1, 'Explicit full-day plans do not invent a prior hotel night.');
  assert.equal(estimateBudget({ ...skipped, arrival: 'afternoon' }, 2).nights, 1, 'An afternoon arrival is inside the trip, not an extra prior night.');
  assert.equal(estimateBudget({ ...skipped, arrival: 'previous-night' }, 2).nights, 2, 'A requested prior-night arrival reserves the extra night.');
  assert(formatDetailedPlan(skipped).includes('提前一晚抵达'));
  console.log(JSON.stringify({ result: 'passed', cities: cities.length, destinations: destinations.length, featured: featuredDestinations.length, routeDays: dayCount, attractionRoutes: added.length, photos: imageCredits.length, checks: 'coverage, references, timed attraction routes, search, saved filters, custom days, family/duration filters, 17-city practical coverage, cross-city transfers, budget arithmetic, safe sharing roundtrip, invalid dates/inputs, immutability, photos' }, null, 2));
} finally {
  await server.close();
}
