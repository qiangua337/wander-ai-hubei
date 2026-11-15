import { useId, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Clock3, Copy, Download, Heart, MapPin, Route, Share2, TrainFront, Utensils } from 'lucide-react';
import { cityPhotos, type CityGuide, type Destination } from '../data';
import { displayPhoto } from '../data/photos';
import { placesByCity, routeForPlace, shareGuideUrl } from '../discovery';
import { buildTrip, defaultProfile, type Profile } from '../planning';
import { buildDaySchedule } from '../day-schedule';
import { downloadPlan, formatPlan } from '../travel';
import { FoodSuggestions, StaySuggestions } from './PracticalDetails';
import { TripSchedule } from './TripSchedule';
import { Button, SelectField } from './ui';
import './travel-guide.css';

const tabs = [
  { id: 'overview', label: '攻略' },
  { id: 'route', label: '参考行程' },
  { id: 'practical', label: '交通吃住' },
  { id: 'sources', label: '出行资料' },
] as const;

export function TravelGuide({ city, place, date, travelers, onCopy, saved, onSave, onOpenPlace, onPlan, onExplore }: {
  city: CityGuide; place?: Destination; date: string; travelers: string; saved?: boolean;
  onCopy: (text: string) => void; onSave?: () => void; onOpenPlace: (place: Destination) => void;
  onPlan: (profile: Profile) => void; onExplore: () => void;
}) {
  const id = useId();
  const match = place && routeForPlace(place.id);
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('overview');
  const [chapter, setChapter] = useState(match?.chapter ?? 0);
  const body = useRef<HTMLDivElement>(null);
  const photo = cityPhotos[city.id];
  const image = displayPhoto(place ? place.image : photo?.filename && `/images/${photo.filename}`, true);
  const otherPlaces = placesByCity[city.id].filter(other => other.id !== place?.id);
  const related = match ? otherPlaces.filter(other => routeForPlace(other.id)?.chapter === match.chapter) : [];
  const morePlaces = [...related, ...otherPlaces.filter(other => !related.includes(other))].slice(0, 3);
  const chapterProfile = (index: number) => ({ ...defaultProfile(city.id, date, Number(travelers)), indices: [index] });
  const oneDay = chapterProfile(chapter);
  const day = buildTrip(oneDay)[0];
  const schedule = buildDaySchedule(day, oneDay, undefined, true);
  const generalPlan = () => onPlan(defaultProfile(city.id, date, Number(travelers)));
  const openPlan = () => onPlan(chapterProfile(match && tab !== 'route' ? match.chapter : chapter));
  const text = () => formatPlan(city, city.days, date, travelers);
  const showTab = (next: typeof tab, focus = false) => {
    setTab(next);
    window.requestAnimationFrame(() => {
      body.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (focus) document.getElementById(`${id}-${next}`)?.focus({ preventScroll: true });
    });
  };

  return <div className="guide-content">
    <div className={'guide-cover' + (image ? ' has-photo' : '')}>
      {image && <figure className="guide-photo">
        <img src={image} alt={place?.imageAlt || photo?.alt || place?.title || city.shortName} width="1040" height="520"
          style={place?.imagePosition ? { objectPosition: place.imagePosition } : undefined} decoding="async" />
        <figcaption><MapPin size={14} />{place?.title || photo?.subject}</figcaption>
      </figure>}
      <div className="guide-overview-card">
        <p className="guide-location"><MapPin size={15} />{city.shortName}<span>{place?.tag || city.area}</span></p>
        <h3>{place ? place.description.replace(/。$/, '') : city.tagline.replace(/。$/, '')}</h3>
        <p className="guide-duration"><Clock3 size={16} />{place ? `建议游玩 ${place.duration}` : `${city.days.length} 天路线可选`}</p>
        <button type="button" className="guide-share" onClick={() => onCopy(shareGuideUrl(city.id, place?.id))}><Share2 size={16} />分享攻略</button>
      </div>
    </div>
    <div className="guide-tabs" role="tablist" aria-label="攻略内容">
      {tabs.map((item, index) => <button key={item.id} type="button" id={`${id}-${item.id}`} role="tab" tabIndex={tab === item.id ? 0 : -1}
        aria-controls={`${id}-panel`} aria-selected={tab === item.id} onClick={() => showTab(item.id)} onKeyDown={event => {
          const target = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length] : event.key === 'ArrowLeft'
            ? tabs[(index + tabs.length - 1) % tabs.length] : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : undefined;
          if (target) { event.preventDefault(); showTab(target.id, true); }
        }}>{item.label}</button>)}
    </div>
    <div ref={body} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`} className="guide-body">
      {tab === 'overview' && <>
        <div className="guide-read">
          <section>
            <h3>{place ? '这里看什么' : `认识${city.shortName}`}</h3>
            <p>{place?.overview || city.intro}</p>
            {place && <ul className="guide-text-list">{place.highlights.map(item => <li key={item}>{item}</li>)}</ul>}
          </section>
          <aside>
            <h3>出发前核对</h3>
            <ul className="guide-text-list">{(place?.tips || city.tips).map(item => <li key={item}>{item}</li>)}</ul>
            <button className="text-link" type="button" onClick={() => showTab('sources', true)}>查看官方资料<ArrowUpRight size={15} /></button>
          </aside>
        </div>
        <section className="guide-route-banner">
          <span className="guide-route-icon"><Route size={22} strokeWidth={1.7} /></span>
          <div><h3>{match ? city.days[match.chapter].title : place ? '同城路线参考' : `${city.shortName}逐日路线`}</h3>
            <p>{match ? `这一日安排了「${match.visit}」。` : place ? '这处景点适合单独预留时间。可先看本站的同城行程。' : '按日查景点先后、接驳、餐食和住宿片区。'}</p></div>
          <button type="button" onClick={() => { if (match) setChapter(match.chapter); showTab('route', true); }}>看时间表<ArrowRight size={16} /></button>
        </section>
        {morePlaces.length > 0 && <section className="guide-related">
          <h3>同城去处</h3>
          <ul>{morePlaces.map(other => <li key={other.id}><button type="button" onClick={() => onOpenPlace(other)}>
            <strong>{other.title}</strong><span>{other.tag} · {other.duration}</span><ArrowUpRight size={16} />
          </button></li>)}</ul>
          <button type="button" className="text-link" onClick={onExplore}>浏览{city.shortName}全部景点<ArrowRight size={16} /></button>
        </section>}
      </>}
      {tab === 'route' && <section aria-label="按日浏览参考路线" className="guide-route">
        <h3>{city.shortName}的一日路线</h3>
        <div className="guide-chapter-select"><SelectField aria-label="选择一日路线" value={chapter} onChange={event => setChapter(Number(event.target.value))}>
          {city.days.map((item, index) => <option key={item.title} value={index}>{item.title}</option>)}
        </SelectField></div>
        <div className="guide-chapters" role="group" aria-label="选择一日路线">
          {city.days.map((item, index) => <button type="button" key={item.title} aria-pressed={chapter === index} onClick={() => setChapter(index)}>{item.title}</button>)}
        </div>
        <TripSchedule days={[day]} profile={oneDay} />
      </section>}
      {tab === 'practical' && <section className="guide-practical" aria-label="交通吃住">
        <div className="guide-practical-intro"><h3><TrainFront size={18} />怎么到{city.shortName}</h3><p>{city.arrival}</p><p>{city.season}</p></div>
        <StaySuggestions city={city} />
        <FoodSuggestions city={city} />
        <p className="guide-note"><Utensils size={15} />地方风味与住宿片区按实际行程选择。可到规划里查看顺路餐食。</p>
      </section>}
      {tab === 'sources' && <section className="guide-sources" aria-label="出行资料">
        <h3>官方出行资料</h3>
        <ul>{[...new Map([...city.sources, ...(match && chapter === match.chapter ? schedule.sources : [])].map(source => [source.url, source])).values()].map(source =>
          <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={16} /></a></li>)}</ul>
        <p className="guide-note">预约、票种、开放和车船班次以当期官方公告为准。</p>
        <div className="guide-export">
          <Button variant="neutral" onClick={() => onCopy(text())}><Copy size={16} />复制城市攻略</Button>
          <Button variant="neutral" onClick={() => downloadPlan(text(), city.shortName)}><Download size={16} />下载城市攻略</Button>
        </div>
      </section>}
    </div>
    <footer className="guide-actions">
      {onSave ? <Button variant="neutral" aria-pressed={saved} onClick={onSave}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? '已收藏' : '收藏'}</Button>
        : <Button variant="neutral" onClick={onExplore}><MapPin size={17} />看同城景点</Button>}
      <Button className="guide-plan-action" onClick={tab === 'route' || match ? openPlan : generalPlan}>
        {tab === 'route' ? '用这条一日路线' : match ? '打开含此景点的行程' : `打开${city.shortName}行程`}<ArrowRight size={17} />
      </Button>
    </footer>
  </div>;
}
