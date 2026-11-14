import { BedDouble, ChevronDown, Route, Wallet } from 'lucide-react';
import { cityById } from '../data';
import { practical } from '../data/practical';
import { dayJourneys } from '../data/day-journeys';
import { arrivalLabels, getDepartureLabel, buildTrip, estimateBudget, getTripIssues, groupLabels, interestLabels, mobilityLabels, type Profile } from '../planning';
import { TripSchedule } from './TripSchedule';
import './support-plan-preview.css';

export function SupportPlanPreview({ profile, onUpdateReturn, initialDay }: { profile: Profile; onUpdateReturn: (profile: Profile) => void; initialDay?: 'last' }) {
  const days = buildTrip(profile);
  if (!days.length) return null;
  const firstNight = dayJourneys[days[0].cityId][days[0].originalIndex].base;
  const budget = estimateBudget(profile, days.length);
  const cityIds = [...new Set(days.map(day => day.cityId))];
  const issues = getTripIssues(profile);
  const returnLabel = getDepartureLabel(profile);
  const sources = [...new Map([...cityIds.flatMap(id => cityById[id].sources), ...days.flatMap(day => day.returnSources || [])].map(source => [source.url, source])).values()];
  const target = profile.budgetLimit && profile.budgetScope ? profile.budgetLimit * (profile.budgetScope === 'per-person' ? profile.party : 1) : undefined;
  return <section className="support-plan-preview" aria-label="推荐行程预览">
    <header className="support-plan-heading">
      <h3>{cityIds.map(id => cityById[id].shortName).join(' → ')}</h3>
      <div className="support-plan-metrics"><span><strong>{days.length}</strong> 天</span><span><strong>{profile.party}</strong> 人</span><span><strong>{budget.nights}</strong> 晚住宿</span></div>
      <p className="support-plan-timing"><Route size={15} />{profile.arrival ? arrivalLabels[profile.arrival] : '抵达时段待确认'}<span>{returnLabel}</span></p>
      {target && <p className={'support-plan-budget-check' + (budget.total[1] > target ? ' needs-review' : '')}>{budget.total[0] > target ? '当前最低规划预留已超目标。' : budget.total[1] > target ? '规划预留有超出目标的区间，建议继续调整。' : '当前规划预留范围未超目标。'}此比较不含往返、跨城大交通与租车。</p>}
      <details className="support-plan-budget"><summary><Wallet size={15} /><span>全团预算预留<strong>¥{budget.total[0].toLocaleString()}–{budget.total[1].toLocaleString()}</strong></span><ChevronDown size={15} /></summary><div><p>{budget.nights ? `住宿按 ${budget.rooms} 间双人房、${budget.nights} 晚预留。` : '行程未计过夜住宿。'}{budget.ticketDays < days.length ? '返程日预算仅预留餐食与当地交通。' : ''}</p>{profile.budgetLimit && <p>目标预算为{profile.budgetScope === 'per-person' ? '每人' : '全团'} ¥{profile.budgetLimit.toLocaleString()}。</p>}</div></details>
    </header>
    <TripSchedule days={days} profile={profile} onUpdateReturn={onUpdateReturn} initialDay={initialDay} />
    {budget.arrivalNight && <p className="support-plan-arrival">预算包含抵达前夜。可住在{firstNight}，方便去第一站。</p>}
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
    <p className="support-plan-footnote">预算不含往返、跨城大交通与租车。</p>
  </section>;
}
