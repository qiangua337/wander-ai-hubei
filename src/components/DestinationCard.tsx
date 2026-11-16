import { ArrowUpRight, Clock3, Heart } from 'lucide-react';
import { cityById, type Destination } from '../data';
import { placeContexts } from '../data/editorial';
import { displayPhoto } from '../data/photos';

export function DestinationCard({ place, saved, onSave, onOpen, featured }: { place: Destination; saved: boolean; onSave: () => void; onOpen: () => void; featured?: 'portrait' | 'compact' }) {
  const photo = displayPhoto(place.image);
  const saveButton = <button onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'}${place.title}`} aria-pressed={saved} className={`place-save ${saved ? 'text-terracotta' : 'text-ink'}`}><Heart size={17} strokeWidth={1.4} fill={saved ? 'currentColor' : 'none'} /></button>;
  if (featured) return <article className={`featured-card featured-${featured} group`} data-place={place.id}>
    <div className="featured-image">
      <img src={photo} alt={place.imageAlt || place.title} loading="lazy" decoding="async" width="800" height="540" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} />
    </div>
    {saveButton}
    <div className="featured-copy"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p><h3><button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="featured-title">{place.id === 'xiling-gorge' ? '西陵峡' : place.title}<ArrowUpRight size={19} strokeWidth={1.5} className="shrink-0" /></button></h3><p className="featured-description">{placeContexts[place.id] || place.description}</p><p className="featured-duration"><Clock3 size={13} strokeWidth={1.5} />{place.duration}</p></div>
  </article>;
  return <article className="catalogue-card group">
    <div className="catalogue-top"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p>{saveButton}</div>
    <div className={'catalogue-main' + (photo ? ' has-photo' : '')}>{photo && <div className="catalogue-thumb"><img src={photo} alt={place.imageAlt || place.title} loading="lazy" decoding="async" width="160" height="224" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /></div>}<div><h3><button onClick={onOpen} aria-label={`查看${place.title}攻略`} className="catalogue-title text-left">{place.title}</button></h3><p>{place.description}</p><span className="catalogue-duration"><Clock3 size={13} />{place.duration}</span></div></div>
    <div className="catalogue-bottom"><span>{place.highlights[0]}</span><ArrowUpRight size={16} aria-hidden="true" /></div>
  </article>;
}
