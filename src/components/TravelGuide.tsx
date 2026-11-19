import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BedDouble, CalendarClock, ClipboardCheck, Clock3, Copy, Download, Heart, MapPin, Route, Share2, TrainFront, Utensils } from 'lucide-react';
import { cityPhotos, type CityGuide, type Destination } from '../data';
import { availableTripDays } from '../data/attraction-routes';
import { placeContexts } from '../data/editorial';
import { localFoodShops } from '../data/food-shops';
import { displayPhoto } from '../data/photos';
import { placesByCity, routeForPlace, shareGuideUrl } from '../discovery';
import { buildTrip, defaultProfile, formatDetailedPlan, type Profile } from '../planning';
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
const practicalSections = [
  { id: 'transport', label: '到达与接驳', icon: TrainFront },
  { id: 'stay', label: '住宿片区', icon: BedDouble },
  { id: 'food', label: '地方菜', icon: Utensils },
  { id: 'shops', label: '具体门店', icon: MapPin },
] as const;
type PracticalSection = (typeof practicalSections)[number]['id'];

export function TravelGuide({ city, place, date, travelers, onCopy, saved, onSave, onOpenPlace, onPlan, onExplore, initialTab = 'overview', previousPlace, onBackToPreviousPlace }: {
  city: CityGuide; place?: Destination; date: string; travelers: string; saved?: boolean;
  onCopy: (text: string) => void; onSave?: () => void; onOpenPlace: (place: Destination) => void;
  onPlan: (profile: Profile) => void; onExplore: () => void; initialTab?: (typeof tabs)[number]['id'];
  previousPlace?: Destination; onBackToPreviousPlace?: () => void;
}) {
  const id = useId();
  const match = place && routeForPlace(place.id);
  const chapters = availableTripDays(city);
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>(initialTab);
  const [chapter, setChapter] = useState(match?.chapter ?? 0);
  const body = useRef<HTMLDivElement>(null);
  const photo = cityPhotos[city.id];
  const image = displayPhoto(place ? place.image : photo?.filename && `/images/${photo.filename}`, true);
  const otherPlaces = placesByCity[city.id].filter(other => other.id !== place?.id);
  const related = match ? otherPlaces.filter(other => routeForPlace(other.id)?.chapter === match.chapter) : [];
  const alternatives = otherPlaces.filter(other => !related.includes(other));
  const sameTheme = place ? alternatives.filter(other => other.category === place.category) : [];
  const morePlaces = [...related, ...sameTheme, ...alternatives.filter(other => !sameTheme.includes(other))].slice(0, 3);
  const chapterProfile = (index: number) => ({ ...defaultProfile(city.id, date, Number(travelers)), indices: [index] });
  const oneDay = chapterProfile(chapter);
  const day = buildTrip(oneDay)[0];
  const schedule = buildDaySchedule(day, oneDay, undefined, true);
  const overviewChapter = match?.chapter ?? chapter;
  const overviewProfile = overviewChapter === chapter ? oneDay : chapterProfile(overviewChapter);
  const overviewSchedule = overviewChapter === chapter ? schedule : buildDaySchedule(buildTrip(overviewProfile)[0], overviewProfile, undefined, true);
  const overviewVisits = overviewSchedule.rows.filter(row => row.kind === 'visit');
  const meals = schedule.rows.filter(row => row.kind === 'meal');
  const stay = schedule.rows.find(row => row.kind === 'stay');
  const routeSources = [...new Map([...schedule.sources, ...city.sources].map(source => [source.url, source])).values()];
  const generalPlan = () => onPlan(defaultProfile(city.id, date, Number(travelers)));
  const useSelectedRoute = tab === 'route' || (match && tab !== 'overview' && chapter !== match.chapter);
  const openPlan = () => onPlan(useSelectedRoute ? oneDay : chapterProfile(match?.chapter ?? chapter));
  const text = () => formatPlan(city, city.days, date, travelers);
  const showTab = (next: typeof tab, focus = false) => {
    setTab(next);
    window.requestAnimationFrame(() => {
      body.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (focus) document.getElementById(`${id}-${next}`)?.focus({ preventScroll: true });
    });
  };
  const showPlaceRoute = () => {
    setChapter(overviewChapter);
    showTab('route', true);
  };
  const goToPractical = (section: PracticalSection) => {
    const target = section === 'shops' ? body.current?.querySelector<HTMLElement>('.local-food-shops')
      : document.getElementById(`${id}-practical-${section}`);
    if (!target) return;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  return <div className="guide-content">
    {previousPlace && onBackToPreviousPlace && <div className="guide-history">
      <button type="button" onClick={onBackToPreviousPlace}><ArrowLeft size={16} aria-hidden="true" />返回{previousPlace.title}</button>
    </div>}
    <div className={'guide-cover' + (image ? ' has-photo' : '')}>
      {image && <figure className="guide-photo">
        <img src={image} alt={place?.imageAlt || photo?.alt || place?.title || city.shortName} width="1040" height="520"
          style={place?.imagePosition ? { objectPosition: place.imagePosition } : undefined} decoding="async" />
        <figcaption><MapPin size={14} />{place?.title || photo?.subject}</figcaption>
      </figure>}
      <div className="guide-overview-card">
        <p className="guide-location"><MapPin size={15} />{city.shortName}<span>{place?.tag || city.area}</span></p>
        <h3>{place ? (placeContexts[place.id] || place.description).replace(/。$/, '') : city.tagline.replace(/。$/, '')}</h3>
        <p className="guide-duration"><Clock3 size={16} aria-hidden="true" />{place ? `建议游玩 ${place.duration}` : `${chapters.length} 条一日路线可选`}</p>
        <div className="guide-cover-tools">
          <button type="button" onClick={showPlaceRoute}><CalendarClock size={16} aria-hidden="true" />看时间表</button>
          <button type="button" onClick={() => showTab('practical', true)}><TrainFront size={16} aria-hidden="true" />交通吃住</button>
          <button type="button" className="guide-share" onClick={() => onCopy(shareGuideUrl(city.id, place?.id))}><Share2 size={16} aria-hidden="true" />分享攻略</button>
        </div>
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
          <section className="guide-read-story">
            <h3>{place ? '这里看什么' : `认识${city.shortName}`}</h3>
            <p>{place?.overview || city.intro}</p>
            {place && <ul className="guide-text-list">{place.highlights.map(item => <li key={item}>{item}</li>)}</ul>}
          </section>
          <aside>
            <h3><ClipboardCheck size={19} aria-hidden="true" />出发前核对</h3>
            <ul className="guide-text-list">{(place?.tips || city.tips).map(item => <li key={item}>{item}</li>)}</ul>
            <button className="text-link" type="button" onClick={() => showTab('sources', true)}>查看官方资料<ArrowUpRight size={15} /></button>
          </aside>
        </div>
        <section className="guide-route-banner">
          <span className="guide-route-icon"><Route size={22} strokeWidth={1.7} /></span>
          <div><h3>{match ? chapters[match.chapter].title : `${city.shortName}逐日路线`}</h3>
            <p>{match ? `这一日安排了「${match.visit}」。` : '按日查景点先后、接驳、餐食和住宿片区。'}</p>
            <p className="guide-route-start"><Clock3 size={14} aria-hidden="true" />{overviewSchedule.start} · {overviewSchedule.from}</p>
            {overviewVisits.length > 0 && <p className="guide-route-visits">{overviewVisits.map(row => row.title).join(' → ')}</p>}
          </div>
          <button type="button" onClick={showPlaceRoute}>看时间表<ArrowRight size={16} aria-hidden="true" /></button>
        </section>
        {morePlaces.length > 0 && <section className="guide-related">
          <div className="guide-related-heading">
            <h3>{related.length > 0 ? '同日路线与其他去处' : `继续逛${city.shortName}`}</h3>
            <button type="button" className="text-link" onClick={onExplore}>看全部景点<ArrowRight size={16} aria-hidden="true" /></button>
          </div>
          <ul>{morePlaces.map(other => {
            const thumbnail = displayPhoto(other.image);
            return <li key={other.id}><button type="button" className={thumbnail ? 'has-thumbnail' : ''} onClick={() => onOpenPlace(other)}>
              {thumbnail && <img src={thumbnail} alt="" width="140" height="140" loading="lazy" decoding="async" style={other.imagePosition ? { objectPosition: other.imagePosition } : undefined} />}
              <span className="guide-related-copy">
                <span className="guide-related-fit">{related.includes(other) ? '已在同日路线' : place ? '同城另选' : other.tag}</span>
                <strong>{other.title}</strong>
                <small>{place && `${other.tag} · `}{other.duration}</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button></li>;
          })}</ul>
        </section>}
      </>}
      {tab === 'route' && <section aria-label="按日浏览参考路线" className={'guide-route' + (chapters.length > 4 ? ' has-many-chapters' : '')}>
        <h3>{match && chapter === match.chapter ? place?.title : city.shortName}的一日路线</h3>
        <div className="guide-chapter-select"><SelectField aria-label="选择一日路线" value={chapter} onChange={event => setChapter(Number(event.target.value))}>
          {chapters.map((item, index) => <option key={item.title} value={index}>{item.title}</option>)}
        </SelectField></div>
        <div className="guide-chapters" role="group" aria-label="选择一日路线">
          {chapters.map((item, index) => <button type="button" key={item.title} aria-pressed={chapter === index} onClick={() => setChapter(index)}>{item.title}</button>)}
        </div>
        <TripSchedule days={[day]} profile={oneDay} />
      </section>}
      {tab === 'practical' && <section className="guide-practical" aria-label="交通吃住">
        <nav className="guide-practical-links" aria-label="快速查看吃住交通">
          {practicalSections.filter(item => item.id !== 'shops' || localFoodShops[city.id]?.length).map(({ id, label, icon: Icon }) =>
            <button key={id} type="button" onClick={() => goToPractical(id)}><Icon size={17} aria-hidden="true" />{label}</button>)}
        </nav>
        <section className="guide-practical-intro guide-route-practical">
          <div className="guide-practical-heading"><div><h3><Route size={18} aria-hidden="true" />按当前一日路线安排</h3><p>{chapters[chapter].title}</p></div>
            <button type="button" className="text-link" onClick={() => showTab('route', true)}>看时间表<ArrowRight size={15} aria-hidden="true" /></button>
          </div>
          <dl>
            <div><dt>出发</dt><dd><strong>{schedule.start} · {schedule.from}</strong><p>{day.transport}</p></dd></div>
            {meals.map((row, index) => <div key={`${row.meal}-${index}`}><dt>{row.meal}{row.time && <time dateTime={row.time}>{row.time}</time>}</dt><dd><strong>{row.title}</strong>{row.detail && <p>{row.detail}</p>}</dd></div>)}
            {stay && <div><dt>延住</dt><dd><strong>{stay.title}</strong>{stay.detail && <p>{stay.detail}</p>}</dd></div>}
          </dl>
        </section>
        <section id={`${id}-practical-transport`} className="guide-practical-intro guide-practical-target"><h3><TrainFront size={18} aria-hidden="true" />怎么到{city.shortName}</h3><p>{city.arrival}</p><p>{city.season}</p></section>
        <div id={`${id}-practical-stay`} className="guide-practical-target"><StaySuggestions city={city} /></div>
        <div id={`${id}-practical-food`} className="guide-practical-target guide-practical-food"><FoodSuggestions city={city} /></div>
        <p className="guide-note"><Utensils size={15} />地方风味与住宿片区按实际行程选择。可到规划里查看顺路餐食。</p>
      </section>}
      {tab === 'sources' && <section className="guide-sources" aria-label="出行资料">
        <h3>官方出行资料</h3>
        <ul>{routeSources.map(source =>
          <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={16} /></a></li>)}</ul>
        <p className="guide-note">预约、票种、开放和车船班次以当期官方公告为准。</p>
        <div className="guide-export">
          <Button variant="neutral" onClick={() => onCopy(place ? formatDetailedPlan(oneDay) : text())}><Copy size={16} />{place ? '复制所选一日路线' : '复制城市攻略'}</Button>
          <Button variant="neutral" onClick={() => downloadPlan(place ? formatDetailedPlan(oneDay) : text(), place?.title || city.shortName)}><Download size={16} />{place ? '下载所选一日路线' : '下载城市攻略'}</Button>
        </div>
      </section>}
    </div>
    <footer className="guide-actions">
      {onSave ? <Button variant="neutral" aria-pressed={saved} onClick={onSave}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? '已收藏' : '收藏'}</Button>
        : <Button variant="neutral" onClick={onExplore}><MapPin size={17} />看同城景点</Button>}
      <Button className="guide-plan-action" onClick={useSelectedRoute || match ? openPlan : generalPlan}>
        {useSelectedRoute ? '用这条一日路线' : match ? '打开含此景点的行程' : `打开${city.shortName}行程`}<ArrowRight size={17} />
      </Button>
    </footer>
  </div>;
}
