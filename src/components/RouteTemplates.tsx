import { ArrowUpRight } from 'lucide-react';
import { defaultProfile, templates, type Profile } from '../planning';
import { cityById } from '../data';

export function RouteTemplates({ onChoose }: { onChoose: (profile: Profile) => void }) {
  return <section id="routes" aria-labelledby="routes-title" className="route-editorial"><div className="page-width route-layout">
    <div className="route-intro"><p className="eyebrow text-seafoam">02 / THE ART OF A JOURNEY</p><h2 id="routes-title" className="section-title text-white">不止目的地，<br />还有沿途。</h2><p className="mt-6 max-w-xs text-sm leading-8 text-white/60">用两天亲近一座城，或用一周走进山水。<br />把心动连成路线，让每一天都有落点。</p><div className="route-inclusions"><span>每天怎么走</span><span>夜晚住哪里</span><span>沿途吃什么</span></div><button className="text-link mt-9 text-white" onClick={() => onChoose(defaultProfile())}>从一座城市自由规划<ArrowUpRight size={17} strokeWidth={1.3} /></button><p className="mt-4 text-[10px] leading-6 text-white/60">路线与预算为编辑建议，可按你的节奏调整。</p></div>
    <div className="route-list">{templates.map(template => {
      const days = template.segments.reduce((sum, segment) => sum + segment.indices.length, 0);
      return <button key={template.id} onClick={() => onChoose({ ...defaultProfile(template.cityId), template: template.id })} className="route-row group">
        <div className="route-image"><img src={template.image} alt={template.cityId === 'wuhan' ? '武汉黄鹤楼夜景' : template.cityId === 'enshi' ? '恩施大峡谷峰丛' : '宜昌西陵峡风光'} width="400" height="400" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>
        <div className="route-row-copy"><p className="font-display text-[10px] tracking-widest text-seafoam/75">{template.segments.map(segment => cityById[segment.cityId].shortName).join(' — ')}</p><h3 className="mt-3 font-editorial text-[23px] font-normal leading-snug text-white">{template.title}</h3><p className="mt-2 text-[11px] leading-6 text-white/65">{template.subtitle}</p><span className="mt-4 inline-flex items-center gap-2 text-[11px] text-white/80">查看这段旅程<ArrowUpRight size={14} strokeWidth={1.3} /></span></div>
        <div className="route-day"><span>{String(days).padStart(2, '0')}</span><span>天 / DAYS</span></div>
      </button>;
    })}</div>
  </div></section>;
}