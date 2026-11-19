import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, MessageCircle, Route, Search, UsersRound } from 'lucide-react';
import { cityById, destinationById } from '../data';
import { editorialPhotos } from '../data/photos';
import { placesByCity } from '../discovery';
import { CityOptions } from './CityPicker';
import { InputField, SelectField } from './ui';
import './home-hero-refresh.css';

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
  { title: '山水自然', detail: '峡谷、森林与湖泊', image: editorialPhotos.enshi.filename, filter: 'nature' },
  { title: '古城文博', detail: '城墙、名楼与博物馆', image: 'jingzhou.jpg', filter: 'city' },
  { title: '亲子研学', detail: '轻松步道与研学去处', image: editorialPhotos.eastLake.filename, filter: 'family' },
  { title: '吃住指南', detail: '地方风味与落脚片区', image: editorialPhotos.noodles.filename, filter: 'food' },
] as const;
const hotSearches = ['wuhan', 'east-lake', 'wudang'].map(id => destinationById[id]);

export function HomeHero({ selection, travelers, onCity, onTravelers, onSearch, onPlan, onAsk, onCoverPlace, onExplore }: HeroProps) {
  const photo = editorialPhotos.xiling;
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

  return <section className="home-cover hero-edition" aria-labelledby="hero-title">
    <div className="journey-cover">
      <figure className="journey-landscape">
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/xiling-river-phone.webp" />
          <img src={`/images/${photo.filename}`} srcSet="/images/xiling-river-1280.webp 1280w, /images/xiling-river-1920.webp 1920w"
            sizes="100vw" alt={photo.alt} fetchPriority="high" width="1920" height="684" />
        </picture>
      </figure>
      <div className="journey-cover-content page-width">
        <div className="journey-intro">
          <p className="journey-kicker">湖北旅行指南</p>
          <h1 id="hero-title">沿江入楚，<br /><span>漫游湖北</span></h1>
          <p className="journey-description">从武昌老城的一碗过早，到西陵峡的江风。按市州找去处，把每天的路线、交通和吃住排在一起。</p>
          <div className="journey-cover-actions">
            <button type="button" className="journey-start" onClick={() => onPlan(dayCount)}>开始规划<ArrowRight size={17} aria-hidden="true" /></button>
            <a href="#routes" className="journey-routes">看经典路线<ArrowUpRight size={16} /></a>
          </div>
        </div>
        <button className="journey-location" type="button" onClick={onCoverPlace} aria-label="查看宜昌西陵峡攻略">
          <MapPin size={18} aria-hidden="true" /><span><strong>宜昌 · {photo.subject}</strong><small>查看实景地攻略</small></span><ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>

    <div className="journey-workbench page-width">
      <div className="journey-workbench-controls">
        <div className="journey-toolbar">
          <div className="journey-modes" role="group" aria-label="首页旅行工具">
            <button type="button" aria-pressed={searchMode} onClick={() => setMode('search')}><Search size={17} aria-hidden="true" />找景点</button>
            <button type="button" aria-pressed={!searchMode} onClick={() => setMode('plan')}><Route size={17} aria-hidden="true" />规划行程</button>
          </div>
        </div>
        <form className={'journey-search-card ' + (searchMode ? 'journey-search-mode' : 'journey-plan-mode')}
          aria-label={searchMode ? '搜索湖北景点' : '快速规划湖北行程'} onSubmit={submit}>
          {searchMode && <label className="journey-field journey-keyword">
            <span><Search size={15} aria-hidden="true" />景点或主题</span>
            <InputField name="place" type="search" aria-label="首页搜索景点或主题" value={keyword} onChange={event => setKeyword(event.target.value)}
              maxLength={100} placeholder="搜省博、古城或湿地" autoComplete="off" />
          </label>}
          <label className="journey-field journey-city">
            <span><MapPin size={15} aria-hidden="true" />目的地</span>
            <SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}>
              <option value="all">{searchMode ? '湖北全境' : '先选一座城'}</option>
              <CityOptions />
            </SelectField>
          </label>
          {!searchMode && <>
            <label className="journey-field">
              <span><CalendarDays size={15} aria-hidden="true" />游玩天数</span>
              <SelectField aria-label="首页游玩天数" value={dayCount} onChange={event => setDays(Number(event.target.value))}>
                {Array.from({ length: capacity }, (_, index) => <option value={index + 1} key={index}>{index + 1} 天</option>)}
              </SelectField>
            </label>
            <label className="journey-field">
              <span><UsersRound size={15} aria-hidden="true" />同行人数</span>
              <SelectField aria-label="首页同行人数" value={travelers} onChange={event => onTravelers(event.target.value)}>
                {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count} 人</option>)}
              </SelectField>
            </label>
          </>}
          <button type="submit" className="journey-search-submit">{searchMode ? '搜索景点' : '安排吃住行'}<ArrowRight size={18} aria-hidden="true" /></button>
        </form>
        {searchMode ? <div className="journey-hot-search" aria-label="快捷搜索">
          <span>{selection === 'all' ? '热门搜索' : '同城推荐'}</span>
          {suggestions.map(place => <button key={place.id} type="button" onClick={() => { setKeyword(place.title); onSearch(place.title); }}>{place.title}</button>)}
        </div> : <p className="journey-plan-note">下一步可以补充旅行偏好和返程时间。</p>}
      </div>
      <button className="journey-ask" type="button" onClick={onAsk}>
        <span className="journey-ask-icon"><MessageCircle size={21} aria-hidden="true" /></span>
        <span className="journey-ask-label"><strong>问小游</strong><small>帮你排路线、找顺路的吃住</small></span>
        <ArrowUpRight className="journey-ask-arrow" size={17} aria-hidden="true" />
      </button>
    </div>

    <nav className="discovery-paths page-width" aria-labelledby="discovery-title">
      <h2 id="discovery-title">按玩法探索</h2>
      <div className="discovery-grid">
        {travelStyles.map(({ image, title, detail, filter }) => <button key={filter} type="button" onClick={() => onExplore(filter)}>
          <img src={'/images/' + image} width="300" height="140" loading="lazy" decoding="async" alt="" />
          <span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={17} aria-hidden="true" />
        </button>)}
      </div>
    </nav>
  </section>;
}
