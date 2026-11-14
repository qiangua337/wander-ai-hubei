import { ArrowUpRight, Clock3, Heart } from 'lucide-react';
import { cityById, type Destination } from '../data';
import { placeContexts } from '../data/editorial';

export function DestinationCard({ place, saved, onSave, onOpen, featured = false }: { place: Destination; saved: boolean; onSave: () => void; onOpen: () => void; featured?: boolean }) {
  const photo = place.id === 'enshi' ? '/images/enshi-card.webp' : place.id === 'xiling-gorge' ? '/images/xiling-cover-768.webp' : place.image;
  const saveButton = <button onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'}${place.title}`} aria-pressed={saved} className={`place-save ${saved ? 'text-terracotta' : 'text-ink'}`}><Heart size={17} strokeWidth={1.4} fill={saved ? 'currentColor' : 'none'} /></button>;
  if (featured) return <article className="featured-card group">
    <div className="featured-image">
      <img src={photo} alt={place.imageAlt || place.title} loading="lazy" decoding="async" width="800" height="540" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} />
      {saveButton}
    </div>
    <div className="featured-copy"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p><h3><button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="featured-title">{place.title}<ArrowUpRight size={19} strokeWidth={1.5} className="shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button></h3><p className="featured-description">{placeContexts[place.id] || place.description}</p><p className="featured-duration"><Clock3 size={13} strokeWidth={1.5} />建议 {place.duration}</p></div>
  </article>;
  return <article className="catalogue-card group">
    <div className="catalogue-top"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p>{saveButton}</div>
    <div className={'catalogue-main' + (photo ? ' has-photo' : '')}>{photo && <div className="catalogue-thumb"><img src={photo} alt={place.imageAlt || place.title} loading="lazy" decoding="async" width="160" height="224" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /></div>}<div><h3><button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="catalogue-title text-left">{place.title}</button></h3><p>{place.description}</p><span className="catalogue-duration"><Clock3 size={13} />{place.duration}</span></div></div>
    <div className="catalogue-bottom"><span>{place.highlights[0]}</span><ArrowUpRight size={16} aria-hidden="true" /></div>
  </article>;
}
