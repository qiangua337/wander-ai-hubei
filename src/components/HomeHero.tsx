import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { cities } from '../data';
import { Button, Field, InputField, SelectField } from './ui';
import type { FormEvent } from 'react';

type HeroProps = { selection: string; date: string; travelers: string; onCity: (id: string) => void; onDate: (date: string) => void; onTravelers: (n: string) => void; onSearch: (event: FormEvent) => void; onPlan: () => void; onOpenPlace: (id: string) => void };
export function HomeHero({ selection, date, travelers, onCity, onDate, onTravelers, onSearch, onPlan, onOpenPlace }: HeroProps) {
  return <section aria-labelledby="hero-title" className="home-cover">
    <div className="cover-stage">
      <figure className="cover-image"><img src="/images/enshi.jpg" alt="恩施大峡谷的喀斯特峰丛、独立石柱与山间聚落" fetchPriority="high" width="3840" height="1782" /><div className="cover-image-shade" /><figcaption className="cover-caption"><MapPin size={14} strokeWidth={1.5} /><span>恩施 · 大峡谷</span><span>峰丛与地缝之间，看见山河的形成</span></figcaption></figure>
      <div className="page-width cover-grid">
        <div className="cover-copy hero-copy">
          <p className="cover-kicker"><span className="cover-seal">荆楚</span><span>湖北全域旅行指南</span></p>
          <h1 id="hero-title" className="hero-title">江山入画，<br /><span className="font-semibold">荆楚入心。</span></h1>
          <p className="cover-description">从一江峡水，到一城烟火。<br />看得见山河，也读得懂来处。</p>
          <div className="cover-services"><span>逐日路线</span><span>住宿片区</span><span>地方风味</span></div>
          <div className="cover-actions"><Button variant="orange" onClick={onPlan} className="min-h-12 px-6">规划我的旅程<ArrowUpRight size={17} strokeWidth={1.5} /></Button><a href="#popular" className="cover-browse">先看湖北的风景<ArrowRight size={16} strokeWidth={1.5} /></a></div>
          <p className="cover-note">选一座城，连起风景、餐桌与每一晚的落脚处。</p>
        </div>
        <aside aria-label="从文化出发" className="cover-discovery"><p className="cover-discovery-label">山河之外，还有这些来处</p>
          <button onClick={() => onOpenPlace('suizhou-museum')} className="cover-discovery-card"><img src="/images/suizhou-bells.jpg" alt="随州出土的擂鼓墩二号墓编钟" width="200" height="140" loading="lazy" /><span><span className="block text-xs text-white/65">随州 · 曾随文化</span><strong className="mt-2 block font-sans text-lg font-medium">礼乐与青铜</strong></span><ArrowUpRight size={17} strokeWidth={1.3} /></button>
          <button onClick={() => onOpenPlace('jingzhou-wall')} className="cover-discovery-card"><img src="/images/jingzhou.jpg" alt="荆州古城宾阳楼与城墙" width="200" height="140" loading="lazy" /><span><span className="block text-xs text-white/65">荆州 · 城市记忆</span><strong className="mt-2 block font-sans text-lg font-medium">古城与楚韵</strong></span><ArrowUpRight size={17} strokeWidth={1.3} /></button>
        </aside>
      </div>
    </div>
    <div className="page-width"><form onSubmit={onSearch} aria-label="搜索湖北旅行" className="cover-search">
      <div className="cover-search-intro"><span>行前小笺</span><p>下一站，去哪里？</p></div>
      <div className="cover-fields">
        <Field label="想去哪里" icon={<MapPin size={14} strokeWidth={1.5} />}><SelectField aria-label="选择湖北城市" value={selection} onChange={event => onCity(event.target.value)}><option value="all">还没想好 · 全部湖北</option>{cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}</SelectField></Field>
        <Field label="什么时候出发" icon={<CalendarDays size={14} strokeWidth={1.5} />}><InputField aria-label="出行日期" placeholder="年-月-日（可选）" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" maxLength={10} value={date} onChange={event => onDate(event.target.value)} /></Field>
        <Field label="几个人一起" icon={<Users size={14} strokeWidth={1.5} />}><SelectField aria-label="出行人数" value={travelers} onChange={event => onTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n} 位旅行者</option>)}</SelectField></Field>
        <Button type="submit" className="h-12 w-full"><Search size={16} strokeWidth={1.5} />发现目的地</Button>
      </div>
    </form></div>
  </section>;
}
