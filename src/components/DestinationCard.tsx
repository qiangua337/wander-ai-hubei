import { ArrowUpRight, Clock3, Heart } from 'lucide-react';
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
    <div className="mb-4 flex items-center justify-between gap-3"><p className="place-meta">{cityById[place.cityId].shortName}<span />{place.tag}</p>{saveButton}</div>
    <button onClick={onOpen} className="text-left"><h3 className="font-sans text-[23px] font-semibold leading-snug transition group-hover:text-pine">{place.title}</h3></button>
    <p className="mt-3 text-sm leading-7 text-muted">{place.description}</p>
    <ul className="mt-4 space-y-1.5 text-xs leading-6 text-ink/75">{place.highlights.slice(0, 2).map(item => <li key={item} className="flex items-start gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 bg-terracotta/70" />{item}</li>)}</ul>
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-4"><span className="flex items-center gap-1.5 text-xs text-muted"><Clock3 size={13} strokeWidth={1.5} />{place.duration}</span><button onClick={onOpen} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-pine hover:text-terracotta">展开攻略<ArrowUpRight size={15} strokeWidth={1.5} /></button></div>
  </article>;
}
