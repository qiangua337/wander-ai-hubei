import { buildDaySchedule, journeyForDay, localTransfer, returnTransport, type DaySchedule, type ScheduleRow } from './day-schedule';
import { moveVisits, walksForCity, type VisitOption } from './data/visit-alternatives';
import type { TravelLeg } from './data/day-journeys';
import { returnWalks } from './data/return-mornings';
import type { PlannedDay, Profile } from './planning';
import { formatClock, parseClock, returnBreakfastMinutes, returnBreakfastStart } from './return-timing';
import { changeDayKey, changeVisit, visitChangeKey, type VisitChange, type VisitSlot } from './visit-changes';

export type VisitAdjustment = {
  change: VisitChange;
  original: string;
  visit: string;
  fromDay: number;
  dayIndex: number;
  start: string;
  end: string;
  transport: string;
  transportMinutes?: readonly [number, number];
  returnTime?: { finishBy: string; leaveBy: string; arriveBy: string };
  returnTransport?: string;
  displaced?: string;
  ticketed?: boolean;
  similar?: boolean;
};

const foodBuffer = 30;
const dinnerStart = 17 * 60 + 45;
const latestDinner = 18 * 60 + 15;
const localIn: TravelLeg = { method: '从实际落脚处按开放街口步行，选择靠住宿或寄存点的入口。', minutes: [10, 20] };
const localOut: TravelLeg = { method: '沿原路步行回落脚处，保留取行李或就近用餐时间。', minutes: [10, 20] };

function mergeSources(first: DaySchedule['sources'], second: DaySchedule['sources']) {
  return [...new Map([...first, ...second].map(source => [source.url, source])).values()];
}

function transportRow(at: number, title: string, leg: ReturnType<typeof localTransfer>): ScheduleRow {
  return { kind: 'move', time: formatClock(at), title, detail: leg.method, minutes: leg.range };
}

function stopKey(text: string) {
  if (/中华路(?:江边|城市阳台)/.test(text)) return '中华路江边';
  if (/清江.*(?:岸线|走廊)|舞阳坝附近清江/.test(text)) return '清江亲水走廊';
  if (/昙华林.*(?:短逛|散步)|昙华林主街/.test(text)) return '昙华林主街';
  if (/临汉门与城墙|襄阳北街与临汉门/.test(text)) return '襄阳北街与临汉门';
  if (/古城东门.*宾阳楼/.test(text)) return '荆州古城东门';
  if (/二马路.*(?:邮政巷|历史街区)/.test(text)) return '二马路历史街区';
  if (/磁湖.*(?:湖岸|岸线)/.test(text)) return '磁湖岸线';
  return text.replace(/[\s·、]/g, '');
}

function visitRows(rows: ScheduleRow[]) {
  return rows.filter(row => row.kind === 'visit' && !row.provisional);
}

function visitAppears(rows: ScheduleRow[], title: string) {
  return visitRows(rows).some(row => stopKey(row.title) === stopKey(title));
}

