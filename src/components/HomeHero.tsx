import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { cities } from '../data';
import { Button, Field, InputField, SelectField } from './ui';
import type { FormEvent } from 'react';

export function HomeHero({ selection, date, travelers, onCity, onDate, onTravelers, onSearch, onPlan }: { selection: string; date: string; travelers: string; onCity: (id: string) => void; onDate: (date: string) => void; onTravelers: (n: string) => void; onSearch: (event: FormEvent) => void; onPlan: () => void }) {
  return <section aria-labelledby="hero-title" className="home-cover">
    <div className="cover-grid page-width">
      <div className="cover-copy hero-copy">
        <p className="cover-kicker"><span className="h-px w-8 bg-terracotta" />湖北旅行 · 一份慢行指南</p>
        <h1 id="hero-title" className="hero-title">把假期，<br /><span>交给山河。</span></h1>
        <p className="cover-description">从江城的一碗过早，到峡江深处的一阵风。<br className="hidden sm:block" />在湖北，找到值得停留的地方。</p>
        <p className="mt-4 text-xs leading-7 text-muted">湖北全境旅行指南与行程规划，<br />把每天的路线、住宿与餐桌，一起安排妥当。</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 sm:mt-10">
          <Button onClick={onPlan} className="min-h-13 px-6">规划我的旅程<ArrowUpRight size={17} strokeWidth={1.5} /></Button>
          <a href="#popular" className="text-link">先看心动的风景<ArrowRight size={16} strokeWidth={1.5} /></a>
        </div>
        <div className="cover-edition"><span>WANDER INTO HUBEI</span><span>山水 / 人文 / 地方风味</span></div>
      </div>
      <figure className="cover-image hero-copy">
        <img src="/images/xiling.jpg" alt="宜昌西陵峡灯影峡的长江、层叠山峦与江岸亭阁" fetchPriority="high" width="1920" height="1280" />
        <div aria-hidden="true" className="cover-image-shade" />
        <span aria-hidden="true" className="cover-image-word">Hubei.</span>
        <figcaption className="cover-caption"><span><span className="mb-2 block font-display text-[10px] tracking-[.18em] text-white/65">THE JOURNEY BEGINS</span>宜昌 · 西陵峡 / 灯影峡</span><a href="#popular" aria-label="向下探索湖北目的地" className="cover-down"><ArrowDown size={20} strokeWidth={1.2} /></a></figcaption>
      </figure>
    </div>
    <div className="page-width">
      <form onSubmit={onSearch} aria-label="搜索湖北旅行" className="cover-search search-panel">
        <div className="cover-search-intro"><span className="font-display text-[10px] tracking-[.14em] text-terracotta">YOUR NEXT JOURNEY</span><p className="mt-2 font-editorial text-xl">从哪里开始？</p></div>
        <div className="cover-fields">
          <Field label="想去哪里" icon={<MapPin size={14} strokeWidth={1.5} />}><SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}><option value="all">还没想好 · 全部湖北</option>{cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}</SelectField></Field>
          <Field label="什么时候出发" icon={<CalendarDays size={14} strokeWidth={1.5} />}><InputField aria-label="出行日期" placeholder="YYYY-MM-DD（可选）" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" maxLength={10} value={date} onChange={event => onDate(event.target.value)} /></Field>
          <Field label="几个人一起" icon={<Users size={14} strokeWidth={1.5} />}><SelectField aria-label="出行人数" value={travelers} onChange={event => onTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n} 位旅行者</option>)}</SelectField></Field>
          <Button type="submit" className="h-13 w-full"><Search size={16} strokeWidth={1.5} />发现目的地</Button>
        </div>
      </form>
    </div>
  </section>;
}