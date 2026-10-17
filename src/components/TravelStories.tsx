import { ArrowUpRight } from 'lucide-react';
import { stories } from '../data';
import { Button } from './ui';

export function TravelStories() {
  return <section id="stories" aria-labelledby="stories-title" className="section-space page-width">
    <div className="section-heading"><div><p className="eyebrow">伍 / 旅行的不同想象</p><h2 id="stories-title" className="section-title">旅程的余味，留在日常。</h2></div><p className="text-[10px] leading-6 text-muted">以下为旅行故事示例<br />用于展示不同的出行想象</p></div>
    <div className="story-grid">{stories.map((story, i) => <figure key={story.name} className="story-note"><div className="flex items-center justify-between"><p className="text-[10px] tracking-wider text-terracotta">{story.theme}</p><span className="font-display text-[10px] text-muted">0{i + 1}</span></div><span className="story-quote" aria-hidden="true">“</span><blockquote><h3 className="font-editorial text-[22px] font-normal leading-relaxed">{story.title}</h3><p className="mt-4 text-[13px] leading-8 text-muted">{story.quote.replace(/^[“”]|[“”]$/g, '')}</p></blockquote><figcaption className="mt-7 text-[11px] text-muted"><span className="mr-3 inline-block h-px w-6 align-middle bg-line" />{story.name} · 示例旅行者</figcaption></figure>)}</div>
  </section>;
}

export function JourneyInvitation({ onPlan }: { onPlan: () => void }) {
  return <section aria-labelledby="cta-title" className="journey-invitation">
    <img src="/images/shennongjia.jpg" alt="神农架大九湖湿地公园的森林与木栈道" width="1600" height="1067" loading="lazy" className="invitation-image" /><div className="invitation-shade" aria-hidden="true" />
    <div className="page-width invitation-inner"><div><p className="eyebrow text-seafoam">山河相逢，自有回响</p><h2 id="cta-title" className="section-title text-white">下一次出发，<br />就按你喜欢的方式。</h2><p className="mt-7 text-[10px] tracking-widest text-white/60">此刻的风景 / 神农架 · 大九湖</p></div><div className="invitation-action"><p className="mb-7 text-sm leading-8 text-white/75">把喜欢的风景写进旅程，<br />把时间留给真正想做的事。<br />从一份有吃、有住、有沿途的计划开始。</p><Button variant="white" onClick={onPlan} className="min-h-14 px-7">开始我的湖北旅行<ArrowUpRight size={18} strokeWidth={1.5} /></Button><p className="mt-4 text-[10px] text-white/55">无需注册 · 支持保存与分享</p></div></div>
  </section>;
}
