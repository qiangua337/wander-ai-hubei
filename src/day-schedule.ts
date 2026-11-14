import { dayJourneys, hankouFromWuchang, type DayJourney, type MinuteRange } from './data/day-journeys';
import { returnWalks, type ReturnSource } from './data/return-mornings';
import type { PlannedDay, Profile } from './planning';
import { formatClock, parseClock, returnBreakfastMinutes, returnBreakfastStart } from './return-timing';
import { chapterKey, readDayStart } from './day-starts';

type RowKind = 'move' | 'visit' | 'meal' | 'stay';
export type ScheduleRow = {
  kind: RowKind;
  time?: string;
  phase?: string;
  deadline?: boolean;
  optional?: boolean;
  meal?: '早餐' | '午餐' | '晚餐';
  title: string;
  detail?: string;
  minutes?: MinuteRange;
  duration?: number;
};
export type DaySchedule = {
  start: string;
  from: string;
  headline: string;
  rows: ScheduleRow[];
  sources: ReturnSource[];
  note?: string;
  recommendedStart?: string;
  title?: string;
  mainVisitSkipped?: boolean;
};

export function scheduleDuration(row: ScheduleRow): string {
  if (row.minutes) {
    const [min, max] = row.minutes;
    return min === max ? `${min} 分钟` : `${min}–${max} 分钟`;
  }
  if (!row.duration) return '';
  const hours = Math.floor(row.duration / 60);
  const remainder = row.duration % 60;
  return [hours ? `${hours} 小时` : '', remainder ? `${remainder} 分钟` : ''].filter(Boolean).join(' ');
}

const minutesAsTime = (minutes: number | undefined) => minutes !== undefined && minutes >= 0 && minutes < 1440
  ? formatClock(minutes)
  : undefined;
const activeArrival = (arrival: Profile['arrival']) => arrival === 'morning' || arrival === 'afternoon' || arrival === 'evening';

function availableLodging(overnight: string) {
  return overnight.split(/[；（]/, 1)[0];
}

function stayRow(day: PlannedDay, isLast: boolean): ScheduleRow {
  return {
    kind: 'stay',
    phase: isLast ? '延住可选' : '夜宿',
    title: availableLodging(day.overnight),
    detail: isLast ? '当天返程时，按票面安排取行李与接驳。' : '住宿按片区挑选，先确认入住、停车或行李寄存。',
  };
}

function visitDetail(title: string, fallback: string | undefined, note?: string) {
  return [fallback, note].filter(Boolean).join(' ') || `从${title}的开放入口按现场指引游览。`;
}

