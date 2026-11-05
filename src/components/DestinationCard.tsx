import { ArrowUpRight, Clock3, Heart, Mountain, Landmark } from 'lucide-react';
import { cityById, type Destination } from '../data';
import { placeContexts } from '../data/editorial';

export function DestinationCard({ place, saved, onSave, onOpen, featured = false, index = 0 }: { place: Destination; saved: boolean; onSave: () => void; onOpen: () => void; featured?: boolean; index?: number }) {
  const saveButton = <button onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'}${place.title}`} aria-pressed={saved} className={`place-save ${saved ? 'text-terracotta' : 'text-ink'}`}><Heart size={17} strokeWidth={1.4} fill={saved ? 'currentColor' : 'none'} /></button>;
  if (featured) return <article className="featured-card group">
    <div className="featured-image">
      <button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="block h-full w-full overflow-hidden text-left"><img src={place.image} alt={place.imageAlt || place.title} loading="lazy" width="800" height="900" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /></button>
      {saveButton}
      <span aria-hidden="true" className="featured-number">0{index + 1}</span>
    </div>
    <div className="featured-copy"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p><button onClick={onOpen} className="featured-title"><h3>{place.title}</h3><ArrowUpRight size={19} strokeWidth={1.3} className="shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button><p className="featured-description">{placeContexts[place.id] || place.description}</p><p className="featured-duration"><Clock3 size={12} strokeWidth={1.5} />建议 {place.duration}</p></div>
  </article>;
  return <article className="catalogue-card group">
    <div className="catalogue-top"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p>{saveButton}</div>
    <div className="catalogue-main"><button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="catalogue-thumb">{place.image ? <img src={place.image} alt={place.imageAlt || place.title} loading="lazy" width="160" height="224" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /> : <span aria-hidden="true">{place.category === 'nature' ? <Mountain size={30} strokeWidth={1} /> : <Landmark size={30} strokeWidth={1} />}{place.category === 'nature' ? '山水自然' : '城市人文'}</span>}</button><div><button onClick={onOpen} className="text-left"><h3>{place.title}</h3></button><p>{place.description}</p><span className="catalogue-duration"><Clock3 size={13} />{place.duration}</span></div></div>
    <div className="catalogue-bottom"><span>{place.highlights[0]}</span><button onClick={onOpen}>攻略与路线<ArrowUpRight size={15} /></button></div>
  </article>;
}
