import { useState } from 'react';
import { ArrowRight, Route } from 'lucide-react';
import { cities, cityById } from '../data';
import { arrivalLabels, departureLabels, budgetLabels, groupLabels, interestLabels, mobilityLabels, templates, validDate, type Profile } from '../planning';
import type { SupportTripDraft } from '../support';
import { SelectField, InputField } from './ui';
import './support-trip-form.css';

export function SupportTripForm({ draft, initialCity, initialParty, initialDate, onSubmit, onCancel }: {
  draft?: SupportTripDraft; initialCity?: string; initialParty: number; initialDate: string;
  onSubmit: (draft: SupportTripDraft, question: string) => void; onCancel: () => void;
}) {
  const selectedTemplate = templates.find(template => draft?.cityIds?.length === template.segments.length && template.segments.every(segment => draft.cityIds?.includes(segment.cityId)));
  const [route, setRoute] = useState(selectedTemplate && draft?.cityIds && draft.cityIds.length > 1 ? selectedTemplate.id : draft?.cityIds?.[0] || initialCity || '');
  const template = templates.find(item => item.id === route);
  const city = cityById[route];
  const capacity = template ? template.segments.reduce((sum, segment) => sum + segment.indices.length, 0) : city?.days.length || 4;
  const [days, setDays] = useState(Math.max(1, Math.min(draft?.days || 2, capacity)));
  const [party, setParty] = useState(draft?.party && draft.party >= 1 && draft.party <= 6 ? draft.party : initialParty);
  const [interest, setInterest] = useState<Profile['interest']>(draft?.interest || 'balanced');
  const [group, setGroup] = useState<Profile['group']>(draft?.group || (party === 1 ? 'solo' : 'friends'));
  const [mode, setMode] = useState<Profile['mode']>(draft?.mode || 'public');
  const [pace, setPace] = useState<Profile['pace']>(draft?.pace || (group === 'family' || group === 'senior' ? 'relaxed' : 'classic'));
  const [budget, setBudget] = useState<Profile['budget'] | 'auto'>(draft?.budget || 'auto');
  const [date, setDate] = useState(draft?.date || (validDate(initialDate) ? initialDate : ''));
  const [origin, setOrigin] = useState(draft?.origin || '');
  const [arrival, setArrival] = useState<NonNullable<Profile['arrival']>>(draft?.arrival || 'full-day');
  const [departure, setDeparture] = useState<NonNullable<Profile['departure']>>(draft?.departure || 'flexible');
  const [mobility, setMobility] = useState<NonNullable<Profile['mobility']>>(draft?.mobility || 'standard');
  const [budgetLimit, setBudgetLimit] = useState(draft?.budgetLimit ? String(draft.budgetLimit) : '');
  const [budgetScope, setBudgetScope] = useState<NonNullable<Profile['budgetScope']>>(draft?.budgetScope || 'total');
  const [error, setError] = useState('');
  const chooseRoute = (id: string) => {
    setRoute(id); setError('');
    const nextTemplate = templates.find(item => item.id === id);
    const nextCapacity = nextTemplate ? nextTemplate.segments.reduce((sum, segment) => sum + segment.indices.length, 0) : cityById[id]?.days.length || 4;
    setDays(previous => nextTemplate ? nextCapacity : Math.min(previous, nextCapacity));
  };
  return <form className="support-trip-form" onSubmit={event => {
    event.preventDefault();
    if (!route) { setError('先选一座城市或经典路线。'); return; }
    if (date && !validDate(date)) { setError('日期请填写有效的年-月-日，也可以先留空。'); return; }
    if (budgetLimit && (!Number.isInteger(Number(budgetLimit)) || Number(budgetLimit) < 1 || Number(budgetLimit) > 1000000)) { setError('目标预算请填 1–1000000 元的整数，也可以先留空。'); return; }
    const cityIds = template ? template.segments.map(segment => segment.cityId) : [route];
    const count = template ? capacity : days;
    const request: SupportTripDraft = { ...draft, cityIds, days: count, party, interest, group, mode, pace, budget: budget === 'auto' ? undefined : budget, date, origin: origin.trim(), arrival, departure, mobility, budgetLimit: budgetLimit ? Number(budgetLimit) : undefined, budgetScope: budgetLimit ? budgetScope : undefined };
    const question = `${origin.trim() ? '从' + origin.trim() + '出发，' : ''}${cityIds.map(id => cityById[id].shortName).join('、')} ${count} 天，${party} 人，${groupLabels[group]}，${interestLabels[interest]}，${arrivalLabels[arrival]}，${departureLabels[departure]}，${mobilityLabels[mobility]}${budgetLimit ? '，' + (budgetScope === 'total' ? '全团' : '每人') + '预算' + budgetLimit + '元' : ''}`;
    onSubmit(request, question);
  }}>
    <div className="support-trip-intro"><span><Route size={17} />一起把假期排好</span><p>选好条件，游览、每晚落脚处和沿途餐食一起安排。</p></div>
    <label>这次去哪里<SelectField aria-label="小游行程目的地" value={route} onChange={event => chooseRoute(event.target.value)}><option value="">选择一座城市或经典跨城</option><optgroup label="按城市安排">{cities.map(item => <option key={item.id} value={item.id}>{item.shortName}</option>)}</optgroup><optgroup label="经典跨城路线">{templates.filter(item => item.segments.length > 1).map(item => <option key={item.id} value={item.id}>{item.label} · {item.segments.map(segment => cityById[segment.cityId].shortName).join('—')}</option>)}</optgroup></SelectField></label>
    <div className="support-trip-pair support-trip-counts"><label>玩几天<SelectField aria-label="小游游玩天数" value={template ? capacity : days} disabled={Boolean(template)} onChange={event => setDays(Number(event.target.value))}>{Array.from({ length: capacity }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 天</option>)}</SelectField></label><label>几个人<SelectField aria-label="小游同行人数" value={party} onChange={event => { const count = Number(event.target.value); setParty(count); if (count > 1 && group === 'solo') setGroup('friends'); if (count === 1) setGroup('solo'); }}>{[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count} 人</option>)}</SelectField></label></div>
    <div className="support-trip-pair">
      <label>首日抵达<SelectField aria-label="小游首日抵达" value={arrival} onChange={event => setArrival(event.target.value as NonNullable<Profile['arrival']>)}>{Object.entries(arrivalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
      <label>最后一天返程<SelectField aria-label="小游返程时段" value={departure} onChange={event => setDeparture(event.target.value as NonNullable<Profile['departure']>)}>{Object.entries(departureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
    </div>
    <div className="support-trip-pair">
      <label>出发城市（可留空）<InputField aria-label="小游出发城市" value={origin} maxLength={24} onChange={event => setOrigin(event.target.value)} placeholder="例如：武汉" /></label>
      <label>体力与台阶<SelectField aria-label="小游体力限制" value={mobility} onChange={event => setMobility(event.target.value as NonNullable<Profile['mobility']>)}>{Object.entries(mobilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
    </div>
    <fieldset className="support-interest-picks"><legend>更喜欢怎么玩</legend><div>{Object.entries(interestLabels).map(([value, label]) => <button key={value} type="button" aria-pressed={interest === value} onClick={() => setInterest(value as Profile['interest'])}>{label}</button>)}</div></fieldset>
    <div className="support-trip-pair"><label>和谁一起<SelectField aria-label="小游同行人群" value={group} onChange={event => { const value = event.target.value as Profile['group']; setGroup(value); if (value === 'solo') setParty(1); if (value === 'family' || value === 'senior') { if (party === 1) setParty(2); setPace('relaxed'); } }}>{Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label><label>怎么出行<SelectField aria-label="小游交通方式" value={mode} onChange={event => setMode(event.target.value as Profile['mode'])}><option value="public">公共交通＋接驳</option><option value="drive">自驾出行</option></SelectField></label></div>
    {template && <p className="support-trip-hint">跨城路线保留固定天数与景点主线，仍可调整同行、交通、预算和节奏。</p>}
    <details className="support-trip-more"><summary>再选节奏、预算与日期</summary><div className="support-trip-pair"><label>旅行节奏<SelectField aria-label="小游旅行节奏" value={pace} onChange={event => setPace(event.target.value as Profile['pace'])}><option value="classic">经典串游</option><option value="relaxed">轻松慢游</option></SelectField></label><label>预算档位<SelectField aria-label="小游预算档位" value={budget} onChange={event => setBudget(event.target.value as Profile['budget'] | 'auto')}><option value="auto">按目标自动匹配</option>{Object.entries(budgetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label></div><div className="support-trip-pair"><label>目标预算（元，可留空）<InputField aria-label="小游目标预算" inputMode="numeric" value={budgetLimit} maxLength={7} onChange={event => { setBudgetLimit(event.target.value); setError(''); }} placeholder="例如：2000" /></label><label>预算口径<SelectField aria-label="小游预算口径" value={budgetScope} onChange={event => setBudgetScope(event.target.value as NonNullable<Profile['budgetScope']>)}><option value="total">全团合计</option><option value="per-person">每人</option></SelectField></label></div><p className="support-trip-hint">目标与规划预留比较，不含往返/跨城大交通、租车等费用。</p><label>出发日期（可留空）<InputField aria-label="小游出发日期" value={date} onChange={event => { setDate(event.target.value); setError(''); }} placeholder="年-月-日" maxLength={10} /></label></details>
    {error && <p role="alert" className="support-trip-error">{error}</p>}
    <div className="support-trip-submit"><button type="button" onClick={onCancel}>先继续问问</button><button type="submit">生成吃住行方案<ArrowRight size={15} /></button></div>
    <p className="support-trip-hint">依据本站路线组合，不自动预订。单城天数按已有章节选择。</p>
  </form>;
}
