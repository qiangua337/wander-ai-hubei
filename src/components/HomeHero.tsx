import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Landmark, MapPin, MessageCircle, Mountain, Route, Search, UsersRound, Utensils } from 'lucide-react';
import { cityById, cityPhotos, destinationById } from '../data';
import { placesByCity } from '../discovery';
import { CityOptions } from './CityPicker';
import { InputField, SelectField } from './ui';

type HeroProps = {
  selection: string;
  travelers: string;
  onCity: (id: string) => void;
  onTravelers: (count: string) => void;
  onSearch: (keyword: string) => void;
  onPlan: (days: number) => void;
  onAsk: () => void;
  onCoverPlace: () => void;
  onExplore: (filter: 'nature' | 'city' | 'family' | 'food') => void;
};

const travelStyles = [
  { icon: Mountain, title: '山水自然', detail: '峡谷、森林与湖泊', filter: 'nature' },
  { icon: Landmark, title: '古城文博', detail: '城墙、名楼与博物馆', filter: 'city' },
  { icon: UsersRound, title: '亲子研学', detail: '轻松步道与研学去处', filter: 'family' },
  { icon: Utensils, title: '吃住指南', detail: '地方风味与落脚片区', filter: 'food' },
] as const;
const hotSearches = ['wuhan', 'east-lake', 'wudang'].map(id => destinationById[id]);

export function HomeHero({ selection, travelers, onCity, onTravelers, onSearch, onPlan, onAsk, onCoverPlace, onExplore }: HeroProps) {
  const photo = cityPhotos.yichang;
  const [mode, setMode] = useState<'plan' | 'search'>('search');
  const [days, setDays] = useState(2);
  const [keyword, setKeyword] = useState('');
  const capacity = cityById[selection]?.days.length || 4;
  const dayCount = Math.min(days, capacity);
  const suggestions = selection === 'all' ? hotSearches : placesByCity[selection].slice(0, 3);
  const searchMode = mode === 'search';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchMode) onSearch(keyword.trim());
    else onPlan(dayCount);
  };

  return <section className="home-cover" aria-labelledby="hero-title">
    <div className="journey-cover">
      <figure className="journey-landscape">
        <img src="/images/xiling-cover-1600.webp" srcSet="/images/xiling-cover-768.webp 768w, /images/xiling-cover-1600.webp 1600w"
          sizes="100vw" alt={photo.alt || photo.subject} fetchPriority="high" width="1600" height="1060" />
      </figure>
      <div className="journey-cover-content page-width">
        <div className="journey-intro">
          <p className="journey-kicker">寻游湖北</p>
          <h1 id="hero-title">沿着长江，<br />走进湖北</h1>
          <p className="journey-description">从江城过早，到峡江行舟。<br className="hero-mobile-break" /> 找景点、看攻略、排好每天的吃住行。</p>
          <a href="#routes" className="journey-routes">看经典路线<ArrowUpRight size={16} /></a>
        </div>
        <button className="journey-location" type="button" onClick={onCoverPlace} aria-label="查看宜昌西陵峡攻略">
          <MapPin size={16} />宜昌 · {photo.subject}<ArrowUpRight size={14} />
        </button>
      </div>
    </div>

    <div className="journey-workbench page-width">
      <div className="journey-toolbar">
        <div className="journey-modes" role="group" aria-label="首页旅行工具">
          <button type="button" aria-pressed={searchMode} onClick={() => setMode('search')}><Search size={17} />找景点</button>
          <button type="button" aria-pressed={!searchMode} onClick={() => setMode('plan')}><Route size={17} />规划行程</button>
        </div>
        <button className="journey-ask" type="button" onClick={onAsk}><MessageCircle size={17} />问小游<ArrowUpRight size={15} /></button>
      </div>
      <form className={'journey-search-card ' + (searchMode ? 'journey-search-mode' : 'journey-plan-mode')}
        aria-label={searchMode ? '搜索湖北景点' : '快速规划湖北行程'} onSubmit={submit}>
        {searchMode && <label className="journey-field journey-keyword">
          <span><Search size={15} />景点或主题</span>
          <InputField name="place" type="search" aria-label="首页搜索景点或主题" value={keyword} onChange={event => setKeyword(event.target.value)}
            maxLength={100} placeholder="试试搜索省博、古城或湿地" autoComplete="off" />
        </label>}
        <label className="journey-field journey-city">
          <span><MapPin size={15} />目的地</span>
          <SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}>
            <option value="all">{searchMode ? '湖北全境' : '还没选城市'}</option>
            <CityOptions />
          </SelectField>
        </label>
        {!searchMode && <>
          <label className="journey-field">
            <span><CalendarDays size={15} />游玩天数</span>
            <SelectField aria-label="首页游玩天数" value={dayCount} onChange={event => setDays(Number(event.target.value))}>
              {Array.from({ length: capacity }, (_, index) => <option value={index + 1} key={index}>{index + 1} 天</option>)}
            </SelectField>
          </label>
          <label className="journey-field">
            <span><UsersRound size={15} />同行人数</span>
            <SelectField aria-label="首页同行人数" value={travelers} onChange={event => onTravelers(event.target.value)}>
              {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count} 人</option>)}
            </SelectField>
          </label>
        </>}
        <button type="submit" className="journey-search-submit">{searchMode ? '搜索景点' : '安排吃住行'}<ArrowRight size={18} /></button>
      </form>
      {searchMode && <div className="journey-hot-search" aria-label="快捷搜索">
        <span>{selection === 'all' ? '热门搜索' : '同城推荐'}</span>
        {suggestions.map(place => <button key={place.id} type="button" onClick={() => { setKeyword(place.title); onSearch(place.title); }}>{place.title}</button>)}
      </div>}
    </div>

    <nav className="discovery-paths page-width" aria-label="按旅行方式探索">
      {travelStyles.map(({ icon: Icon, title, detail, filter }) => <button key={filter} type="button" onClick={() => onExplore(filter)}>
        <span className="path-mark"><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span>
        <span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true" />
      </button>)}
    </nav>
  </section>;
}