function afternoonReturnSchedule(day: PlannedDay, profile: Profile): DaySchedule {
  const timing = day.afternoonReturn!;
  const station = day.stationSchedule;
  const breakfastStays = !station || (parseClock(station.finishBy) ?? 0) >= returnBreakfastStart + returnBreakfastMinutes;
  const rows: ScheduleRow[] = [{
    kind: 'meal', meal: '早餐', time: station && breakfastStays ? formatClock(returnBreakfastStart) : undefined,
    phase: breakfastStays ? '上午' : '行前',
    title: breakfastStays ? '落脚片区就近早餐' : '提前备好早餐或到站后用餐',
    duration: station && breakfastStays ? returnBreakfastMinutes : undefined, detail: day.breakfast,
  }];
  if (day.returnMorning) rows.push({
    kind: 'visit', time: station ? formatClock(returnBreakfastStart + returnBreakfastMinutes) : undefined,
    phase: '上午可选', title: day.returnMorning.sight, duration: day.returnMorning.minutes, detail: day.stops[0].detail,
  });
  const canEatLunchNearby = (parseClock(station?.finishBy) ?? 0) >= 12 * 60 + 30 && day.returnMorning;
  if (canEatLunchNearby) {
    rows.push({ kind: 'meal', meal: '午餐', time: '12:00', title: '落脚片区就近午餐', detail: day.lunch, duration: 30 });
  }
  if (timing.luggageMinutes > 0) rows.push({
    kind: 'stay', time: station?.finishBy, phase: '去站前', title: '取行李', duration: timing.luggageMinutes, detail: '回到寄存点取行李，并核对进站口。',
  });
  rows.push({
    kind: 'move', time: station?.leaveForStationBy, phase: '按票面提前出发', deadline: Boolean(station), title: '出发去车站', detail: day.stops[1].detail,
    minutes: timing.travelAllowance !== undefined ? [timing.travelAllowance, timing.travelAllowance] : undefined,
  }, {
    kind: 'move', time: station?.arriveBy, phase: '按票面进站', deadline: Boolean(station), title: day.stops[2].title, detail: day.stops[2].detail,
    duration: station ? timing.stationMinutes : undefined,
  });
  if (!canEatLunchNearby) rows.push({ kind: 'meal', meal: '午餐', phase: '随接驳安排', title: '午餐外带或到站补给', detail: '按接驳余量决定在哪用餐，先按计划去站。' });
  if (profile.departureTime) rows.push({ kind: 'move', time: profile.departureTime, title: '按票面发车' });
  rows.push({ kind: 'meal', meal: '晚餐', phase: '返程途中或抵达后', title: '按抵达时间安排晚餐', detail: day.dinner });
  return {
    start: station ? `${station.leaveForStationBy} 前去站` : '按票面倒推去站时间',
    from: timing.area || '实际落脚片区',
    headline: [day.returnMorning?.sight || '就近用餐', ...(timing.luggageMinutes > 0 ? ['取行李'] : []), '前往车站'].join(' → '),
    rows, sources: day.returnSources || [],
  };
}

function timingChanges(day: PlannedDay, journey: DayJourney, profile: Profile, previous: PlannedDay | undefined, isLast: boolean): DaySchedule {
  const arriving = !previous && activeArrival(profile.arrival);
  const departing = isLast && profile.departure && profile.departure !== 'flexible';
  const transfers = Boolean(day.transfer);
  const rows: ScheduleRow[] = [];
  let start: string;
  let from: string;
  let headline: string;
  const afternoon = journey.afternoon;

  if (transfers) {
    start = profile.mode === 'drive' ? '建议上午转场' : '按已购车次出发';
    from = availableLodging(previous?.overnight || '上一城的住宿片区');
    headline = `${day.transfer} → 放行李 → 同片区午餐`;
    rows.push(
      { kind: 'move', phase: '上午', title: day.transfer!, detail: day.stops[0].detail },
      { kind: 'meal', meal: '午餐', phase: '抵达后', title: departing ? '实际返程接驳点就近补给' : `在${availableLodging(day.overnight)}附近放行李、吃午餐`, detail: '确认当天到达时间和餐馆供餐，行李不带去远端景区。' },
    );
    if (!departing && !day.sightseeingRemoved && afternoon) rows.push(
      { kind: 'move', phase: '安顿后', title: `从实际住宿点前往${afternoon.place}`, detail: '先查公交或短途车与步行入口，车程按酒店位置核对。余量不足就在住宿附近休息。' },
      { kind: 'visit', phase: '下午可选', title: afternoon.place, detail: afternoon.note, duration: Math.min(afternoon.length, 90) },
    );
    if (!departing) rows.push({ kind: 'meal', meal: '晚餐', phase: '傍晚', title: `在${availableLodging(day.overnight)}附近用餐`, detail: journey.dinner });
  } else if (arriving) {
    start = '按实际抵达时间';
    from = profile.origin || '已确认的出发地';
    headline = departing ? '抵达 → 寄存行李 → 返程' : '抵达 → 安顿 → 就近用餐';
    rows.push(
      { kind: 'move', phase: '按票面', title: day.stops[0].title, detail: day.stops[0].detail },
      { kind: departing ? 'move' : 'stay', phase: '抵达后', title: departing ? '确认行李寄存和返程接驳' : '寄存行李或入住', detail: '到站后再安排实际接驳时间，酒店入住以预订为准。' },
    );
    if (!departing) {
      rows.push({ kind: 'meal', meal: profile.arrival === 'evening' ? '晚餐' : '午餐', phase: '抵达后', title: '接驳片区就近用餐', detail: profile.arrival === 'evening' ? day.dinner : day.lunch });
      if (profile.arrival === 'morning' && afternoon) rows.push(
        { kind: 'move', phase: '安顿后', title: `从实际落脚点前往${afternoon.place}`, detail: '从实际寄存点查公交或短途车，先确认往返时间。' },
        { kind: 'visit', phase: '下午可选', title: afternoon.place, detail: '抵达较晚就改为住宿片区散步。', duration: Math.min(afternoon.length, 90) },
      );
      if (profile.arrival !== 'evening') rows.push({
        kind: 'meal', meal: '晚餐', phase: '傍晚', title: `在${availableLodging(day.overnight)}附近用餐`, detail: '优先找住宿附近的家常菜，便于用餐后回去休息。',
      });
    }
  } else {
    start = profile.departureTime ? `${profile.departureTime} 返程` : '按票面倒推';
    from = availableLodging(previous?.overnight || '实际落脚片区');
    headline = '住宿片区 → 接驳 → 返程';
    if (!day.sightseeingRemoved && profile.departure === 'evening') {
      rows.push({ kind: 'visit', phase: '上午可选', title: journey.morning.place, duration: Math.min(journey.morning.length, 120), detail: '先核对开放、车站与回住处取行李的时间，有余量再去。' });
    }
  }
  if (!transfers && (arriving || !profile.departureTime || profile.departure !== 'morning')) {
    rows.unshift({ kind: 'meal', meal: '早餐', phase: '出门前或途中', title: '早餐跟随当天交通', detail: day.breakfast });
  }
  if (departing) {
    rows.push({ kind: 'move', phase: '按实际接驳', title: day.stops[1].title, detail: day.stops[1].detail });
    rows.push({ kind: 'move', time: profile.departureTime, phase: '以票面为准', title: profile.departureStation ? `从${profile.departureStation}返程` : '按已确认的交通方式返程', detail: day.stops[2].detail });
    rows.push({ kind: 'meal', meal: '晚餐', phase: '返程途中或抵达后', title: '就近安排晚餐', detail: day.dinner });
  } else {
    rows.push(stayRow(day, isLast));
  }
  return { start, from, headline, rows, sources: journey.sources || [], note: journey.note };
}

