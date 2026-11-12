import { cityById } from './data';
import { arrivalLabels, getDepartureLabel, mobilityLabels, buildTrip, estimateBudget, groupLabels, interestLabels, budgetLabels, templates, type PlannedDay, type Profile } from './planning';
import type { SupportTripDraft } from './support';

export type SupportPlanComparison = {
  changes: { label: string; before: string; after: string }[];
  addedDays: string[];
  removedDays: string[];
  revisedDays: { day: number; before: string; after: string }[];
  beforeTotal: number[];
  afterTotal: number[];
};

function routeLabel(profile: Profile, days: PlannedDay[]): string {
  const route = days.filter((day, index) => index === 0 || day.cityId !== days[index - 1].cityId)
    .map(day => cityById[day.cityId].shortName).join(' → ');
  const template = templates.find(item => item.id === profile.template);
  return `${route || '尚未选择章节'} · ${template ? `经典主线：${template.title}` : '自选章节'}`;
}

function interestLabel(profile: Profile): string {
  const fixed = templates.some(item => item.id === profile.template);
  return `${interestLabels[profile.interest]}${fixed ? '（固定主线，景点不变）' : ''}`;
}

/** Compare actual route days and settings without changing either plan or editorial data. */
export function compareSupportPlans(previous: Profile, current: Profile): SupportPlanComparison {
  const beforeDays = buildTrip(previous), afterDays = buildTrip(current);
  const keyFor = (day: PlannedDay) => `${day.cityId}:${day.originalIndex}`;
  const beforeKeys = new Set(beforeDays.map(keyFor)), afterKeys = new Set(afterDays.map(keyFor));
  const revisedDays = afterDays.flatMap((day, index) => {
    const original = beforeDays.find(before => keyFor(before) === keyFor(day));
    if (!original) return [];
    const before = original.stops.map(stop => stop.title).join(' → ');
    const after = day.stops.map(stop => stop.title).join(' → ');
    return before === after ? [] : [{ day: index + 1, before, after }];
  });
  const fields = [
    ['路线', routeLabel(previous, beforeDays), routeLabel(current, afterDays)],
    ['游玩天数', `${beforeDays.length} 天`, `${afterDays.length} 天`],
    ['同行人数', `${previous.party} 人`, `${current.party} 人`],
    ['同行人群', groupLabels[previous.group], groupLabels[current.group]],
    ['交通方式', previous.mode === 'drive' ? '自驾出行' : '公共交通＋接驳', current.mode === 'drive' ? '自驾出行' : '公共交通＋接驳'],
    ['玩法偏好', interestLabel(previous), interestLabel(current)],
    ['旅行节奏', previous.pace === 'relaxed' ? '轻松慢游' : '经典串游', current.pace === 'relaxed' ? '轻松慢游' : '经典串游'],
    ['预算档位', budgetLabels[previous.budget], budgetLabels[current.budget]],
    ['出发日期', previous.date || '日期待定', current.date || '日期待定'],
    ['出发城市', previous.origin || '未填写', current.origin || '未填写'],
    ['首日抵达', previous.arrival ? arrivalLabels[previous.arrival] : '沿用原方案假设', current.arrival ? arrivalLabels[current.arrival] : '沿用原方案假设'],
    ['返程时段', getDepartureLabel(previous), getDepartureLabel(current)],
    ['体力限制', mobilityLabels[previous.mobility || 'standard'], mobilityLabels[current.mobility || 'standard']],
    ['目标预算', previous.budgetLimit ? (previous.budgetScope === 'per-person' ? '每人' : '全团') + ' ¥' + previous.budgetLimit : '未设置', current.budgetLimit ? (current.budgetScope === 'per-person' ? '每人' : '全团') + ' ¥' + current.budgetLimit : '未设置'],
    ['补充想法', previous.note.trim() || '未填写', current.note.trim() || '未填写'],
  ];
  return {
    changes: fields.filter(([, before, after]) => before !== after).map(([label, before, after]) => ({ label, before, after })),
    addedDays: afterDays.filter(day => !beforeKeys.has(keyFor(day))).map(day => day.title),
    removedDays: beforeDays.filter(day => !afterKeys.has(keyFor(day))).map(day => day.title),
    revisedDays,
    beforeTotal: [...estimateBudget(previous, beforeDays.length).total],
    afterTotal: [...estimateBudget(current, afterDays.length).total],
  };
}

/** Refill the local trip form from the same settings and actual cities used by this plan. */
export function supportTripDraftFromProfile(profile: Profile): SupportTripDraft {
  const days = buildTrip(profile);
  return {
    cityIds: [...new Set(days.map(day => day.cityId))], days: days.length, party: profile.party,
    group: profile.group, mode: profile.mode, budget: profile.budget, interest: profile.interest,
    pace: profile.pace, date: profile.date, note: profile.note,
    ...(profile.origin !== undefined ? { origin: profile.origin } : {}),
    ...(profile.arrival ? { arrival: profile.arrival } : {}),
    ...(profile.departure ? { departure: profile.departure } : {}),
    ...(profile.departureTime ? { departureTime: profile.departureTime } : {}),
    ...(profile.departureStation ? { departureStation: profile.departureStation } : {}),
    ...(profile.mobility ? { mobility: profile.mobility } : {}),
    ...(profile.budgetLimit !== undefined ? { budgetLimit: profile.budgetLimit, budgetScope: profile.budgetScope } : {}),
  };
}
