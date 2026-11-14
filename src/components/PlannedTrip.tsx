import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BedDouble, Bookmark, Check, CircleCheck, Copy, Download, Pencil, Route, Share2, Utensils, Wallet } from 'lucide-react';
import { cityById } from '../data';
import { arrivalLabels, getDepartureLabel, mobilityLabels, getTripIssues, buildTrip, budgetLabels, estimateBudget, formatDetailedPlan, groupLabels, sharePlanUrl, tripTitle, type Profile } from '../planning';
import { downloadPlan } from '../travel';
import { TripDays } from './TravelGuide';
import { FoodSuggestions, StaySuggestions } from './PracticalDetails';
import { ReturnDayEditor } from './ReturnDayEditor';
import { Button } from './ui';

export function PlannedTrip({ profile, onCopy, onSave, onEdit, onUpdateReturn }: { profile: Profile; onCopy: (text: string) => void; onSave: () => boolean; onEdit: () => void; onUpdateReturn: (profile: Profile) => void }) {
  const [tab, setTab] = useState('route');
  const [saveState, setSaveState] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const days = buildTrip(profile), budget = estimateBudget(profile, days.length), cityIds = [...new Set(days.map(day => day.cityId))];
  const lastDay = days.at(-1);
  const returnLabel = getDepartureLabel(profile);
  const returnScheduled = profile.departure && profile.departure !== 'flexible';
  const tabs = [{ id: 'route', label: '每日行程', count: days.length + ' 天', icon: Route }, { id: 'stay', label: '住在哪里', count: budget.nights + ' 晚', icon: BedDouble }, { id: 'food', label: '当地美食', count: cityIds.length + ' 城', icon: Utensils }, { id: 'budget', label: '预算预留', count: profile.party + ' 人', icon: Wallet }];
  const text = formatDetailedPlan(profile);
  const selectTab = (id: string) => {
    setTab(id);
    window.requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const checks = [
    { id: 'book', title: '预约和开放安排', detail: '逐一核对景区、展馆的预约、入场及当期开放安排。' },
    { id: 'move', title: profile.mode === 'drive' ? '停车与景区接驳' : '车站与返程接驳', detail: profile.mode === 'drive' ? '确认入口停车、景区内部交通；为山区转场与休息留余量。' : '核对车站、班次和末班接驳；山区先安排好返程交通。' },
    { id: 'stay', title: budget.nights ? '逐晚入住与退房' : '当天返程或延住', detail: budget.nights ? '按照每晚落脚处订房，查看取消政策与次日出发位置。' : '确认返程时间；若延住，按次日出发片区挑选酒店。' },
    { id: 'pace', title: profile.group === 'family' || profile.group === 'senior' ? '同行体力与午后休息' : '天气、行李与随身装备', detail: profile.group === 'family' || profile.group === 'senior' ? '台阶、步道和无障碍条件提前问清，必要时减少下午活动。' : '出发前查看官方天气与景区提示，再决定鞋服、雨具及行李寄存。' },
  ];
  return <div aria-label="我的具体旅行方案" className="planned-trip min-w-0">
    <header className="trip-summary">
      <p className="trip-summary-kicker"><Check size={15} />一份完整的湖北行程</p>
      <h3>{tripTitle(profile)}</h3>
      <div className="trip-summary-route" aria-label="行程城市">{cityIds.map((id, index) => <span key={id}>{index > 0 && <ArrowRight size={12} />}<strong>{cityById[id].shortName}</strong><small>{days.filter(day => day.cityId === id).length} 天</small></span>)}</div>
      <p className="trip-summary-conditions">{profile.date || '日期待定'} · {profile.party} 人 · {groupLabels[profile.group]} · {profile.mode === 'drive' ? '自驾出行' : '公共交通＋接驳'} · {profile.pace === 'relaxed' ? '轻松慢游' : '经典串游'}</p>
      {(profile.origin || profile.arrival || profile.mobility === 'gentle') && <p className="trip-summary-conditions">{profile.origin ? '从' + profile.origin + '出发 · ' : ''}{profile.arrival ? arrivalLabels[profile.arrival] + ' · ' : ''}{mobilityLabels[profile.mobility || 'standard']}</p>}
      <p className="trip-summary-conditions">{returnLabel}</p>
      {profile.budgetLimit && <p className="trip-summary-conditions">目标预算：{profile.budgetScope === 'per-person' ? '每人' : '全团'} ¥{profile.budgetLimit.toLocaleString()}，与本地规划预留比较。</p>}
      <div className="trip-summary-actions"><button onClick={() => setSaveState(onSave() ? '已保存到当前浏览器' : '保存失败，请下载清单')}><Bookmark size={14} />{saveState || '存到我的行程'}</button><button onClick={onEdit}><Pencil size={14} />调整条件</button></div>
      <div className="trip-summary-metrics"><span><strong>{days.length}</strong> 天行程</span><span><strong>{budget.nights}</strong> 晚住宿</span><span><strong>{cityIds.length}</strong> 座城市</span></div>
      <button className="trip-budget-preview" aria-label="查看预算明细" onClick={() => selectTab('budget')}><Wallet size={18} /><span>全团预算预留<strong>¥{budget.total[0].toLocaleString()}–{budget.total[1].toLocaleString()}</strong></span><span>看明细<ArrowUpRight size={14} /></span></button>
    </header>
    <div role="tablist" aria-label="旅行方案内容" className="trip-content-tabs">{tabs.map(item => <button role="tab" id={'plan-tab-' + item.id} aria-controls={'plan-panel-' + item.id} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onKeyDown={event => {
      const index = tabs.findIndex(t => t.id === tab);
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); selectTab(tabs[next].id); document.getElementById('plan-tab-' + tabs[next].id)?.focus(); }
    }} key={item.id} onClick={() => selectTab(item.id)}><item.icon size={16} /><span>{item.label}<small aria-hidden="true">{item.count}</small></span></button>)}</div>
    <div ref={panel} role="tabpanel" id={'plan-panel-' + tab} aria-labelledby={'plan-tab-' + tab} className="trip-tab-panel">
      {tab === 'route' && <>
        {lastDay?.afternoonReturn && <ReturnDayEditor day={lastDay} profile={profile} onApply={onUpdateReturn} />}
        {getTripIssues(profile).length > 0 && <div className="trip-reading-note"><strong>先核对这份安排的条件</strong><ul className="mt-2 list-disc space-y-1 pl-4">{getTripIssues(profile).map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
        {budget.arrivalNight && <p className="trip-reading-note">所选章节从完整游玩日开始，建议提前一晚抵达，住宿预算已加这一晚。若当天才到，首日上午改作交通并减少景点。</p>}
        <p className="trip-panel-description">每天围绕一片区域走。跨城日把上午留给交通；到得晚，就缩减当天下午的活动。</p>
        <TripDays days={days.map((day, i) => i < days.length - 1 ? day : {
          ...day, stayLabel: '返程安排', overnight: returnScheduled ? `${returnLabel}，当晚无住宿预留。` : `返程时段待定。如需延住，可参考${day.overnight}。`,
        })} date={profile.date} />
        <div className="trip-reading-note">每日安排与接驳是编辑建议，车程和班次没有实时计算。自选不连续章节时，住宿与第二天的出发地要再次核对。</div>
        {profile.note && <p className="trip-personal-note"><strong>我的备注：</strong>{profile.note}</p>}
      </>}
      {tab === 'stay' && <div className="space-y-8">
        <div className="trip-reading-note"><strong>{budget.nights ? budget.nights + ' 晚 · 建议 ' + budget.rooms + ' 间双人房' : '本次为当日往返，住宿片区供延住参考'}</strong><p>{budget.nights ? '筛选目标 ¥' + budget.roomRange.join('–') + ' / 间 / 晚，是「' + budgetLabels[profile.budget] + '」档位的预算范围，不代表实时房价。优先按每日路线选片区，再比较酒店。' : '先核对当天返程的车船或驾驶安排；如需延住，再按次日出发位置选择片区。'}</p></div>
        {budget.nights > 0 && <section aria-label="逐晚住宿安排"><h4 className="trip-content-title">每一晚，住在旅程顺路的地方</h4><ol className="trip-night-list">
          {budget.arrivalNight && <li><span>抵达前夜</span><div><strong>提前住在首个游玩片区</strong><p>预算已计入；以次日第一站的交通选择酒店。</p></div></li>}
          {days.slice(0, -1).map((day, i) => <li key={day.title}><span>第 {i + 1} 晚</span><div><strong>{day.overnight}</strong><p>{day.title}之后，订房前核对次日交通。</p></div></li>)}
        </ol></section>}
        {cityIds.map(id => <section key={id}><p className="trip-city-label">{cityById[id].shortName}</p><StaySuggestions city={cityById[id]} /></section>)}
      </div>}
      {tab === 'food' && <div className="space-y-8">
        <p className="trip-panel-description">按城市找地方风味，也按每天的路线安排一餐。营业与供应请在出发前核对。</p>
        <details className="trip-meal-index"><summary><Utensils size={16} />查看每日餐食安排<span>{days.length} 天</span></summary><ol>{days.map((day, index) => <li key={day.title}><span>第 {index + 1} 天 · {cityById[day.cityId].shortName}</span>{day.breakfast || day.lunch || day.dinner ? <><p><strong>早餐：</strong>{day.breakfast}</p><p><strong>午餐：</strong>{day.lunch}</p><p><strong>晚餐：</strong>{day.dinner}</p></> : <p>{day.meal}</p>}</li>)}</ol></details>
        {cityIds.map(id => <section key={id}><p className="trip-city-label">{cityById[id].shortName}</p><FoodSuggestions city={cityById[id]} /></section>)}
      </div>}
      {tab === 'budget' && <section>
        <p className="trip-city-label">把预算，先安排明白</p><h4 className="trip-budget-total">¥{budget.total[0].toLocaleString()}–{budget.total[1].toLocaleString()}</h4>
        <p className="trip-panel-description">{profile.party} 人全团的规划预留，按 {days.length} 天、{budget.rooms} 间双人房和 {budget.nights} 晚计算。</p>
        <div className="trip-budget-person">约 ¥{Math.floor(budget.total[0] / profile.party).toLocaleString()}–{Math.ceil(budget.total[1] / profile.party).toLocaleString()} / 人<span>用于比较出行方案，非实时报价</span></div>
        <div className="trip-budget-items">{[{ label: '住宿 · ' + budget.nights + ' 晚', range: budget.stay }, { label: '餐食 · 含三餐的预留', range: budget.meals }, { label: profile.mode === 'drive' ? '当地交通 · 油费与停车预留' : '当地交通 · 公交、打车与接驳预留', range: budget.transport }, { label: budget.ticketDays < days.length ? `景点项目 · 仅预留 ${budget.ticketDays} 天` : '景点门票与项目预留', range: budget.tickets }].map(item => <div key={item.label}><span>{item.label}</span><strong>¥{item.range.join('–')}</strong></div>)}</div>
        <p className="trip-reading-note">这是按预算档位计算的额度，未查询实时价格。不含出发地往返、跨城火车票、自驾租车费及超出预留的索道、船游等项目。节假日与房型变化会改变实际支出。</p>
      </section>}
    </div>
    <section aria-label="出发前核对清单" className="trip-departure-checks"><div><CircleCheck size={19} /><h4>出发前，再确认这几件事</h4><span>{checked.length} / {checks.length}</span></div><p>把预订和接驳核对好，路上更从容。</p><ul>{checks.map(item => <li key={item.id}><label><input type="checkbox" checked={checked.includes(item.id)} onChange={() => setChecked(previous => previous.includes(item.id) ? previous.filter(id => id !== item.id) : [...previous, item.id])} /><span><strong>{item.title}</strong><small>{item.detail}</small></span></label></li>)}</ul><small>勾选仅作本次检查，不写入保存、分享或下载清单。</small></section>
    <details className="trip-source-links"><summary>路线资料与预订前核对</summary><p>景点事实参考官方资料；片区选择、餐食组合、时间与预算为编辑规划建议，未查询实时库存或车程。</p><div>{cityIds.flatMap(id => cityById[id].sources).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}</div></details>
    <div className="trip-takeaway"><Button aria-label="复制清单" onClick={() => onCopy(text)} variant="neutral" className="whitespace-nowrap px-2 text-xs"><Copy size={15} /><span>复制<span className="hidden sm:inline">清单</span></span></Button><Button aria-label="下载行程" onClick={() => downloadPlan(text, '湖北具体')} className="whitespace-nowrap px-2 text-xs"><Download size={15} /><span>下载<span className="hidden sm:inline">行程</span></span></Button><Button aria-label="分享链接" onClick={() => onCopy(sharePlanUrl(profile))} variant="neutral" className="whitespace-nowrap px-2 text-xs"><Share2 size={15} /><span>分享<span className="hidden sm:inline">链接</span></span></Button></div>
  </div>;
}