export function buildDaySchedule(day: PlannedDay, profile: Profile, previous: PlannedDay | undefined, isLast: boolean): DaySchedule {
  if (day.afternoonReturn) return afternoonReturnSchedule(day, profile);
  const destination = day.cityId === 'wuhan' && day.originalIndex === 2 && day.region.startsWith('汉口')
    ? hankouFromWuchang
    : dayJourneys[day.cityId][day.originalIndex];
  if ((!previous && activeArrival(profile.arrival)) || day.transfer || (isLast && profile.departure && profile.departure !== 'flexible')) {
    return timingChanges(day, destination, profile, previous, isLast);
  }

  const priorStay = previous?.cityId === day.cityId ? availableLodging(previous.overnight) : undefined;
  const sameTownOption = priorStay?.split('或').find(area => destination.baseMatch.test(area));
  const from = sameTownOption || priorStay || destination.base;
  const fromPresetBase = destination.baseMatch.test(from);
  const localOption = returnWalks[day.cityId]?.find(option => option.base.test(from));
  const lodging = availableLodging(day.overnight);
  const nightMatches = lodging === destination.night || lodging.split('或').some(area => area.includes(destination.night));
  const overnight = nightMatches ? destination.night : lodging;
  const slower = profile.pace === 'relaxed';
  const extraTransfer = profile.group === 'senior' || profile.group === 'family' || profile.party >= 5 ? 10 : 0;
  const morning = destination.morning;
  const afternoon = destination.afternoon;
  const rows: ScheduleRow[] = [];
  const useDrive = (leg: typeof morning.via) => profile.mode === 'drive' && leg.drive ? leg.drive : leg;
  const firstMoveKnown = fromPresetBase && Boolean(useDrive(morning.via).minutes);
  const transferRange = (leg: typeof morning.via): MinuteRange | undefined => {
    const range = useDrive(leg).minutes;
    return range && [range[0], range[1] + extraTransfer];
  };
  const upperTravel = (leg: typeof morning.via) => {
    const range = transferRange(leg);
    return range ? Math.ceil(range[1] / 5) * 5 : undefined;
  };
  const customStart = firstMoveKnown ? readDayStart(profile.dayStarts?.[chapterKey(day.cityId, day.originalIndex)]) : undefined;
  const start = firstMoveKnown ? customStart || destination.start : undefined;
  let minute = parseClock(start);
  // This cutoff protects a reasonable visit block on a later-starting day.
  const visitCutoff = 16 * 60 + 30;
  const mainArrival = minute === undefined ? undefined : minute + (upperTravel(morning.via) || 0);
  const lunchMove = destination.lunch.via;
  const lunchEstimate = mainArrival === undefined ? 0
    : Math.max(9 * 60, mainArrival) + morning.length + (lunchMove ? upperTravel(lunchMove) || 0 : 0);
  const brunchAtBase = !!customStart && (minute ?? 0) >= 11 * 60 + 30;
  const eatEarlier = brunchAtBase || Boolean(customStart && (lunchEstimate > 13 * 60 + 30 || (lunchMove && upperTravel(lunchMove) === undefined)));
  const packLunch = eatEarlier && !brunchAtBase && (mainArrival ?? 0) > 13 * 60 + 30;
  const lunchAtEntrance = eatEarlier && !brunchAtBase && !packLunch;
  const mainStart = lunchAtEntrance && mainArrival !== undefined ? Math.max(mainArrival, 11 * 60 + 30) + 40 : mainArrival;
  const minVisit = day.effort === 'high' ? morning.length : Math.min(morning.length, 45);
  const enoughForMain = !customStart || (mainStart ?? 0) <= visitCutoff - minVisit;
  const overnightHere = from === overnight || (fromPresetBase && destination.baseMatch.test(overnight));
  const fallbackWalk = !enoughForMain && overnightHere ? localOption : undefined;
  rows.push({
    kind: 'meal', meal: brunchAtBase ? '午餐' : '早餐', time: minute === undefined ? undefined : minutesAsTime(minute - (brunchAtBase ? 40 : 30)),
    phase: '出门前', title: brunchAtBase ? '住处附近先吃早午餐' : '住处附近早餐',
    detail: brunchAtBase ? localOption?.lunch || '先在出门片区吃一份正餐，下午不另绕路找午餐。'
      : fromPresetBase ? day.breakfast : `在${from}附近吃早餐，再去首站。`,
    duration: brunchAtBase ? 30 : 20,
  });

  const move = (title: string, details: { method: string; minutes?: MinuteRange; drive?: { method: string; minutes: MinuteRange } }, optional = false) => {
    const chosen = useDrive(details);
    const allowance = transferRange(details);
    rows.push({ kind: 'move', time: minutesAsTime(minute), phase: '接驳', title, detail: chosen.method, minutes: allowance, optional });
    // Use the upper estimate to leave room for access and waiting before the next stop.
    const upper = upperTravel(details);
    minute = minute !== undefined && upper !== undefined ? minute + upper : undefined;
  };
  const activity = (kind: 'visit' | 'meal', title: string, length: number | undefined, phase: string, detail?: string, earliest = 0, meal?: ScheduleRow['meal'], optional = false) => {
    if (minute !== undefined) minute = Math.max(minute, earliest);
    rows.push({ kind, meal, time: minutesAsTime(minute), phase, title, detail, duration: length, optional });
    if (minute !== undefined && length !== undefined) minute += length;
  };

  const unmeasured = {
    method: profile.mode === 'drive' ? '按实际起点与停车位置核对车程。' : '从实际起点核对公交、步行或预约接驳。',
  };
  if (enoughForMain) {
    move(`${from} → ${morning.place}`, fromPresetBase ? morning.via : unmeasured);
    if (packLunch) rows.push({ kind: 'meal', meal: '午餐', title: '提前备好便携午餐', phase: '途中', detail: '按接驳安排，在允许就餐的停留点补给。' });
    if (lunchAtEntrance) activity('meal', '第一站入口附近先吃午餐', 40, '抵达后', '有供餐就近用餐，也可自备午餐后再进景区。', 11 * 60 + 30, '午餐');
    const mainLength = customStart && minute !== undefined ? Math.min(morning.length, visitCutoff - Math.max(minute, 9 * 60)) : morning.length;
    activity('visit', morning.place, mainLength, '到达后', visitDetail(morning.place, day.stops[0].detail, morning.note), 9 * 60);
  } else {
    if (fallbackWalk) activity('visit', fallbackWalk.sight, fallbackWalk.minutes, '住处附近', fallbackWalk.detail, 0, undefined, true);
    if (eatEarlier && !brunchAtBase) activity('meal', '在出发片区吃午餐', 40, '午间', localOption?.lunch || '就近吃一份正餐，再安排住宿或接驳。', 11 * 60 + 30, '午餐');
    if (!overnightHere) move(`${from} → ${overnight}`, unmeasured);
    else if (!fallbackWalk) rows.push({ kind: 'stay', phase: '下午', title: '在住宿片区休整', detail: '可在住处附近散步，或按已确认的接驳安排后续行程。' });
  }

  const afternoonTravel = afternoon && upperTravel(afternoon.via);
  const onTheWayToLunch = lunchMove ? upperTravel(lunchMove) : 0;
  const lunchLength = destination.lunch.length ?? 55;
  const earliestLunchEnd = minute === undefined ? undefined : Math.max(11 * 60 + 45, minute + (onTheWayToLunch || 0)) + lunchLength;
  const secondStart = eatEarlier && minute !== undefined ? minute + (onTheWayToLunch || 0) : earliestLunchEnd;
  const hasAfternoon = !!afternoon && enoughForMain && (!customStart || (secondStart !== undefined && onTheWayToLunch !== undefined
    && afternoonTravel !== undefined && secondStart + afternoonTravel + 45 <= visitCutoff));
  if (lunchMove && (!eatEarlier || hasAfternoon)) move(`${morning.place} → ${destination.lunch.area}`, lunchMove);
  if (!eatEarlier) activity('meal', `在${destination.lunch.area}吃午餐`, lunchLength, '午间', destination.lunch.food, 11 * 60 + 45, '午餐');
  if (afternoon && hasAfternoon) {
    const optional = slower && overnight === destination.base && destination.home?.minutes !== undefined;
    move(`前往${afternoon.place}`, afternoon.via, optional);
    const sameStop = !slower && afternoon.place === day.stops[1].title;
    const afternoonLength = Math.min(afternoon.length, slower ? 75 : Infinity, customStart && minute !== undefined ? Math.max(45, visitCutoff - minute) : Infinity);
    activity('visit', afternoon.place, afternoonLength, '下午',
      visitDetail(afternoon.place, sameStop ? day.stops[1].detail : undefined, afternoon.note), 0, undefined, optional);
  }
  const shortened = !!customStart && !!afternoon && !hasAfternoon;
  if (!isLast || !/返程/.test(day.stops[2].title)) {
    const isStandardNight = overnight === destination.night;
    const home = shortened ? destination.earlyReturn : destination.home;
    if (enoughForMain && isStandardNight && home) move(`返回${overnight}`, home);
    else if (enoughForMain && shortened) move(`从实际结束点去${overnight}`, {
      method: profile.mode === 'drive' ? '结束游览后按实际停车点和住处查车程。' : '结束游览后就近乘公交或短途车，按实际出口核对车程。',
    });
    else if (enoughForMain && !isStandardNight) move(`前往${overnight}`, destination.nightMoves?.[overnight] || {
      method: '按当天结束位置提前确认去住宿片区的车辆与行李安排，跨片区接驳按实际路线估算。',
    });
    activity('meal', `在${overnight}附近吃晚餐`, 55, '傍晚', isStandardNight && (!customStart || (enoughForMain && (!shortened || home)))
      ? destination.dinner : '先到住处，再就近找一份家常晚餐。', 17 * 60 + 45, '晚餐');
  } else {
    rows.push({ kind: 'move', phase: '收尾', title: '按票面预留取行李与返程', detail: day.transport });
  }
  rows.push(stayRow(day, isLast));
  const cityName = day.title.split(' · ')[0];
  return {
    start: start ? `${start} ${customStart ? '出门' : '建议出门'}` : !fromPresetBase ? '按实际住处与首站倒推出门时间' : '按已确认的接驳倒推出门时间',
    from,
    headline: enoughForMain ? [morning.place, hasAfternoon ? afternoon?.place : '同片区休整'].filter(Boolean).join(' → ')
      : fallbackWalk?.sight || (overnightHere ? '住宿片区休整' : `前往${overnight}休整`),
    rows, sources: fallbackWalk ? fallbackWalk.sources : destination.sources || [],
    recommendedStart: firstMoveKnown ? destination.start : undefined,
    title: !enoughForMain ? `${cityName} · ${overnightHere ? '住处附近慢行' : '移宿与休息'}` : shortened ? `${cityName} · ${morning.place}` : undefined,
    mainVisitSkipped: !enoughForMain || undefined,
    note: [
      enoughForMain && !shortened ? destination.note : undefined,
      enoughForMain && shortened ? `按 ${customStart} 出门，下午的「${afternoon.place}」留到有整段时间时再去。` : undefined,
      !enoughForMain ? `按 ${customStart} 出门，留给「${morning.place}」的时间太短。当天优先安排住宿片区，原景点可留到另一天。` : undefined,
      customStart && enoughForMain ? '游览计划预留到 16:30 左右，预约、开放和末班接驳请按当天核对。' : undefined,
      extraTransfer ? '带孩子、长辈或多人同行时，每段已估算的接驳多留 10 分钟。' : undefined,
    ].filter(Boolean).join(' ') || undefined,
  };
}

