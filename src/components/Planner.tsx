import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cities, cityById } from '../data';
import { planDays, type Pace } from '../travel';
import { Modal } from './Modal';
import { TravelGuide } from './TravelGuide';
import { Button, SelectField, InputField } from './ui';

export function Planner({ initialCity, initialDate, travelers, onClose, onCopy }: { initialCity: string; initialDate: string; travelers: string; onClose: () => void; onCopy: (text: string) => void }) {
  const [cityId, setCityId] = useState(cityById[initialCity] ? initialCity : 'wuhan');
  const city = cityById[cityId];
  const [count, setCount] = useState(city.days.length);
  const [date, setDate] = useState(initialDate);
  const [pace, setPace] = useState<Pace>('classic');
  const [ready, setReady] = useState(false);
  return <Modal title="让行程，从一个具体的地方开始" onClose={onClose} wide>
    <div className="p-5 sm:p-8"><span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[11px] text-pine"><Sparkles size={14} />17 份湖北城市路线，按你的时间展开</span><h3 className="mb-5 mt-5 text-xl font-semibold">这次，去哪里、留几天？</h3>
      <form onSubmit={event => { event.preventDefault(); setReady(true); }} className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><label className="block text-xs font-medium">选择城市<SelectField aria-label="行程城市" className="mt-2" value={cityId} onChange={event => { setCityId(event.target.value); setCount(cityById[event.target.value].days.length); setReady(false); }}>{cities.map(item => <option key={item.id} value={item.id}>{item.shortName}</option>)}</SelectField></label><label className="block text-xs font-medium">计划天数<SelectField aria-label="计划天数" className="mt-2" value={count} onChange={event => { setCount(Number(event.target.value)); setReady(false); }}>{city.days.map((_, i) => <option value={i + 1} key={i}>{i + 1} 天{ i + 1 === city.days.length ? ' · 完整主线' : ''}</option>)}</SelectField></label><label className="block text-xs font-medium">出发日期（可选）<InputField aria-label="行程出发日期" type="date" className="mt-2" value={date} onInput={event => { setDate(event.currentTarget.value); setReady(false); }} onChange={event => { setDate(event.target.value); setReady(false); }} /></label></div>
        <div role="group" aria-label="旅行节奏" className="grid gap-3 sm:grid-cols-2">{[{ value: 'classic' as const, title: '经典串游', detail: '上午与下午串联重点，晚上留给城市生活。' }, { value: 'relaxed' as const, title: '轻松慢游', detail: '保留上午主线，每天下午留给休息与轻步行。' }].map(item => <button type="button" key={item.value} onClick={() => { setPace(item.value); setReady(false); }} aria-pressed={pace === item.value} className={`rounded-xl border p-4 text-left transition ${pace === item.value ? 'border-pine bg-sage' : 'border-line bg-white'}`}><span className="text-sm font-semibold text-pine">{item.title}</span><span className="mt-2 block text-xs leading-6 text-muted">{item.detail}</span></button>)}</div>
        <Button type="submit" className="w-full"><Sparkles size={16} />展开我的 {count} 天路线<ArrowRight size={16} /></Button>
      </form><p className="mt-4 text-[11px] leading-6 text-muted">按城市精选主线和可选支线整理，选择较少天数会保留主线前段；未接入实时 AI 或订单服务。</p>
    </div>
    {ready && <div className="border-t border-line" key={`${cityId}-${count}-${pace}-${date}`}><TravelGuide city={city} days={planDays(city, count, pace)} date={date} travelers={travelers} pace={pace} onCopy={onCopy} /></div>}
  </Modal>;
}
