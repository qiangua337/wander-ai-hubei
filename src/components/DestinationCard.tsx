import { ArrowRight, Clock3, Heart, Landmark, MapPin, Mountain } from 'lucide-react';
import { cityById, type Destination } from '../data';
import { Card } from './ui';

export function DestinationCard({ place, saved, onSave, onOpen, featured = false }: { place: Destination; saved: boolean; onSave: () => void; onOpen: () => void; featured?: boolean }) {
  const Icon = place.category === 'nature' ? Mountain : Landmark;
  return <Card className={`group flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-15px_rgba(28,70,56,.2)] ${featured ? '' : 'p-5 sm:p-6'}`}>
    {featured && <div className="relative h-52 overflow-hidden bg-sage sm:h-56">
      <button onClick={onOpen} className="h-full w-full" aria-label={`查看${place.title}攻略`}>{place.image ? <img src={place.image} alt={place.imageAlt || place.title} loading="lazy" width="800" height="500" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /> : <span className="flex h-full items-center justify-center text-pine"><Icon size={52} strokeWidth={1} /></span>}</button>
      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-pine">{place.tag}</span>
      <button onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'}${place.title}`} aria-pressed={saved} className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ${saved ? 'text-terracotta' : 'text-ink/70'}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>}
    <div className={`flex flex-1 flex-col ${featured ? 'p-5 sm:p-6' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-2"><p className="flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={12} />{cityById[place.cityId].shortName} {!featured && <span className="ml-1 text-terracotta">/ {place.tag}</span>}</p>{!featured && <button onClick={onSave} aria-label={`${saved ? '取消收藏' : '收藏'}${place.title}`} aria-pressed={saved} className={`rounded-full p-2 transition hover:bg-sage ${saved ? 'text-terracotta' : 'text-muted'}`}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>}</div>
      <button onClick={onOpen} className="text-left"><h3 className={`${featured ? 'text-[23px]' : 'text-xl'} font-semibold leading-snug tracking-tight transition group-hover:text-pine`}>{place.title}</h3></button>
      <p className="mt-3 text-[13px] leading-6 text-muted">{place.description}</p>
      {!featured && <ul className="mt-4 space-y-2 text-xs leading-6 text-ink/75">{place.highlights.slice(0, 2).map(item => <li key={item} className="flex items-start gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-terracotta/70" />{item}</li>)}</ul>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-5"><span className="flex items-center gap-1 text-[11px] text-muted"><Clock3 size={13} />建议 {place.duration}</span><button onClick={onOpen} className="flex items-center gap-1 text-xs font-semibold text-pine hover:text-terracotta">{featured ? '看攻略与路线' : '展开攻略'}<ArrowRight size={15} /></button></div>
    </div>
  </Card>;
}
