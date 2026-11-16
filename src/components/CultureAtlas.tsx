import { useId, useState } from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { culturalChapters } from '../data/editorial';
import { destinationById } from '../data';
import { displayPhoto } from '../data/photos';

export function CultureAtlas({ onOpenPlace }: { onOpenPlace: (id: string) => void }) {
  const [active, setActive] = useState(0);
  const prefix = useId();
  const chapter = culturalChapters[active];
  return <section id="culture" aria-labelledby="culture-title" className="culture-section section-space"><div className="page-width">
    <div className="section-heading"><div><h2 id="culture-title" className="section-title">荆楚文化</h2><p className="section-detail">从随州编钟、宜昌峡江和荆州城墙，读懂眼前的风景。</p></div></div>
    <div role="tablist" aria-label="湖北文化线索" className="culture-tabs">{culturalChapters.map((item, index) => <button key={item.id} role="tab" id={prefix + '-tab-' + item.id} aria-controls={prefix + '-panel'} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => { const next = event.key === 'ArrowRight' ? (index + 1) % culturalChapters.length : event.key === 'ArrowLeft' ? (index + culturalChapters.length - 1) % culturalChapters.length : event.key === 'Home' ? 0 : event.key === 'End' ? culturalChapters.length - 1 : -1; if (next >= 0) { event.preventDefault(); setActive(next); document.getElementById(prefix + '-tab-' + culturalChapters[next].id)?.focus(); } }}>{item.label}</button>)}</div>
    <div id={prefix + '-panel'} role="tabpanel" aria-labelledby={prefix + '-tab-' + chapter.id} className="culture-panel">
      <figure className="culture-photo"><img key={chapter.image} src={displayPhoto(chapter.image)} alt={chapter.alt} width="1280" height="854" loading="lazy" decoding="async" /><figcaption>{chapter.caption}</figcaption></figure>
      <div className="culture-reading">
        <h3>{chapter.title}</h3><p className="culture-intro">{chapter.intro}</p>
        <ul>{chapter.points.map(point => <li key={point}>{point}</li>)}</ul>
        <div className="culture-places">{chapter.placeIds.map(id => <button key={id} onClick={() => onOpenPlace(id)}>{destinationById[id].title}<ArrowUpRight size={15} strokeWidth={1.6} /></button>)}</div>
        <p className="culture-reading-note">{chapter.reading}</p>
        <a className="culture-source" href={chapter.source.url} target="_blank" rel="noreferrer">{chapter.source.title}<ExternalLink size={12} /></a>
      </div>
    </div>
  </div></section>;
}