export function buildTripSchedules(days: PlannedDay[], profile: Profile) {
  const regular = days.map((day, index) => buildDaySchedule(day, profile, days[index - 1], index === days.length - 1));
  const schedules = [...regular];
  const applied: VisitAdjustment[] = [];
  const keys = days.map(changeDayKey);
  const cityLabel = (index: number) => days[index].title.split(' · ')[0];
  const edit = (schedule: DaySchedule, patch: Partial<DaySchedule>, message: string): DaySchedule => ({
    ...schedule, ...patch, note: [schedule.note, message].filter(Boolean).join(' '),
  });

  function insertVisit(dayIndex: number, option: VisitOption, canReplace: boolean): {
    schedule: DaySchedule; row: ScheduleRow; transport: ReturnType<typeof localTransfer>; displaced?: string;
  } | undefined {
    const day = days[dayIndex], schedule = schedules[dayIndex];
    const station = day.afternoonReturn && day.stationSchedule;
    const title = option.title;
    const returnArea = day.afternoonReturn?.area;
    if (day.afternoonReturn) {
      if (!station || !returnArea || !option.base.test(returnArea)) return;
      const morningRow = schedule.rows.findIndex(row => row.kind === 'visit');
      const sameVisit = schedule.rows[morningRow]?.title;
      if (stopKey(sameVisit || '') === stopKey(title) || sameVisit && !canReplace) return;
      const finish = parseClock(station.finishBy)!;
      const go = localTransfer(option.inbound || localIn, profile), back = localTransfer(option.outbound || localOut, profile);
      const depart = returnBreakfastStart + returnBreakfastMinutes;
      const startAt = depart + go.upper!;
      const lastBack = Math.min(finish - 10, finish >= 12 * 60 + foodBuffer ? 12 * 60 : Infinity);
      const ends = startAt + option.duration;
      if (ends > option.close || ends + back.upper! > lastBack || !schedule.rows.some(row => row.meal === '早餐' && row.time)) return;
      const added: ScheduleRow = { kind: 'visit', time: formatClock(startAt), title, duration: option.duration, detail: option.detail };
      const rows = schedule.rows.filter(row => row.kind !== 'visit' && row.meal !== '午餐');
      rows.splice(1, 0, transportRow(depart, `从落脚片区前往${title}`, go), added, transportRow(ends, '回落脚片区或行李寄存点', back));
      const oldLunch = schedule.rows.find(row => row.meal === '午餐');
      const localLunch = returnWalksForArea(day.cityId, returnArea) || '在住宿或寄存点附近选出餐快的家常简餐。';
      if (finish >= 12 * 60 + foodBuffer) rows.splice(4, 0, { kind: 'meal', meal: '午餐', title: '落脚片区就近午餐', time: '12:00', duration: foodBuffer, detail: localLunch });
      else if (oldLunch) {
        const departure = rows.findIndex(row => row.title === '按票面发车');
        rows.splice(departure >= 0 ? departure : rows.length - 1, 0, oldLunch);
      }
      return { row: added, transport: go, displaced: sameVisit, schedule: edit(schedule, {
        title: `${cityLabel(dayIndex)} · ${title}与返程`,
        headline: [title, ...(day.afternoonReturn!.luggageMinutes ? ['取行李'] : []), '前往车站'].join(' → '),
        rows, sources: mergeSources(schedule.sources, option.sources),
      }, `最晚 ${station.finishBy} 回到落脚片区，${station.leaveForStationBy} 前去站，${station.arriveBy} 前到站。`) };
    }

    const tail = schedule.tail;
    if (!tail || !option.base.test(tail.area)) return;
    const direct = tail.afterVisit && option.fromStops?.[tail.afterVisit.title];
    if (!direct && !tail.ready) return;
    const fromLodging = !direct ? tail.ready! : undefined;
    const depart = direct ? tail.afterVisit!.at : fromLodging!.at;
    const go = localTransfer(direct || option.inbound || localIn, profile);
    const back = localTransfer(option.outbound || localOut, profile);
    const startAt = depart + go.upper!;
    const ends = startAt + option.duration;
    const backAt = ends + back.upper!;
    if (ends > option.close || backAt > latestDinner) return;
    const added: ScheduleRow = { kind: 'visit', time: formatClock(startAt), title, duration: option.duration, detail: option.detail };
    const dinnerIndex = tail.ready?.dinnerIndex ?? schedule.rows.findIndex(row => row.meal === '晚餐');
    if (dinnerIndex < 0) return;
    const rows = [
      ...schedule.rows.slice(0, direct ? tail.afterVisit!.rowIndex : dinnerIndex),
      transportRow(depart, `${direct ? tail.afterVisit!.title : tail.area} → ${title}`, go),
      added,
      transportRow(ends, `回${tail.area}`, back),
      ...schedule.rows.slice(dinnerIndex).map(row => row.meal === '晚餐'
        ? { ...row, time: formatClock(Math.max(backAt, dinnerStart)), detail: option.dinner || row.detail } : row),
    ];
    const previousVisits = visitRows(rows).map(row => row.title);
    return { row: added, transport: go, schedule: edit(schedule, {
      rows, title: `${cityLabel(dayIndex)} · 顺路加游${title}`, headline: previousVisits.join(' → '),
      sources: mergeSources(schedule.sources, option.sources), tail: undefined,
    }, '晚餐在回到住宿片区后就近安排。') };
  }

  for (const change of profile.visitChanges || []) {
    const fromDay = keys.indexOf(change.from);
    const day = days[fromDay];
    const dayIndex = change.to ? keys.indexOf(change.to) : fromDay;
    if (!day || !days[dayIndex] || day.cityId !== days[dayIndex].cityId) continue;
    const originalSchedule = regular[fromDay];
    const original = visitTitle(day, originalSchedule, change.slot);
    if (!original) continue;
    const originalRow = originalSchedule.rows.find(row => row.visitSlot === change.slot);
    const onReturn = !!day.stationSchedule && !!day.afternoonReturn;
    if (originalRow && !originalSchedule.recommendedStart) continue;
    if (originalRow && change.slot === 'main' && journeyForDay(day).afternoon) continue;
    if (!originalRow && !(originalSchedule.recommendedStart || onReturn || change.to && (day.transfer || day.sightseeingRemoved))) continue;
    if (!change.to && (day.transfer || !onReturn && !originalSchedule.recommendedStart)) continue;
    if (schedules[fromDay] !== regular[fromDay] && (originalRow || !change.to && !onReturn)) continue;
    const originalKey = stopKey(original);
    const option = change.to ? moveVisits[visitChangeKey(change)]
      : walksForCity(day.cityId).find(walk => walk.id === change.alternative);
    if (!option || option.cityId !== day.cityId || !change.to && stopKey(option.title) === originalKey) continue;
    const prior = schedules[fromDay];
    const target = schedules[dayIndex];
    const source = onReturn ? prior : buildDaySchedule(day, profile, days[fromDay - 1], fromDay === days.length - 1, change.slot);
    // Keep a known itinerary on arrival, cross-town and train days. Their omitted stop never
    // occupied a timetable row, so its new placement can leave the whole existing day intact.
    if ((!source.recommendedStart || prior !== originalSchedule) && !originalRow) schedules[fromDay] = prior;
    else schedules[fromDay] = source;

    const duplicate = schedules.some((schedule, index) => !(index === dayIndex && days[index].afternoonReturn) && visitAppears(schedule.rows, option.title));
    let candidate = duplicate ? undefined : insertVisit(dayIndex, option, !change.to || schedules[dayIndex] === regular[dayIndex]);
    // A moved visit can use a flexible afternoon on a complete local day. Keep its primary visit
    // and meal, and report the receiving day's optional stop if it makes room.
    if (!candidate && !duplicate && change.to && schedules[dayIndex] === regular[dayIndex] && target.recommendedStart) {
      const oldAfternoon = target.rows.find(row => row.visitSlot === 'afternoon');
      if (oldAfternoon) {
        const shorter = buildDaySchedule(days[dayIndex], profile, days[dayIndex - 1], dayIndex === days.length - 1, 'afternoon');
        schedules[dayIndex] = shorter;
        const next = insertVisit(dayIndex, option, false);
        schedules[dayIndex] = target;
        if (next) candidate = { ...next, displaced: oldAfternoon.title };
      }
    }
    if (!candidate) { schedules[fromDay] = prior; continue; }
    const into = candidate.schedule;
    const message = change.to ? `「${original}」已挪到第 ${dayIndex + 1} 天 ${candidate.row.time}。`
      : `「${original}」换成「${option.title}」。`;
    if (change.to) schedules[fromDay] = edit(schedules[fromDay], {
      title: schedules[fromDay].title || days[fromDay].title,
    }, message);
    const receivingNote = change.to ? `接上第 ${fromDay + 1} 天挪来的「${original}」。` : message;
    schedules[dayIndex] = edit(into, {}, receivingNote + (candidate.displaced ? `「${candidate.displaced}」让出这段时间。` : ''));
    const returnDay = days[dayIndex].stationSchedule ? days[dayIndex] : day.stationSchedule ? day : days.at(-1);
    const station = returnDay?.stationSchedule;
    applied.push({
      change, original, visit: option.title, fromDay, dayIndex,
      start: candidate.row.time!, end: formatClock(parseClock(candidate.row.time)! + option.duration),
      transport: candidate.transport.method, transportMinutes: candidate.transport.range,
      displaced: candidate.displaced, ticketed: option.ticketed, similar: option.preferredFor?.test(original),
      ...(station ? { returnTime: { finishBy: station.finishBy, leaveBy: station.leaveForStationBy, arriveBy: station.arriveBy } } : {}),
      ...(returnDay ? { returnTransport: returnTransport(returnDay, profile)?.method } : {}),
    });
  }
  return { schedules, applied };
}

