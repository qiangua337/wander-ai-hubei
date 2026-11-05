import { ArrowDown, ArrowUpRight, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { cities } from '../data';
import { Button, Field, InputField, SelectField } from './ui';
import type { FormEvent } from 'react';

type HeroProps = { selection: string; date: string; travelers: string; onCity: (id: string) => void; onDate: (date: string) => void; onTravelers: (n: string) => void; onSearch: (event: FormEvent) => void; onPlan: () => void; onTemplate: (id: string) => void; onExplore: (filter: 'nature' | 'city' | 'family' | 'food') => void };
export function HomeHero({ selection, date, travelers, onCity, onDate, onTravelers, onSearch, onPlan, onTemplate, onExplore }: HeroProps) {
  return <section aria-labelledby="hero-title" className="home-cover">
    <div className="journey-cover page-width">
      <figure className="journey-landscape"><img src="/images/enshi.jpg" alt="恩施大峡谷的峰丛、独立石柱与山间聚落" fetchPriority="high" width="3840" height="1782" /><div className="journey-shade" /><figcaption><MapPin size={14} />恩施大峡谷 · 山河的另一种尺度</figcaption></figure>
      <div className="journey-intro">
        <p className="journey-kicker"><span>寻游湖北</span>山河有来处，旅行有日常</p>
        <h1 id="hero-title">这一程，<br /><strong>向湖北出发。</strong></h1>
        <p className="journey-description">从长江边的一碗过早，<br />到峡谷深处的一阵风。<br className="journey-mobile-break" />把喜欢的风景，过成自己的假期。</p>
        <div className="journey-actions"><Button onClick={onPlan} className="px-6">规划我的旅程<ArrowUpRight size={18} /></Button><a href="#popular">先去看看风景<ArrowDown size={16} /></a></div>
        <div className="journey-promise"><span>每天怎么走</span><span>每晚住哪里</span><span>沿途吃什么</span></div>
      </div>
      <div className="journey-search-card">
        <p className="eyebrow">把假期安排好</p><h2>你的下一站，是哪里？</h2><p className="journey-search-note">选一座城市，从心动走到出发。</p>
        <form onSubmit={onSearch} aria-label="搜索湖北旅行">
          <Field label="想去哪里" icon={<MapPin size={15} />}><SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}><option value="all">还没想好 · 全部湖北</option>{cities.map(city => <option value={city.id} key={city.id}>{city.shortName}</option>)}</SelectField></Field>
          <div className="journey-search-pair"><Field label="出发日期" icon={<CalendarDays size={15} />}><InputField aria-label="出行日期" placeholder="年-月-日" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" maxLength={10} value={date} onChange={event => onDate(event.target.value)} /></Field><Field label="同行人数" icon={<Users size={15} />}><SelectField aria-label="出行人数" value={travelers} onChange={event => onTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n} 位旅行者</option>)}</SelectField></Field></div>
          <Button type="submit" className="w-full"><Search size={17} />发现目的地</Button>
        </form>
        <div className="journey-quick"><span>还没想好？从一段经典开始</span><div>{[{id:'wuhan-weekend',days:'2 天',city:'武汉'}, {id:'west-five',days:'5 天',city:'宜昌 · 恩施'}, {id:'hubei-seven',days:'7 天',city:'湖北经典'}].map(item => <button key={item.id} onClick={() => onTemplate(item.id)}><strong>{item.days}</strong><span>{item.city}</span><ArrowUpRight size={13} /></button>)}</div></div>
      </div>
    </div>
    <nav className="discovery-paths page-width" aria-label="按旅行方式探索">{([{icon:'山',title:'去山野，换口气',detail:'峡谷 · 森林 · 湖泊',filter:'nature'}, {icon:'城',title:'进一座有故事的城',detail:'古城 · 名楼 · 文博',filter:'city'}, {icon:'伴',title:'把时间留给家人',detail:'亲子 · 轻松 · 慢行',filter:'family'}, {icon:'味',title:'从一口地方味开始',detail:'过早 · 楚菜 · 茶香',filter:'food'}] as const).map(item => <button key={item.filter} onClick={() => onExplore(item.filter)}><span className="path-mark">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={16} /></button>)}</nav>
  </section>;
}