import { ArrowRight, ArrowUpRight, Landmark, MapPin, MessageCircle, Mountain, Route, Search, UsersRound, Utensils } from 'lucide-react';
import { cities, cityPhotos } from '../data';
import { InputField, SelectField } from './ui';
import type { FormEvent } from 'react';

type HeroProps = {
  selection: string;
  onCity: (id: string) => void;
  onSearch: (keyword: string) => void;
  onPlan: () => void;
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('place');
    onSearch(typeof value === 'string' ? value.trim() : '');
  };

  return <section aria-labelledby="hero-title" className="home-cover">
    <div className="journey-cover">
      <figure className="journey-landscape">
        <img
          src="/images/xiling-cover-1600.webp"
          srcSet="/images/xiling-cover-768.webp 768w, /images/xiling-cover-1600.webp 1600w"
          sizes="100vw"
          alt={photo.alt || photo.subject}
          fetchPriority="high"
          width="1600"
          height="1060"
        />
        <div className="journey-shade" aria-hidden="true" />
      </figure>
      <div className="journey-frame page-width">
        <div className="journey-intro">
          <p className="journey-kicker">湖北旅行指南</p>
          <h1 id="hero-title">循江而行，<br />去看湖北。</h1>
          <p className="journey-description">从武汉的过早，到宜昌的峡江。<br />按城市找去处，把每天的吃住行安排好。</p>
          <div className="journey-links">
            <button type="button" onClick={onPlan}><Route size={17} />规划行程<ArrowUpRight size={15} /></button>
            <button type="button" onClick={onAsk}><MessageCircle size={17} />问小游<ArrowUpRight size={15} /></button>
          </div>
        </div>
        <p className="journey-location"><MapPin size={16} />宜昌 · {photo.subject}</p>
      </div>
    </div>
    <div className="journey-search-wrap page-width">
      <form className="journey-search-card" onSubmit={submit} aria-label="搜索湖北旅行">
        <label className="journey-field"><span><MapPin size={15} />目的地</span><SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}><option value="all">湖北全境</option>{cities.map(city => <option value={city.id} key={city.id}>{city.shortName}</option>)}</SelectField></label>
        <label className="journey-field"><span><Search size={15} />景点或主题</span><InputField name="place" type="search" aria-label="首页搜索景点或主题" maxLength={100} placeholder="例如：黄鹤楼、古城、湿地" autoComplete="off" /></label>
        <button type="submit" className="journey-search-submit"><Search size={19} />查找去处<ArrowRight size={17} /></button>
      </form>
      <nav className="discovery-paths" aria-label="按旅行方式探索">{travelStyles.map(({ icon: Icon, title, detail, filter }) => (
        <button key={filter} type="button" onClick={() => onExplore(filter)}>
          <span className="path-mark"><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span>
          <span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ))}</nav>
    </div>
  </section>;
}
