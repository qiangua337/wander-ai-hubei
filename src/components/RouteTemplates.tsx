import { ArrowUpRight } from 'lucide-react';
import { defaultProfile, templates, type Profile } from '../planning';
import { cityById } from '../data';
export function RouteTemplates({ onChoose }: { onChoose: (profile: Profile) => void }) {
  return <section id="routes" aria-labelledby="routes-title" className="route-editorial"><div className="page-width"><div className="section-heading"><div><h2 id="routes-title" className="section-title">湖北经典路线</h2><p className="section-detail">从武汉周末两日到鄂西一周。点开查看逐日时间和沿途住宿。</p></div></div><div className="route-list">{templates.map(template => {
    const days = template.segments.reduce((sum, segment) => sum + segment.indices.length, 0);
    const image = template.cityId === 'enshi' ? '/images/enshi-card.webp' : template.cityId === 'yichang' ? '/images/xiling-cover-768.webp' : template.image;
    return <button key={template.id} onClick={() => onChoose({ ...defaultProfile(template.cityId), template: template.id })} className="route-row group"><div className="route-image"><img src={image} alt={template.cityId === 'wuhan' ? '武汉黄鹤楼夜景' : template.cityId === 'enshi' ? '恩施大峡谷峰丛' : '宜昌西陵峡风光'} width="600" height="400" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="route-day"><strong>{days}</strong> 天</div><div className="route-row-copy"><h3>{template.title}</h3><p>{template.subtitle}</p><div className="route-stops">{template.segments.map(segment => <span key={segment.cityId}>{cityById[segment.cityId].shortName} · {segment.indices.length} 天</span>)}</div><span>查看时间表<ArrowUpRight size={17} /></span></div></button>;
  })}</div></div></section>;
}
