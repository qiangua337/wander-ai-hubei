import { useId, useState } from 'react';
import { ArrowUpRight, Check, ExternalLink } from 'lucide-react';
import { culturalChapters } from '../data/editorial';
import { destinationById } from '../data';

export function CultureAtlas({ onOpenPlace }: { onOpenPlace: (id: string) => void }) {
  const [active, setActive] = useState(0);
  const prefix = useId();
  const chapter = culturalChapters[active];
  return <section id="culture" aria-labelledby="culture-title" className="culture-section section-space"><div className="page-width">
    <div className="section-heading"><div><p className="eyebrow">贰 / 荆楚有来处</p><h2 id="culture-title" className="section-title">把风景，放回它的故事里。</h2></div><p className="section-aside">从一件器物、一段江流、一座古城，<br />读出湖北的不同层次。</p></div>
    <div role="tablist" aria-label="湖北文化线索" className="culture-tabs">{culturalChapters.map((item, index) => <button key={item.id} role="tab" id={prefix + '-tab-' + item.id} aria-controls={prefix + '-panel'} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => { const next = event.key === 'ArrowRight' ? (index + 1) % culturalChapters.length : event.key === 'ArrowLeft' ? (index + culturalChapters.length - 1) % culturalChapters.length : event.key === 'Home' ? 0 : event.key === 'End' ? culturalChapters.length - 1 : -1; if (next >= 0) { event.preventDefault(); setActive(next); document.getElementById(prefix + '-tab-' + culturalChapters[next].id)?.focus(); } }}>{item.label}</button>)}</div>
    <div id={prefix + '-panel'} role="tabpanel" aria-labelledby={prefix + '-tab-' + chapter.id} className="culture-panel">
      <figure className="culture-photo"><img key={chapter.image} src={chapter.image} alt={chapter.alt} width="1280" height="854" loading="lazy" /><figcaption>{chapter.caption}</figcaption></figure>
      <div className="culture-reading"><p className="culture-mark">{chapter.mark}</p><h3>{chapter.title}</h3><p className="culture-intro">{chapter.intro}</p><ul>{chapter.points.map(point => <li key={point}><Check size={14} strokeWidth={1.4} />{point}</li>)}</ul><div className="culture-places">{chapter.placeIds.map(id => <button key={id} onClick={() => onOpenPlace(id)}>{destinationById[id].title}<ArrowUpRight size={15} strokeWidth={1.4} /></button>)}</div><p className="culture-reading-note">{chapter.reading}</p><a className="culture-source" href={chapter.source.url} target="_blank" rel="noreferrer">资料来源：{chapter.source.title}<ExternalLink size={11} /></a></div>
    </div>
  </div></section>;
}