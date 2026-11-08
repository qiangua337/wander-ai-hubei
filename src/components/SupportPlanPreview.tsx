import { BedDouble, ChevronDown, Route, Utensils, Wallet } from 'lucide-react';
import { cityById } from '../data';
import { practical } from '../data/practical';
import { buildTrip, estimateBudget, groupLabels, interestLabels, type Profile } from '../planning';
import { planDate } from '../travel';
import './support-plan-preview.css';

export function SupportPlanPreview({ profile }: { profile: Profile }) {
  const days = buildTrip(profile);
  const budget = estimateBudget(profile, days.length);
  const cityIds = [...new Set(days.map(day => day.cityId))];
  if (!days.length) return null;
  return <section className="support-plan-preview" aria-label="推荐行程预览">
    <header className="support-plan-heading">
      <p><Route size={15} />这一程，已经有了安排</p>
      <h3>{cityIds.map(id => cityById[id].shortName).join(' → ')}</h3>
      <div className="support-plan-metrics"><span><strong>{days.length}</strong> 天</span><span><strong>{profile.party}</strong> 人</span><span><strong>{budget.nights}</strong> 晚住宿</span></div>
      <p className="support-plan-conditions">{groupLabels[profile.group]} · {profile.mode === 'drive' ? '自驾出行' : '公共交通＋接驳'} · {profile.pace === 'relaxed' ? '轻松慢游' : '经典串游'}</p>
      <p className="support-plan-conditions">{profile.template === 'custom' ? interestLabels[profile.interest] : '经典固定主线'}{profile.date ? ` · ${profile.date} 出发` : ' · 日期待定'}</p>
      <details className="support-plan-budget"><summary><Wallet size={15} /><span>预算与房间参考<strong>· ¥{budget.total[0].toLocaleString()}–{budget.total[1].toLocaleString()}</strong></span><ChevronDown size={15} /></summary><div><p>全团预算预留，规划参考，非实时报价。</p><p>{budget.nights ? `住宿按 ${budget.rooms} 间双人房、${budget.nights} 晚预留；实际房型与儿童入住规则另核对。` : '当日往返，不计住宿费用；延住片区仅作参考。'}</p></div></details>
    </header>
    {budget.arrivalNight && <p className="support-plan-arrival">这条路线从完整游玩日开始，建议提前一晚抵达，住宿片区可先看{practical[days[0].cityId].stays[0].area}。预算已包含抵达前夜；若当天到达，请减少首日上午活动。</p>}
    <div className="support-plan-days" aria-label="每日吃住行安排">
      {days.map((day, index) => <details className="support-plan-day" key={`${day.cityId}-${day.originalIndex}-${index}`} open={index === 0}>
        <summary><span className="support-plan-day-number">第 {index + 1} 天</span><span className="support-plan-day-title">{day.title}{profile.date && <small>{planDate(profile.date, index)}</small>}</span><ChevronDown size={15} /></summary>
        <div className="support-plan-day-content">
          <ol className="support-plan-stops">{day.stops.map((stop, stopIndex) => <li key={`${stop.title}-${stopIndex}`}><span>{stop.time}</span><strong>{stop.title}</strong><p>{stop.detail}</p></li>)}</ol>
          <dl className="support-plan-day-practical">
            <div><dt><Route size={14} />怎么走</dt><dd>{day.transport}</dd></div>
            <div><dt><Utensils size={14} />这一餐</dt><dd>{day.meal}</dd></div>
            <div><dt><BedDouble size={14} />{index < days.length - 1 ? '这一晚' : '返程安排'}</dt><dd>{index < days.length - 1 ? day.overnight : `当日返程；若延住可参考：${day.overnight}`}</dd></div>
          </dl>
          <p className="support-plan-day-tip">出行提醒：{day.tip}</p>
        </div>
      </details>)}
    </div>
    <details className="support-plan-stay-guide"><summary><BedDouble size={15} /><span>住宿片区怎么选</span><ChevronDown size={15} /></summary><div>{cityIds.map(id => <section key={id}><h4>{cityById[id].shortName}</h4>{practical[id].stays.map(stay => <div className="support-plan-stay-area" key={stay.area}><strong>{stay.area}</strong><p>{stay.bestFor}。{stay.reason}</p><p>订前确认：{stay.check}</p></div>)}</section>)}</div></details>
    {profile.note && <p className="support-plan-personal-note"><strong>你的补充想法：</strong>{profile.note}</p>}
    <p className="support-plan-footnote">预算不含往返与跨城大交通、租车等费用。时段与接驳为编辑建议，预约、车船和住宿安排出发前再确认。</p>
  </section>;
}
