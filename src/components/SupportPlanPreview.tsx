import { useRef, useState } from 'react';
import { ArrowDown, BedDouble, ChevronDown, Route, Utensils, Wallet } from 'lucide-react';
import { cityById } from '../data';
import { practical } from '../data/practical';
import { arrivalLabels, getDepartureLabel, buildTrip, estimateBudget, getTripIssues, groupLabels, interestLabels, mobilityLabels, type Profile } from '../planning';
import { planDate } from '../travel';
import { ReturnDayEditor } from './ReturnDayEditor';
import './support-plan-preview.css';

const effortLabels = { low: '较轻松', moderate: '适量步行', high: '高体力' };

export function SupportPlanPreview({ profile, onUpdateReturn }: { profile: Profile; onUpdateReturn: (profile: Profile) => void }) {
  const dayRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const jumpToDay = (index: number) => {
    setExpanded(previous => [...new Set([...previous, index])]);
    window.requestAnimationFrame(() => {
      dayRefs.current[index]?.scrollIntoView({ block: 'start', behavior: 'instant' });
      dayRefs.current[index]?.querySelector('summary')?.focus({ preventScroll: true });
    });
  };
  const days = buildTrip(profile);
  const lastDay = days.at(-1);
  const budget = estimateBudget(profile, days.length);
  const cityIds = [...new Set(days.map(day => day.cityId))];
  const issues = getTripIssues(profile);
  const returnLabel = getDepartureLabel(profile);
  const returnScheduled = profile.departure && profile.departure !== 'flexible';
  const sources = [...new Map([...cityIds.flatMap(id => cityById[id].sources), ...days.flatMap(day => day.returnSources || [])].map(source => [source.url, source])).values()];
  const target = profile.budgetLimit && profile.budgetScope ? profile.budgetLimit * (profile.budgetScope === 'per-person' ? profile.party : 1) : undefined;
  if (!days.length) return null;
  return <section className="support-plan-preview" aria-label="推荐行程预览">
    <header className="support-plan-heading">
      <h3>{cityIds.map(id => cityById[id].shortName).join(' → ')}</h3>
      <div className="support-plan-metrics"><span><strong>{days.length}</strong> 天</span><span><strong>{profile.party}</strong> 人</span><span><strong>{budget.nights}</strong> 晚住宿</span></div>
      <p className="support-plan-timing"><Route size={15} />{profile.arrival ? arrivalLabels[profile.arrival] : '抵达时段待确认'}<span>{returnLabel}</span></p>
      {target && <p className={'support-plan-budget-check' + (budget.total[1] > target ? ' needs-review' : '')}>{budget.total[0] > target ? '当前最低规划预留已超目标。' : budget.total[1] > target ? '规划预留有超出目标的区间，建议继续调整。' : '当前规划预留范围未超目标。'}此比较不含往返、跨城大交通与租车。</p>}
      <details className="support-plan-budget"><summary><Wallet size={15} /><span>全团预算预留<strong>¥{budget.total[0].toLocaleString()}–{budget.total[1].toLocaleString()}</strong></span><ChevronDown size={15} /></summary><div><p>{budget.nights ? `住宿按 ${budget.rooms} 间双人房、${budget.nights} 晚预留。` : '行程未计过夜住宿。'}{budget.ticketDays < days.length ? '返程日预算仅预留餐食与当地交通。' : ''}</p>{profile.budgetLimit && <p>目标预算为{profile.budgetScope === 'per-person' ? '每人' : '全团'} ¥{profile.budgetLimit.toLocaleString()}。</p>}</div></details>
    </header>
    {lastDay?.afternoonReturn && <ReturnDayEditor day={lastDay} profile={profile} onApply={onUpdateReturn} />}
    <section className="support-route-overview" aria-label="每天去哪住哪">
      <div className="support-route-overview-heading"><h4>每日安排总览</h4><span>点一天，看详细安排</span></div>
      <ol>{days.map((day, index) => <li key={`${day.cityId}-${index}`}><button type="button" onClick={() => jumpToDay(index)} aria-label={`查看第 ${index + 1} 天详细安排`}>
        <span className="support-overview-number">第 {index + 1} 天</span>
        <span className="support-overview-main"><strong>{day.title}</strong><span>{day.region} · {effortLabels[day.effort]}{day.returnMorning?.conditional ? ' · 上午可选' : ''}</span><span className="support-overview-stay">{index < days.length - 1 ? <><BedDouble size={13} />{day.overnight}</> : <><Route size={13} />{returnLabel}</>}</span></span><ArrowDown size={15} />
      </button></li>)}</ol>
    </section>
    {budget.arrivalNight && <p className="support-plan-arrival">预算已包含抵达前夜。住宿片区可先看{practical[days[0].cityId].stays[0].area}，再按首站或实际返程站点选房。</p>}
    <div className="support-plan-days" aria-label="每日吃住行安排">
      {days.map((day, index) => <details ref={element => { dayRefs.current[index] = element; }} className="support-plan-day" key={`${day.cityId}-${day.originalIndex}-${index}`} open={expanded.includes(index)}>
        <summary onClick={event => { event.preventDefault(); setExpanded(previous => previous.includes(index) ? previous.filter(item => item !== index) : [...previous, index]); }}><span className="support-plan-day-number">第 {index + 1} 天</span><span className="support-plan-day-title">{day.title}<small>{[planDate(profile.date, index), day.region, effortLabels[day.effort]].filter(Boolean).join(' · ')}</small></span><ChevronDown size={15} /></summary>
        <div className="support-plan-day-content">
          <ol className="support-plan-stops">{day.stops.map((stop, stopIndex) => <li key={`${stop.title}-${stopIndex}`}><span>{stop.time}</span><strong>{stop.title}</strong><p>{stop.detail}</p></li>)}</ol>
          <dl className="support-plan-day-practical">
            <div><dt><Route size={14} />怎么走</dt><dd>{day.transport}</dd></div>
            {day.breakfast || day.lunch || day.dinner ? <><div><dt><Utensils size={14} />早餐</dt><dd>{day.breakfast || '在住宿片区用早餐，按出发时间安排。'}</dd></div><div><dt><Utensils size={14} />午餐</dt><dd>{day.lunch || '按实际游览片区核对正餐与供餐。'}</dd></div><div><dt><Utensils size={14} />晚餐</dt><dd>{day.dinner || '回到当晚住宿片区用餐。'}</dd></div></> : <div><dt><Utensils size={14} />餐食安排</dt><dd>{day.meal}</dd></div>}
            {index < days.length - 1
              ? <div><dt><BedDouble size={14} />这一晚</dt><dd>{day.overnight}</dd></div>
              : <div><dt><Route size={14} />返程安排</dt><dd>{returnScheduled ? `${returnLabel}，当晚无住宿预留。` : `返程时段待定。如需延住，可参考${day.overnight}。`}</dd></div>}
          </dl>
          <p className="support-plan-day-tip">出行提醒：{day.tip}</p>
        </div>
      </details>)}
    </div>
    <details className="support-plan-checks"><summary>旅行条件和行前核对</summary>
      <dl className="support-plan-constraints">
        <div><dt>从哪出发</dt><dd>{profile.origin || '待填写'}</dd></div>
        <div><dt>同行与交通</dt><dd>{groupLabels[profile.group]} · {profile.mode === 'drive' ? '自驾出行' : '公共交通＋接驳'}</dd></div>
        <div><dt>玩法与节奏</dt><dd>{profile.template === 'custom' ? interestLabels[profile.interest] : '经典固定主线'} · {profile.pace === 'relaxed' ? '轻松慢游' : '经典串游'}</dd></div>
        <div><dt>体力条件</dt><dd>{mobilityLabels[profile.mobility || 'standard']}</dd></div>
      </dl>
      {issues.length > 0 && <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
    </details>
    <details className="support-plan-stay-guide"><summary><BedDouble size={15} /><span>住宿片区怎么选</span><ChevronDown size={15} /></summary><div>{cityIds.map(id => <section key={id}><h4>{cityById[id].shortName}</h4>{practical[id].stays.map(stay => <div className="support-plan-stay-area" key={stay.area}><strong>{stay.area}</strong><p>{stay.bestFor}。{stay.reason}</p><p>订前确认：{stay.check}</p></div>)}</section>)}</div></details>
    {profile.note && <p className="support-plan-personal-note"><strong>你的补充想法：</strong>{profile.note}</p>}
    <details className="support-plan-source-list"><summary>继续核对 · 官方旅行资料</summary>{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</details>
    <p className="support-plan-footnote">预算不含往返与跨城大交通、租车等费用。时段与接驳为编辑建议，预约、车船和住宿安排出发前再确认。</p>
  </section>;
}
