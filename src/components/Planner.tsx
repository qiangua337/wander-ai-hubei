import { useRef, useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { cities, cityById } from '../data';
import { selectPlanDays, type Pace } from '../travel';
import { Modal } from './Modal';
import { TravelGuide } from './TravelGuide';
import { Button, SelectField, InputField } from './ui';

export function Planner({ initialCity, initialDate, travelers, onClose, onCopy }: { initialCity: string; initialDate: string; travelers: string; onClose: () => void; onCopy: (text: string) => void }) {
  const [cityId, setCityId] = useState(cityById[initialCity] ? initialCity : 'wuhan');
  const city = cityById[cityId];
  const [selected, setSelected] = useState(city.days.map((_, i) => i));
  const [date, setDate] = useState(initialDate);
  const [pace, setPace] = useState<Pace>('classic');
  const [ready, setReady] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  const days = selectPlanDays(city, selected, pace);
  const discontinuous = selected.length > 0 && (Math.min(...selected) !== 0 || Math.max(...selected) - Math.min(...selected) + 1 !== selected.length);
  return <Modal title="让行程，从一个具体的地方开始" onClose={onClose} wide>
    <div className="p-5 sm:p-8"><span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[11px] text-pine"><Sparkles size={14} />17 份湖北城市路线，自选想走的篇章</span><h3 className="mb-5 mt-5 text-xl font-semibold">这次，去哪里、留几天？</h3>
      <form onSubmit={event => { event.preventDefault(); if (!days.length) return; setReady(true); window.requestAnimationFrame(() => { result.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); result.current?.focus({ preventScroll: true }); }); }} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3"><label className="block text-xs font-medium">选择城市<SelectField aria-label="行程城市" className="mt-2" value={cityId} onChange={event => { const next = cityById[event.target.value]; setCityId(next.id); setSelected(next.days.map((_, i) => i)); setReady(false); }}>{cities.map(item => <option key={item.id} value={item.id}>{item.shortName}</option>)}</SelectField></label><label className="block text-xs font-medium">计划天数<SelectField aria-label="计划天数" className="mt-2" value={selected.length} onChange={event => { setSelected(city.days.map((_, i) => i).slice(0, Number(event.target.value))); setReady(false); }}>{!selected.length && <option value={0}>请至少选择一天</option>}{city.days.map((_, i) => <option value={i + 1} key={i}>{i + 1} 天{i + 1 === city.days.length ? ' · 完整主线' : ''}</option>)}</SelectField></label><label className="block text-xs font-medium">出发日期（可选）<InputField aria-label="行程出发日期" type="date" className="mt-2" value={date} onInput={event => { setDate(event.currentTarget.value); setReady(false); }} onChange={event => { setDate(event.target.value); setReady(false); }} /></label></div>
        <fieldset><legend className="text-sm font-semibold">选你真正想走的内容</legend><p className="mb-3 mt-2 text-xs leading-6 text-muted">默认保留完整主线；也可以取消、替换其中的天数。按原路线先后安排，不把远郊景点挤进同一天。</p><div className="space-y-2">{city.days.map((day, i) => <label key={day.title} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selected.includes(i) ? 'border-pine/40 bg-sage/70' : 'border-line bg-white'}`}><input type="checkbox" checked={selected.includes(i)} onChange={() => { setSelected(previous => previous.includes(i) ? previous.filter(index => index !== i) : [...previous, i]); setReady(false); }} className="mt-1 h-4 w-4 shrink-0 accent-pine" /><span className="min-w-0"><span className="block text-sm font-semibold leading-6">{day.title}</span><span className="mt-1 block text-[11px] leading-6 text-muted">{day.stops.map(stop => stop.title).join(' → ')}</span></span></label>)}</div>{discontinuous && <p className="mt-3 rounded-xl bg-sand p-3 text-[11px] leading-6 text-muted">已跳选原路线章节。每天的片区内建议保留；跨天接驳、抵达城市和住宿需结合「到达与接驳」重新确认，系统不自动计算车程。</p>}</fieldset>
        <div role="group" aria-label="旅行节奏" className="grid gap-3 sm:grid-cols-2">{[{ value: 'classic' as const, title: '经典串游', detail: '上午与下午串联重点，晚上留给城市生活。' }, { value: 'relaxed' as const, title: '轻松慢游', detail: '下午活动改为可选，保留必要接驳和原路线细节。' }].map(item => <button type="button" key={item.value} onClick={() => { setPace(item.value); setReady(false); }} aria-pressed={pace === item.value} className={`rounded-xl border p-4 text-left transition ${pace === item.value ? 'border-pine bg-sage' : 'border-line bg-white'}`}><span className="flex items-center justify-between text-sm font-semibold text-pine">{item.title}{pace === item.value && <Check size={16} />}</span><span className="mt-2 block text-xs leading-6 text-muted">{item.detail}</span></button>)}</div>
        <Button type="submit" disabled={!days.length} className="w-full"><Sparkles size={16} />展开我的 {days.length} 天路线<ArrowRight size={16} /></Button>
      </form><p className="mt-4 text-[11px] leading-6 text-muted">路线由编辑整理，支持按兴趣取舍；未接入实时 AI 或订单服务。</p>
    </div>
    {ready && <div ref={result} tabIndex={-1} aria-label="整理好的行程" className="scroll-mt-24 border-t border-line outline-none" key={`${cityId}-${selected.join(',')}-${pace}-${date}`}><TravelGuide city={city} days={days} date={date} travelers={travelers} pace={pace} onCopy={onCopy} customSelection={discontinuous} /></div>}
  </Modal>;
}
