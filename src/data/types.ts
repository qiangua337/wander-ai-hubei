export type Source = { title: string; url: string };
export type Stop = { time: string; title: string; detail: string };
export type TripDay = { title: string; stops: Stop[]; transport: string; meal: string; tip: string };
export type CityGuide = {
  id: string; name: string; shortName: string; area: string; tagline: string; intro: string;
  season: string; arrival: string; stay: string; food: string[]; tips: string[];
  days: TripDay[]; sources: Source[];
};
export type PhotoCredit = { filename?: string; cityId?: string; subject: string; alt?: string; author: string; source: string; license: string; licenseUrl: string };
export type Destination = {
  id: string; cityId: string; title: string; category: 'nature' | 'city'; tag: string;
  duration: string; description: string; overview: string; highlights: string[]; tips: string[];
  image?: string; imageAlt?: string; imagePosition?: string;
};

export function day(title: string, morning: [string, string], afternoon: [string, string], evening: [string, string], transport: string, meal: string, tip: string): TripDay {
  return { title, stops: [
    { time: '上午 · 约 09:00–12:00', title: morning[0], detail: morning[1] },
    { time: '下午 · 约 14:00–17:00', title: afternoon[0], detail: afternoon[1] },
    { time: '晚上 · 约 18:00 后', title: evening[0], detail: evening[1] },
  ], transport, meal, tip };
}