export function preservesVisitChanges(previous: VisitAdjustment[], next: VisitAdjustment[], except?: VisitChange) {
  const exceptKey = except ? visitChangeKey(except) : undefined;
  return previous.every(item => {
    const key = visitChangeKey(item.change);
    return key === exceptKey || next.some(other => visitChangeKey(other.change) === key && other.visit === item.visit
      && other.dayIndex === item.dayIndex && other.start === item.start && other.end === item.end && other.displaced === item.displaced);
  });
}

function returnWalksForArea(cityId: string, area: string) {
  return returnWalks[cityId]?.find(walk => walk.base.test(area))?.lunch;
}

export function visitTitle(day: PlannedDay, schedule: DaySchedule, slot: VisitSlot) {
  const journey = journeyForDay(day);
  return schedule.rows.find(row => row.visitSlot === slot)?.title || (slot === 'main' ? journey.morning.place : journey.afternoon?.place);
}

export function pendingVisitSlots(day: PlannedDay, schedule: DaySchedule): VisitSlot[] {
  if (!(schedule.recommendedStart || day.stationSchedule || day.transfer || day.afternoonReturn)) return [];
  const hasMain = schedule.rows.some(row => row.visitSlot === 'main');
  const hasAfternoon = schedule.rows.some(row => row.visitSlot === 'afternoon');
  if (!hasMain && slotHasOptions(day, 'main')) return ['main'];
  if (!hasAfternoon && (hasMain || day.stationSchedule) && journeyForDay(day).afternoon && slotHasOptions(day, 'afternoon')) return ['afternoon'];
  return [];
}

