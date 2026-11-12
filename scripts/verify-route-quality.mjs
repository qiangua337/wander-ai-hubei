import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cities } = await server.ssrLoadModule('/src/data.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { routeDetails } = await server.ssrLoadModule('/src/data/route-details.ts');
  const { defaultProfile, buildTrip, recommendConstrainedDays, estimateBudget, normalizeProfile, sharePlanUrl, parsePlanUrl, formatDetailedPlan, getTripIssues, getTripTimingConflict } = await server.ssrLoadModule('/src/planning.ts');
  const sourceSnapshot = JSON.stringify({ cities, practical, routeDetails });
  let chapters = 0;
  for (const city of cities) {
    assert.equal(routeDetails[city.id].length, city.days.length, `${city.id} chapter metadata coverage`);
    for (const meta of routeDetails[city.id]) {
      assert(meta.region && ['low', 'moderate', 'high'].includes(meta.effort));
      assert(practical[city.id].stays[meta.stayAreaIndex]);
      assert(practical[city.id].food[meta.foodAreaIndex]);
      chapters++;
    }
    const safe = recommendConstrainedDays(city.id, city.days.length, 'nature', 'gentle');
    assert(safe.every(index => routeDetails[city.id][index].effort !== 'high'));
    assert.equal(safe.length, routeDetails[city.id].filter(meta => meta.effort !== 'high').length, 'Do not fill excluded high-effort chapters back in.');
    const trip = buildTrip({ ...defaultProfile(city.id), indices: city.days.map((_, index) => index), arrival: 'full-day' });
    assert(trip.every(day => day.breakfast && day.lunch && day.dinner && day.region));
    assert(trip.every(day => !/原酒店/.test(day.overnight)), 'A selected first chapter cannot reference an undefined earlier hotel.');
  }
  assert.equal(chapters, 50);

  const gentleEnshi = recommendConstrainedDays('enshi', 4, 'nature', 'gentle');
  assert.equal(gentleEnshi.length, 3, 'Four gentle days must not be padded with the gorge.');
  assert(!gentleEnshi.includes(1));
  assert(getTripIssues({ ...defaultProfile('enshi'), indices: [0, 1, 2], mobility: 'gentle' }).some(text => text.includes('仍包含高强度山地')));
  assert(!getTripIssues({ ...defaultProfile('enshi'), indices: gentleEnshi, mobility: 'gentle' }).some(text => text.includes('仍包含高强度山地')));
  const xianning = buildTrip({ ...defaultProfile('xianning'), indices: [0, 1, 2], arrival: 'full-day' });
  assert.equal(xianning[0].overnight, '赤壁城区');
  assert.equal(xianning[1].overnight, '咸宁温泉城区');
  assert.equal(xianning[2].overnight, '咸宁温泉城区');
  assert(xianning[1].stops[2].title.includes('移宿咸宁'));
  assert.deepEqual(practical.xianning.kinds, ['culture', 'culture', 'rest']);
  assert(getTripIssues({ ...defaultProfile('xianning'), indices: [0], interest: 'nature' }).some(text => text.includes('玩法偏好尚未充分满足')));
  const forest = buildTrip({ ...defaultProfile('shennongjia'), indices: [1, 2], arrival: 'full-day' });
  assert(forest[0].overnight.includes('坪阡') && !forest[0].overnight.includes('木鱼镇或'));
  assert(forest[0].stops[2].title.includes('移宿坪阡'));

  const base = { ...defaultProfile('wuhan'), indices: [0, 2], arrival: 'full-day' };
  const culture = buildTrip({ ...base, interest: 'culture' });
  const food = buildTrip({ ...base, interest: 'food' });
  assert.notDeepEqual(food, culture, 'A food preference must change actionable meals or an activity, not only a profile label.');
  assert(food[0].breakfast.includes('武昌') && food[0].breakfast.includes('热干面'));
  assert(food[1].breakfast.includes('汉口') && food[1].breakfast.includes('糊汤粉'));
  assert(food[0].stops[2].title.includes('晚餐') && food[1].stops[2].title.includes('晚餐'));
  assert(food[0].meal.includes('顺路觅食：武昌老城街巷'));
  assert(!buildTrip({ ...defaultProfile('huangshi'), indices: [0] })[0].dinner.includes('港饼'), 'Tea snacks and souvenirs must not become dinner.');

  for (const arrival of ['morning', 'afternoon', 'evening']) {
    const profile = { ...defaultProfile('wuhan'), indices: [0, 1], origin: '西安', arrival, interest: 'food' };
    const trip = buildTrip(profile);
    assert(trip[0].stops[0].title.includes('前往武汉'));
    assert(!trip[0].stops.some(stop => stop.title.includes('黄鹤楼')), 'A day of arrival must not retain the removed morning attraction.');
    assert(trip[0].transport.includes('西安'));
    assert(trip[0].breakfast.includes('途中'));
    assert(!trip[0].tip.includes('登楼') && !trip[0].tip.includes('2–3 小时'), 'Arrival tips must not retain advice for the removed morning attraction.');
    if (arrival !== 'morning') {
      assert.equal(trip[0].effort, 'low', 'A day reserved for arrival and settling in is not an attraction-effort day.');
      assert(trip[0].region.includes('住宿接驳片区'));
      assert(!trip[0].stops.some(stop => stop.title.includes('户部巷')));
      assert(trip[0].lunch.includes('途中'));
    }
    if (arrival === 'evening') {
      assert(trip[0].stops[2].title.includes('住宿'));
      assert(trip[0].dinner.includes('晚到'));
    }
    assert.equal(estimateBudget(profile, trip.length).nights, 1);
  }
  const seniorArrival = buildTrip({ ...defaultProfile('wuhan'), indices: [0, 1], arrival: 'afternoon', group: 'senior', mobility: 'gentle' })[0];
  assert(seniorArrival.tip.includes('同行节奏') && seniorArrival.tip.includes('无障碍'), 'Necessary companion and access checks remain after clearing obsolete attraction advice.');
  const skipped = { ...defaultProfile('enshi'), indices: [1, 2] };
  assert.equal(estimateBudget({ ...skipped, arrival: 'full-day' }, 2).nights, 1);
  assert.equal(estimateBudget({ ...skipped, arrival: 'previous-night' }, 2).nights, 2);
  assert.equal(estimateBudget(skipped, 2).nights, 2, 'Missing arrival retains legacy stored-profile behavior.');
  const eveningPrior = buildTrip({ ...defaultProfile('shennongjia'), indices: [0, 2], arrival: 'evening' });
  assert(eveningPrior[0].stops[2].title.includes('抵达住宿'));

  const returnBase = { ...defaultProfile('wuhan'), indices: [0, 1, 2], arrival: 'full-day', interest: 'food' };
  const unchangedDays = buildTrip(returnBase);
  for (const departure of ['morning', 'afternoon', 'evening']) {
    const profile = { ...returnBase, departure }, trip = buildTrip(profile), last = trip.at(-1);
    assert.deepEqual(trip.slice(0, -1), unchangedDays.slice(0, -1), 'Departure changes only the final day.');
    assert(!last.stops.some(stop => /晴川阁|古琴台|地方晚餐|江滩/.test(stop.title)), 'Do not retain sightseeing or destination dinner after departure.');
    assert(last.dinner.includes('途中') && last.transport.includes('取行李'));
    assert.equal(estimateBudget(profile, trip.length).nights, 2);
    assert.equal(estimateBudget(profile, trip.length).ticketDays, departure === 'evening' ? 3 : 2);
    assert.equal(parsePlanUrl(new URL(sharePlanUrl(profile)).search).departure, departure);
    assert(formatDetailedPlan(profile).includes('返程设置：'));
    if (departure === 'evening') assert.equal(last.stops[0].title, unchangedDays.at(-1).stops[0].title);
    else assert(!last.stops.some(stop => stop.title.includes('江汉路')));
  }
  const mountainReturn = { ...defaultProfile('enshi'), indices: [0, 1], interest: 'nature', arrival: 'full-day', departure: 'evening' };
  const mountainLast = buildTrip(mountainReturn).at(-1);
  assert(!mountainLast.stops.some(stop => /七星寨|云龙|大峡谷/.test(stop.title)), 'Mountain days are removed instead of compressed before the return.');
  assert.equal(mountainLast.effort, 'low');
  assert(getTripIssues(mountainReturn).some(text => text.includes('玩法偏好尚未充分满足')), 'Deleted nature chapters cannot count as a delivered nature experience.');
  for (const [arrival, departure] of [['morning', 'morning'], ['afternoon', 'morning'], ['afternoon', 'afternoon'], ['evening', 'afternoon'], ['evening', 'evening']]) {
    const conflict = { ...defaultProfile(), indices: [0], arrival, departure };
    assert(getTripTimingConflict(conflict));
    assert(getTripIssues(conflict).some(text => text.includes('返程时段不晚于抵达时段')));
  }
  const dayReturn = { ...defaultProfile(), indices: [0], arrival: 'afternoon', departure: 'evening' };
  assert(!getTripTimingConflict(dayReturn));
  assert.equal(estimateBudget(dayReturn, 1).nights, 0);
  assert(buildTrip(dayReturn)[0].stops[1].detail.includes('不安排过夜入住'));
  assert.deepEqual(estimateBudget(dayReturn, 1).tickets, [0, 0]);
  const overnightReturn = { ...dayReturn, arrival: 'previous-night', departure: 'morning' };
  assert.equal(estimateBudget(overnightReturn, 1).nights, 1);
  assert(buildTrip(overnightReturn)[0].stops[0].detail.includes('退房'));
  const canceledLake = buildTrip({ ...defaultProfile('shennongjia'), indices: [0, 1, 2], departure: 'morning' });
  assert(!canceledLake[1].overnight.includes('坪阡'), 'Do not move hotels just to reach a removed last-day activity.');
  assert.deepEqual(buildTrip({ ...returnBase, departure: 'flexible' }), unchangedDays, 'Clearing the departure window restores original daily contents.');
  assert(!normalizeProfile({ ...returnBase, departure: '__proto__' }).departure);

  const complete = normalizeProfile({ ...base, origin: '武汉', arrival: 'afternoon', mobility: 'gentle', budgetLimit: 2000, budgetScope: 'per-person', note: '不吃辣，需向餐馆确认' });
  const shared = sharePlanUrl(complete), restored = parsePlanUrl(new URL(shared).search);
  assert.deepEqual(restored, { ...complete, note: '' });
  assert(!shared.includes('不吃辣') && !new URL(shared).searchParams.has('note'));
  const text = formatDetailedPlan(complete);
  for (const phrase of ['出发地：武汉', '首日下午抵达', '减少高强度山地', '每人 ¥2000', '早餐：', '午餐：', '晚餐：']) assert(text.includes(phrase), phrase);
  const invalid = normalizeProfile({ ...base, arrival: { bad: true }, mobility: '__proto__', budgetLimit: -2, budgetScope: 'unknown' });
  assert(!invalid.arrival && !invalid.mobility && !invalid.budgetLimit && !invalid.budgetScope);
  assert((normalizeProfile({ ...base, origin: '汉'.repeat(40) }).origin || '').length <= 24);
  assert.equal(normalizeProfile({ ...base, origin: '武汉某小区12栋3单元' }).origin, '武汉');
  assert(getTripIssues({ ...base, budgetLimit: 100, budgetScope: 'total' }).some(issue => issue.includes('尚未满足预算')));
  assert(formatDetailedPlan({ ...base, budgetLimit: 100, budgetScope: 'total' }).includes('尚未满足预算'), 'Export must retain feasibility limitations, not just the requested amount.');
  assert.equal(JSON.stringify({ cities, practical, routeDetails }), sourceSnapshot, 'Planning must not rewrite the editorial data.');
  console.log(JSON.stringify({ result: 'passed', chapters, cities: cities.length, checks: 'effort constraints, real food preference, meal timing, route-aligned nights, arrival and return scheduling, same-day conflicts, return budget, safe sharing, immutability' }, null, 2));
} finally { await server.close(); }