export type LodgingBlock = { area: string; firstNight: number; lastNight: number };
export function groupLodging(days: readonly PlannedDay[]): LodgingBlock[] {
  const blocks: LodgingBlock[] = [];
  days.slice(0, -1).forEach((day, index) => {
    const area = availableLodging(day.overnight);
    const last = blocks.at(-1);
    if (last?.area === area) last.lastNight = index + 1;
    else blocks.push({ area, firstNight: index + 1, lastNight: index + 1 });
  });
  return blocks;
}

export function describePlanDay(days: PlannedDay[], index: number, profile: Profile): string {
  const day = days[index];
  if (!day) return `这份行程共 ${days.length} 天，可以查看第 1 至第 ${days.length} 天。`;
  const schedule = buildDaySchedule(day, profile, days[index - 1], index === days.length - 1);
  const items = schedule.rows
    .filter(row => row.kind !== 'stay' || row.title === '取行李' || index < days.length - 1)
    .map(row => {
      const when = row.time ? row.time + (row.deadline ? ' 前' : '') : row.phase || '按顺序';
      const duration = scheduleDuration(row);
      return `${when}｜${row.title}${row.optional ? '（可选）' : ''}${duration ? `（${duration}）` : ''}${row.detail ? `。 ${row.detail}` : ''}`;
    });
  return [`第 ${index + 1} 天 · ${schedule.title || day.title}`, `${schedule.start} · ${schedule.from}`,
    ...(schedule.note ? [schedule.note] : []), ...items, '时间为规划预留，车船班次和实际接驳以当天为准。'].join('\n');
}

export function renderScheduleText(schedule: DaySchedule): string[] {
  return [
    `出门安排：${schedule.start} · ${schedule.from}`,
    ...(schedule.note ? [schedule.note] : []),
    ...schedule.rows.flatMap(row => {
      const length = scheduleDuration(row);
      return [
        `${row.time ? row.time + (row.deadline ? ' 前' : '') : row.phase || '顺序安排'}｜${row.meal ? row.meal + '：' : ''}${row.title}${row.optional ? '（可选）' : ''}${length ? `（${row.kind === 'move' ? '预留' : '约'} ${length}）` : ''}`,
        ...(row.detail ? [row.detail] : []),
      ];
    }),
  ];
}