function slotHasOptions(day: PlannedDay, slot: VisitSlot) {
  return Boolean(moveVisits[visitChangeKey({ from: changeDayKey(day), slot })]) || !day.transfer && walksForCity(day.cityId).length > 0;
}

export type VisitChoices = {
  dayIndex: number;
  slot: VisitSlot;
  original: string;
  options: VisitAdjustment[];
  current?: VisitAdjustment;
};

export function visitChoices(days: PlannedDay[], profile: Profile, dayIndex?: number, namedVisit?: string): VisitChoices[] {
  const { applied } = buildTripSchedules(days, profile);
  const name = namedVisit && stopKey(namedVisit);
  const matches = (title: string) => !name || stopKey(title).includes(name) || name.includes(stopKey(title));
  return days.flatMap((day, index) => {
    if (dayIndex !== undefined && dayIndex !== index) return [];
    const from = changeDayKey(day);
    const schedule = buildDaySchedule(day, profile, days[index - 1], index === days.length - 1);
    const current = applied.filter(item => item.change.from === from);
    const pending = pendingVisitSlots(day, schedule);
    const recent = current.map(item => item.change.slot);
    const readySlots: VisitSlot[] = day.afternoonReturn && pending.length ? ['main', ...(journeyForDay(day).afternoon ? ['afternoon' as const] : [])] : pending;
    const slots: VisitSlot[] = namedVisit ? ['main', 'afternoon'] : [...new Set([...readySlots, ...recent])];
    return slots.flatMap(slot => {
      const active = current.find(item => item.change.slot === slot);
      const original = visitTitle(day, schedule, slot);
      if (!original || !matches(original)) return [];
      const candidates: VisitChange[] = walksForCity(day.cityId).flatMap(walk => walk.id ? [{ from, slot, alternative: walk.id }] : []);
      if (moveVisits[visitChangeKey({ from, slot })]) {
        days.forEach((target, into) => {
          if (into !== index && target.cityId === day.cityId) candidates.push({ from, slot, to: changeDayKey(target) });
        });
      }
      const options = candidates.flatMap(change => {
        if (active && change.to === active.change.to && change.alternative === active.change.alternative) return [];
        const revised = buildTripSchedules(days, { ...profile, visitChanges: changeVisit(profile.visitChanges, change) }).applied;
        const key = visitChangeKey(change);
        const added = revised.find(item => visitChangeKey(item.change) === key);
        return added && preservesVisitChanges(applied, revised, change) ? [added] : [];
      });
      if (!options.length && !pending.includes(slot) && !active && !namedVisit) return [];
      options.sort((a, b) => Number(Boolean(b.change.to)) - Number(Boolean(a.change.to))
        || Number(Boolean(b.similar)) - Number(Boolean(a.similar)) || Math.abs(a.dayIndex - index) - Math.abs(b.dayIndex - index)
        || a.start.localeCompare(b.start));
      return [{ dayIndex: index, slot, original, options, ...(active ? { current: active } : {}) }];
    });
  });
}

export function adjustmentSummary(item: VisitAdjustment) {
  return `第 ${item.dayIndex + 1} 天 ${item.start}–${item.end} · ${item.visit}`;
}
