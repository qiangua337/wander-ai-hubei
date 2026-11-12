import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cities } = await server.ssrLoadModule('/src/data.ts');
  const { practical } = await server.ssrLoadModule('/src/data/practical.ts');
  const { defaultProfile, buildTrip, estimateBudget, templates } = await server.ssrLoadModule('/src/planning.ts');
  const { compareSupportPlans, supportTripDraftFromProfile } = await server.ssrLoadModule('/src/support-review.ts');
  const sourceSnapshot = JSON.stringify({ cities, practical, templates });
  const base = defaultProfile('wuhan');
  const snapshot = JSON.stringify(base);
  let cases = 0;
  function compare(before, after) {
    const inputs = JSON.stringify([before, after]);
    const result = compareSupportPlans(before, after);
    assert.equal(JSON.stringify([before, after]), inputs, 'Comparisons must preserve both caller profiles.');
    assert.deepEqual(result.beforeTotal, estimateBudget(before, buildTrip(before).length).total);
    assert.deepEqual(result.afterTotal, estimateBudget(after, buildTrip(after).length).total);
    assert.deepEqual(compareSupportPlans(before, after), result, 'Comparison order is deterministic.');
    assert(result.changes.every(item => item.before !== item.after && item.label && item.before && item.after));
    cases++;
    return result;
  }

  const identical = compare(base, { ...base, indices: [...base.indices] });
  assert.deepEqual(identical.changes, []);
  assert.deepEqual(identical.addedDays, []);
  assert.deepEqual(identical.removedDays, []);
  assert.deepEqual(identical.beforeTotal, identical.afterTotal);

  const fourDrive = { ...base, party: 4, mode: 'drive' };
  const transportChange = compare(base, fourDrive);
  assert.deepEqual(transportChange.changes.map(item => item.label), ['同行人数', '交通方式']);
  assert.deepEqual(transportChange.changes.map(item => [item.before, item.after]), [['2 人', '4 人'], ['公共交通＋接驳', '自驾出行']]);
  assert.deepEqual(transportChange.addedDays, []);
  assert.notDeepEqual(transportChange.beforeTotal, transportChange.afterTotal);

  const threeDays = { ...base, indices: [0, 1, 2] };
  const extended = compare(base, threeDays);
  assert.deepEqual(extended.changes.map(item => item.label), ['游玩天数']);
  assert.deepEqual(extended.addedDays, [buildTrip(threeDays)[2].title]);
  assert.deepEqual(extended.removedDays, []);
  const shortened = compare(threeDays, base);
  assert.deepEqual(shortened.removedDays, extended.addedDays);
  assert.deepEqual(shortened.addedDays, []);

  const changedChapter = { ...base, indices: [0, 2] };
  const chapterChange = compare(base, changedChapter);
  assert.deepEqual(chapterChange.addedDays, [buildTrip(changedChapter)[1].title]);
  assert.deepEqual(chapterChange.removedDays, [buildTrip(base)[1].title]);
  assert(!chapterChange.changes.some(item => item.label === '游玩天数'), 'A same-length chapter replacement is not an extra day.');
  const reordered = compare(base, { ...base, indices: [1, 0] });
  assert.deepEqual(reordered.changes, []);
  assert.deepEqual(reordered.addedDays, []);

  const across = { ...defaultProfile('enshi'), template: 'west-five', party: 4 };
  const crossChange = compare(base, across);
  const route = crossChange.changes.find(item => item.label === '路线');
  assert(route.before.includes('武汉') && route.before.includes('自选章节'));
  assert(route.after.startsWith('宜昌 → 恩施州') && route.after.includes('经典主线'));
  assert(!route.after.startsWith('恩施州'), 'Cross-city route order comes from actual trip days, not profile.cityId.');
  assert.equal(crossChange.addedDays.length, 5);
  assert.equal(crossChange.removedDays.length, 2);

  const fixedInterest = compare(across, { ...across, interest: 'food' });
  assert.deepEqual(fixedInterest.addedDays, []);
  assert.deepEqual(fixedInterest.removedDays, []);
  assert(fixedInterest.changes.find(item => item.label === '玩法偏好').after.includes('固定主线，景点不变'));
  const sameChaptersFixed = compare(base, { ...base, template: 'wuhan-weekend' });
  assert(sameChaptersFixed.changes.find(item => item.label === '路线').after.includes('经典主线'));
  assert.deepEqual(sameChaptersFixed.addedDays, []);
  assert.deepEqual(sameChaptersFixed.removedDays, []);

  const adjusted = { ...base, group: 'family', interest: 'culture', pace: 'relaxed', budget: 'value', date: '2026-12-08', note: '餐馆先询问辣度' };
  const preferenceChange = compare(base, adjusted);
  assert.deepEqual(preferenceChange.changes.map(item => item.label), ['同行人群', '玩法偏好', '旅行节奏', '预算档位', '出发日期', '补充想法']);
  assert.equal(preferenceChange.changes.find(item => item.label === '出发日期').after, '2026-12-08');
  assert.equal(preferenceChange.changes.find(item => item.label === '补充想法').before, '未填写');
  const clearNote = compare(adjusted, { ...adjusted, note: '' });
  assert.equal(clearNote.changes.find(item => item.label === '补充想法').after, '未填写');

  const frozen = Object.freeze({ ...adjusted, indices: Object.freeze([...adjusted.indices]) });
  compare(frozen, fourDrive);
  const draft = supportTripDraftFromProfile(frozen);
  assert.deepEqual(draft, { cityIds: ['wuhan'], days: 2, party: 2, group: 'family', mode: 'public', budget: 'value', interest: 'culture', pace: 'relaxed', date: '2026-12-08', note: '餐馆先询问辣度' });
  const acrossDraft = supportTripDraftFromProfile(across);
  assert.deepEqual(acrossDraft.cityIds, ['yichang', 'enshi']);
  assert.equal(acrossDraft.days, 5);
  assert.equal(acrossDraft.party, 4);
  const constrained = { ...adjusted, origin: '武汉', arrival: 'afternoon', departure: 'afternoon', mobility: 'gentle', budgetLimit: 2000, budgetScope: 'total' };
  const constraintsChange = compare(adjusted, constrained);
  for (const label of ['出发城市', '首日抵达', '返程时段', '体力限制', '目标预算']) assert(constraintsChange.changes.some(change => change.label === label));
  assert.deepEqual(constraintsChange.revisedDays.map(day => day.day), [1, 2]);
  assert(constraintsChange.revisedDays[1].after.includes('返程'));
  assert(constraintsChange.afterTotal[1] < constraintsChange.beforeTotal[1]);
  const constraintsDraft = supportTripDraftFromProfile(constrained);
  for (const key of ['origin', 'arrival', 'departure', 'mobility', 'budgetLimit', 'budgetScope']) assert.equal(constraintsDraft[key], constrained[key], 'Editing must retain travel constraints.');
  draft.cityIds.push('enshi');
  assert.deepEqual(supportTripDraftFromProfile(frozen).cityIds, ['wuhan'], 'Draft arrays are independent copies.');
  assert.equal(JSON.stringify(base), snapshot);
  assert.equal(JSON.stringify({ cities, practical, templates }), sourceSnapshot, 'Editorial source data must remain unchanged.');
  console.log(JSON.stringify({ result: 'passed', cases, checks: 'stable plan comparison, actual cross-city order, chapter identity, settings, budgets, draft refill, immutability' }, null, 2));
} finally {
  await server.close();
}
