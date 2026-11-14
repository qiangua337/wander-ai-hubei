import { ArrowUpRight } from 'lucide-react';
import { stories } from '../data';
import { Button } from './ui';

export function TravelStories() {
  return <section id="stories" aria-labelledby="stories-title" className="section-space page-width">
    <div className="section-heading"><div><p className="eyebrow">伍 / 旅行的不同想象</p><h2 id="stories-title" className="section-title">旅程的余味，留在日常。</h2></div><p className="text-xs leading-6 text-muted">以下为旅行故事示例<br />用于展示不同的出行想象</p></div>
    <div className="story-grid">{stories.map((story, i) => <figure key={story.name} className="story-note"><div className="flex items-center justify-between"><p className="text-xs tracking-wider text-terracotta">{story.theme}</p><span className="font-display text-xs text-muted">0{i + 1}</span></div><span className="story-quote" aria-hidden="true">“</span><blockquote><h3 className="font-sans text-[22px] font-medium leading-relaxed">{story.title}</h3><p className="mt-4 text-sm leading-8 text-muted">{story.quote.replace(/^[“”]|[“”]$/g, '')}</p></blockquote><figcaption className="mt-7 text-xs text-muted"><span className="mr-3 inline-block h-px w-6 align-middle bg-line" />{story.name} · 示例旅行者</figcaption></figure>)}</div>
  </section>;
}

export function JourneyInvitation({ onPlan }: { onPlan: () => void }) {
  return <section aria-labelledby="cta-title" className="journey-invitation">
    <img src="/images/shennongjia.jpg" alt="神农架大九湖湿地公园的森林与木栈道" width="1600" height="1067" loading="lazy" className="invitation-image" /><div className="invitation-shade" aria-hidden="true" />
    <div className="page-width invitation-inner"><div><h2 id="cta-title" className="section-title text-white">规划你的湖北行程</h2><p className="mt-3 text-sm leading-7 text-white/90">选城市和天数，把景点、美食、住宿和返程排进每天。</p><p className="mt-4 text-xs text-white/75">神农架 · 大九湖</p></div><div className="invitation-action"><Button variant="white" onClick={onPlan} className="min-h-14 px-7">开始规划<ArrowUpRight size={18} strokeWidth={1.5} /></Button></div></div>
  </section>;
}
