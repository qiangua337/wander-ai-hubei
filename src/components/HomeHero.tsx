import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Landmark, MapPin, MessageCircle, Mountain, Route, Search, UsersRound, Utensils } from 'lucide-react';
import { cities, cityById, cityPhotos } from '../data';
import { InputField, SelectField } from './ui';

type HeroProps = {
  selection: string;
  onCity: (id: string) => void;
  onSearch: (keyword: string) => void;
  onPlan: (days: number) => void;
  onAsk: () => void;
  onExplore: (filter: 'nature' | 'city' | 'family' | 'food') => void;
};

const travelStyles = [
  { icon: Mountain, title: '山水自然', detail: '峡谷、森林与湖泊', filter: 'nature' },
  { icon: Landmark, title: '古城文博', detail: '城墙、名楼与博物馆', filter: 'city' },
  { icon: UsersRound, title: '亲子出游', detail: '轻松步道与研学去处', filter: 'family' },
  { icon: Utensils, title: '吃住指南', detail: '地方风味与住宿片区', filter: 'food' },
] as const;

export function HomeHero({ selection, onCity, onSearch, onPlan, onAsk, onExplore }: HeroProps) {
  const photo = cityPhotos.yichang;
  const [mode, setMode] = useState<'plan' | 'search'>('plan');
  const [days, setDays] = useState(2);
  const [keyword, setKeyword] = useState('');
  const city = cityById[selection];
  const capacity = city?.days.length || 4;
  const dayCount = Math.min(days, capacity);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'plan') onPlan(dayCount);
    else onSearch(keyword.trim());
  };

  return <section aria-labelledby="hero-title" className="home-cover">
    <div className="journey-frame page-width">
      <div className="journey-cover">
        <figure className="journey-landscape">
          <img
            src="/images/xiling-cover-1600.webp"
            srcSet="/images/xiling-cover-768.webp 768w, /images/xiling-cover-1600.webp 1600w"
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 64vw, 840px"
            alt={photo.alt || photo.subject}
            fetchPriority="high"
            width="1600"
            height="1060"
          />
          <div className="journey-shade" aria-hidden="true" />
        </figure>
        <div className="journey-intro">
          <p className="journey-kicker">湖北旅行指南</p>
          <h1 id="hero-title">沿着长江，<br />走进湖北</h1>
          <p className="journey-description">从武汉的过早，到宜昌的峡江。<br />找去处，排好每天的路线、吃住与返程。</p>
          <a href="#routes" className="journey-routes">看湖北经典路线<ArrowUpRight size={16} /></a>
        </div>
        <p className="journey-location"><MapPin size={15} />宜昌 · {photo.subject}</p>
      </div>
      <div className="journey-workbench">
        <div className="journey-modes" role="group" aria-label="首页旅行工具">
          <button type="button" aria-pressed={mode === 'plan'} onClick={() => setMode('plan')}><Route size={17} />规划行程</button>
          <button type="button" aria-pressed={mode === 'search'} onClick={() => setMode('search')}><Search size={17} />找景点</button>
        </div>
        <form className="journey-search-card" onSubmit={submit} aria-label={mode === 'plan' ? '快速规划湖北行程' : '搜索湖北旅行'}>
          <h2>{mode === 'plan' ? '你的湖北行程' : '想去哪里看看？'}</h2>
          <label className="journey-field">
            <span><MapPin size={15} />目的地</span>
            <SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}>
              <option value="all">{mode === 'plan' ? '先选一座城市' : '湖北全境'}</option>
              {cities.map(item => <option value={item.id} key={item.id}>{item.shortName}</option>)}
            </SelectField>
          </label>
          {mode === 'plan' ? <label className="journey-field">
            <span><CalendarDays size={15} />游玩天数</span>
            <SelectField aria-label="首页游玩天数" value={dayCount} onChange={event => setDays(Number(event.target.value))}>
              {Array.from({ length: capacity }, (_, index) => <option value={index + 1} key={index}>{index + 1} 天</option>)}
            </SelectField>
          </label> : <label className="journey-field">
            <span><Search size={15} />景点或主题</span>
            <InputField name="place" type="search" aria-label="首页搜索景点或主题" value={keyword} onChange={event => setKeyword(event.target.value)} maxLength={100} placeholder="例如：黄鹤楼、古城、湿地" autoComplete="off" />
          </label>}
          <button type="submit" className="journey-search-submit">
            {mode === 'plan' ? '继续安排吃住行' : '查找去处'}<ArrowRight size={18} />
          </button>
        </form>
        <button className="journey-ask" type="button" onClick={onAsk}><MessageCircle size={18} /><strong>问小游</strong><span>查湖北吃住行</span><ArrowUpRight size={15} /></button>
      </div>
    </div>
    <nav className="discovery-paths page-width" aria-label="按旅行方式探索">{travelStyles.map(({ icon: Icon, title, detail, filter }) => (
      <button key={filter} type="button" onClick={() => onExplore(filter)}>
        <span className="path-mark"><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span>
        <span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true" />
      </button>
    ))}</nav>
  </section>;
}
