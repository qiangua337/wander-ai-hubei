import { cityById, destinationById } from './data';
import { routeForPlace } from './discovery';
import { buildTrip, defaultProfile, normalizeProfile, type Profile } from './planning';
import { buildTripSchedules } from './visit-scheduling';

export type WishlistPlanDay = {
  chapter: number;
  title: string;
  placeIds: string[];
  conditionalPlaceIds: string[];
};
export type WishlistPlanResult = {
  profile?: Profile;
  days: WishlistPlanDay[];
  included: string[];
  skipped: { id: string; reason: string }[];
};

type MappedPlace = { id: string; visit: string };

function scheduledDays(profile: Profile, byChapter: ReadonlyMap<number, MappedPlace[]>): WishlistPlanDay[] {
  const trip = buildTrip(profile);
  const { schedules } = buildTripSchedules(trip, profile);
  return trip.map((day, index) => {
    const schedule = schedules[index];
    const candidates = byChapter.get(day.originalIndex) || [];
    const visits = schedule.rows.filter(row => row.kind === 'visit' && !row.provisional);
    const matched = visits.flatMap(row => candidates.filter(place => place.visit === row.title)
      .map(place => ({ id: place.id, conditional: Boolean(row.optional) || row.title.includes('或') })));
    return {
      chapter: day.originalIndex,
      title: schedule.title || day.title,
      placeIds: [...new Set(matched.map(item => item.id))],
      conditionalPlaceIds: [...new Set(matched.filter(item => item.conditional).map(item => item.id))],
    };
  });
}

export function planWishlist(cityId: string, selectedIds: readonly string[], date: string, travelers: number): WishlistPlanResult {
  const selected = [...new Set(selectedIds)];
  if (!Object.hasOwn(cityById, cityId)) {
    return { days: [], included: [], skipped: selected.map(id => ({ id, reason: '请先选择有效的湖北城市。' })) };
  }

  const byChapter = new Map<number, MappedPlace[]>();
  const reasons = new Map<string, string>();
  for (const id of selected) {
    if (!Object.hasOwn(destinationById, id)) {
      reasons.set(id, '这条收藏已不在目的地目录中。');
      continue;
    }
    const place = destinationById[id];
    if (place.cityId !== cityId) {
      reasons.set(id, `它在${cityById[place.cityId].shortName}，请在该城市单独规划。`);
      continue;
    }
    const match = routeForPlace(id);
    if (!match) {
      reasons.set(id, '暂没有可带入的参考路线，可先查看景点攻略。');
      continue;
    }
    const mapped = { id, visit: match.visit };
    const chapter = byChapter.get(match.chapter);
    if (chapter) chapter.push(mapped);
    else byChapter.set(match.chapter, [mapped]);
  }

  const makeProfile = (indices: number[]) => normalizeProfile({
    ...defaultProfile(cityId),
    indices,
    date,
    party: travelers,
    group: travelers === 1 ? 'solo' : 'friends',
    arrival: 'full-day',
    departure: 'flexible',
  });
  let profile = makeProfile([...byChapter.keys()]);
  let days = scheduledDays(profile, byChapter);
  const draftedTitles = new Map(days.map(day => [day.chapter, day.title]));

  // A previous day's lodging can switch a later chapter's actual visits.
  // Remove the first empty chapter and recheck the remaining schedule in order.
  for (let empty = days.find(day => !day.placeIds.length); empty; empty = days.find(day => !day.placeIds.length)) {
    profile = makeProfile(profile.indices.filter(chapter => chapter !== empty.chapter));
    days = scheduledDays(profile, byChapter);
  }
  const included = days.flatMap(day => day.placeIds);
  const includedIds = new Set(included);
  const skipped = selected.filter(id => !includedIds.has(id)).map(id => {
    const validationReason = reasons.get(id);
    if (validationReason) return { id, reason: validationReason };
    const chapter = routeForPlace(id)?.chapter;
    const actualTitle = chapter === undefined ? undefined
      : days.find(day => day.chapter === chapter)?.title || draftedTitles.get(chapter);
    const reason = actualTitle
      ? `合排时这天走「${actualTitle}」，未包含这一站。可从攻略单独规划。`
      : '实际时间表没有安排这一站。可先查看景点攻略。';
    return { id, reason };
  });
  return { profile: days.length ? profile : undefined, days, included, skipped };
}
