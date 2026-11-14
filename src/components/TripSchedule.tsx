import { useId, useState } from 'react';
import { ArrowRight, BedDouble, Clock3, Footprints, Route, Utensils } from 'lucide-react';
import { buildDaySchedule, groupLodging, scheduleDuration } from '../day-schedule';
import type { PlannedDay, Profile } from '../planning';
import { planDate } from '../travel';
import { ReturnDayEditor } from './ReturnDayEditor';
import './trip-schedule.css';

const rowStyle = {
  move: { icon: Route, label: '交通' },
  visit: { icon: Footprints, label: '游览' },
  meal: { icon: Utensils, label: '用餐' },
  stay: { icon: BedDouble, label: '行李与住宿' },
};

export function TripSchedule({ days, profile, onUpdateReturn, initialDay }: {
  days: PlannedDay[]; profile: Profile; onUpdateReturn: (profile: Profile) => void; initialDay?: 'last';
}) {
  const prefix = useId();
  const [selected, setSelected] = useState(initialDay === 'last' ? days.length - 1 : 0);
  const day = days[selected];
  if (!day) return null;
  const isLast = selected === days.length - 1;
  const schedule = buildDaySchedule(day, profile, days[selected - 1], isLast);
  const lodging = groupLodging(days);
  const date = planDate(profile.date, selected);

  return <section className="trip-schedule" aria-label="逐日时间表">
    <header className="trip-schedule-heading">
      <h3>逐日时间表</h3>
      <p>接驳按预留时间的上限排，留出等车和步行的余量。</p>
    </header>
    {lodging.length > 0 && <div className="trip-lodging-overview">
      <strong><BedDouble size={17} />住宿怎么安排</strong>
      <ul>{lodging.map(block => <li key={block.firstNight}>
        <span>{block.firstNight === block.lastNight ? `第 ${block.firstNight} 晚` : `第 ${block.firstNight}–${block.lastNight} 晚连住`}</span>
        <strong>{block.area}</strong>
      </li>)}</ul>
    </div>}
    {days.length > 1 && <div className="trip-schedule-tabs" role="tablist" aria-label="选择行程天数">
      {days.map((item, index) => <button
        type="button" key={index} role="tab" id={`${prefix}-day-${index}`}
        aria-selected={selected === index} aria-controls={`${prefix}-day-panel`} aria-label={`第 ${index + 1} 天 · ${item.title}`}
        tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % days.length : event.key === 'ArrowLeft' ? (index + days.length - 1) % days.length : event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : -1;
          if (next >= 0) {
            event.preventDefault();
            setSelected(next);
            document.getElementById(`${prefix}-day-${next}`)?.focus();
          }
        }}
      >第 {index + 1} 天</button>)}
    </div>}
    <div id={`${prefix}-day-panel`} role={days.length > 1 ? 'tabpanel' : undefined} aria-labelledby={days.length > 1 ? `${prefix}-day-${selected}` : undefined} className="trip-schedule-panel">
      <header className="trip-schedule-day">
        <span>第 {selected + 1} 天{date && ` · ${date}`}</span>
        <h4>{day.title}</h4>
        <p>{schedule.headline}</p>
        <div><Clock3 size={16} /><strong>{schedule.start}</strong><span>{schedule.from}</span></div>
        {schedule.note && <p>{schedule.note}</p>}
      </header>
      {day.afternoonReturn && <ReturnDayEditor day={day} profile={profile} onApply={onUpdateReturn} />}
      <ol className="trip-schedule-rows">
        {schedule.rows.map((row, index) => {
          const { icon: Icon, label } = rowStyle[row.kind];
          const duration = scheduleDuration(row);
          return <li key={index} className={`schedule-row schedule-${row.kind}`}>
            <div className={'schedule-time' + (row.time ? ' has-clock' : '')}>
              {row.time ? <><time dateTime={row.time}>{row.time}</time>{row.deadline && <small>前</small>}</> : row.phase}
            </div>
            <div className="schedule-row-icon"><Icon size={17} strokeWidth={1.6} aria-label={label} /></div>
            <div className="schedule-row-body">
              <h5>{row.title}{row.optional && <span className="schedule-option">可选</span>}</h5>
              {duration && <span className="schedule-duration">{row.kind === 'move' ? '预留 ' : '约 '}{duration}</span>}
              {row.detail && <p>{row.detail}</p>}
            </div>
          </li>;
        })}
      </ol>
      <details className="trip-schedule-notes">
        <summary>行前提醒与资料<ArrowRight size={15} /></summary>
        <p>{day.tip}</p>
        <p>{day.transport}</p>
        {schedule.sources.length > 0 && <ul>{schedule.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>}
      </details>
    </div>
    <p className="trip-schedule-foot">时间为规划预留。车船班次、景区开放与实际路况请以票面及出发当天的官方信息为准。</p>
  </section>;
}
