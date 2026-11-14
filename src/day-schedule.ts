import { dayJourneys, hankouFromWuchang, type DayJourney, type MinuteRange } from './data/day-journeys';
import type { ReturnSource } from './data/return-mornings';
import type { PlannedDay, Profile } from './planning';
import { formatClock, parseClock, returnBreakfastMinutes, returnBreakfastStart } from './return-timing';

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
  const lodging = availableLodging(day.overnight);
  const nightMatches = lodging === destination.night || lodging.split('或').some(area => area.includes(destination.night));
  const overnight = nightMatches ? destination.night : lodging;
  const slower = profile.pace === 'relaxed';
  const extraTransfer = profile.group === 'senior' || profile.group === 'family' || profile.party >= 5 ? 10 : 0;
  const morning = destination.morning;
  const afternoon = destination.afternoon;
  const rows: ScheduleRow[] = [];
  const firstMoveKnown = fromPresetBase && Boolean(morning.via.minutes);
  let minute = firstMoveKnown ? parseClock(destination.start) : undefined;
  rows.push({
    kind: 'meal', meal: '早餐', time: minute === undefined ? undefined : minutesAsTime(minute - 30), phase: '出门前', title: '住处附近早餐',
    detail: fromPresetBase ? day.breakfast : `在${from}附近吃早餐，按第一段实际交通留好接驳时间。`,
    duration: 20,
  });

  const move = (title: string, details: { method: string; minutes?: MinuteRange; drive?: { method: string; minutes: MinuteRange } }, optional = false) => {
    const chosen = profile.mode === 'drive' && details.drive ? details.drive : details;
    const allowance: MinuteRange | undefined = chosen.minutes && [chosen.minutes[0], chosen.minutes[1] + extraTransfer];
    rows.push({ kind: 'move', time: minutesAsTime(minute), phase: '接驳', title, detail: chosen.method, minutes: allowance, optional });
    // Use the upper estimate to leave room for access and waiting before the next stop.
    minute = minute !== undefined && allowance ? minute + Math.ceil(allowance[1] / 5) * 5 : undefined;
  };
  const activity = (kind: 'visit' | 'meal', title: string, length: number, phase: string, detail?: string, earliest = 0, meal?: ScheduleRow['meal'], optional = false) => {
    if (minute !== undefined) minute = Math.max(minute, earliest);
    rows.push({ kind, meal, time: minutesAsTime(minute), phase, title, detail, duration: length, optional });
    if (minute !== undefined) minute += length;
  };

  if (fromPresetBase) move(`${from} → ${morning.place}`, morning.via);
  else move(`${from} → ${morning.place}`, {
    method: profile.mode === 'drive' ? '从实际住处驾车出发，核对首站停车入口，再按当天导航留时间。' : '从实际住宿点查至首站入口的公交、铁路或预约接驳；车次和门到门时间需先确认。',
  });
  activity('visit', morning.place, morning.length, '到达后', visitDetail(morning.place, day.stops[0].detail, morning.note), 9 * 60);
  if (destination.lunch.via) move(`${morning.place} → ${destination.lunch.area}`, destination.lunch.via);
  const lunchLength = destination.lunch.length ?? 55;
  activity('meal', `在${destination.lunch.area}吃午餐`, lunchLength, '午间', destination.lunch.food, 11 * 60 + 45, '午餐');
  if (afternoon) {
    const optional = slower && overnight === destination.base && destination.home?.minutes !== undefined;
    move(`前往${afternoon.place}`, afternoon.via, optional);
    const sameStop = !slower && afternoon.place === day.stops[1].title;
    activity('visit', afternoon.place, slower ? Math.min(afternoon.length, 75) : afternoon.length, '下午',
      visitDetail(afternoon.place, sameStop ? day.stops[1].detail : undefined, afternoon.note), 0, undefined, optional);
  }
  if (!isLast || !/返程/.test(day.stops[2].title)) {
    const isStandardNight = overnight === destination.night;
    if (isStandardNight && destination.home) move(`返回${overnight}`, destination.home);
    else if (!isStandardNight) move(`前往${overnight}`, destination.nightMoves?.[overnight] || {
      method: '按当天结束位置提前确认去住宿片区的车辆与行李安排，跨片区接驳按实际路线估算。',
    });
    activity('meal', `在${overnight}附近吃晚餐`, 55, '傍晚', isStandardNight ? destination.dinner : '先完成接驳和寄存，再找住处附近的家常餐馆。', 17 * 60 + 45, '晚餐');
  } else {
    rows.push({ kind: 'move', phase: '收尾', title: '按票面预留取行李与返程', detail: day.transport });
  }
  rows.push(stayRow(day, isLast));
  return {
    start: firstMoveKnown ? `${destination.start} 建议出门` : !fromPresetBase ? '按实际住处与首站倒推出门时间' : '按已确认的接驳倒推出门时间',
    from,
    headline: [morning.place, afternoon?.place || '同片区休整'].join(' → '),
    rows, sources: destination.sources || [],
    note: [destination.note, extraTransfer ? '带孩子、长辈或多人同行时，每段已估算的接驳多留 10 分钟。' : ''].filter(Boolean).join(' ') || undefined,
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
  return [`第 ${index + 1} 天 · ${day.title}`, `${schedule.start} · ${schedule.from}`, ...items, '时间为规划预留，车船班次和实际接驳以当天为准。'].join('\n');
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
