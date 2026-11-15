import { ArrowRight, CalendarDays, MapPin, Repeat2, RotateCcw } from 'lucide-react';
import { adjustmentSummary, type VisitChoices } from '../visit-scheduling';
import type { VisitChange } from '../visit-changes';

export function VisitChangePanel({ choice, onChange }: { choice: VisitChoices; onChange: (change: VisitChange, dayIndex: number, undo?: boolean) => void }) {
  const { dayIndex, options, original, current } = choice;
  const returning = current?.returnTime || options.find(option => option.returnTime)?.returnTime;
  return <section className="visit-change-panel" aria-label="景点调整" tabIndex={-1}>
    <header><Repeat2 size={17} aria-hidden="true" /><h5>{current ? `已调整「${original}」` : `「${original}」还没排进这一天`}</h5></header>
    {current && <p className="visit-change-current">{current.change.to ? '已挪到' : '已换成'}{adjustmentSummary(current)}<button type="button" aria-label={`撤销${original}的调整`} onClick={() => onChange(current.change, dayIndex, true)}><RotateCcw size={14} />撤销</button></p>}
    {!current && !options.length && <p>这份行程暂时没有够用的同城空档。可提早出门，或保留当日时间表里的休整与接驳。</p>}
    {options.length > 0 && <ul>{options.map(option => {
      const moved = !!option.change.to;
      const Icon = moved ? CalendarDays : MapPin;
      const range = option.transportMinutes;
      return <li key={option.change.to || option.change.alternative}>
        <button type="button" aria-label={moved ? `挪到第 ${option.dayIndex + 1} 天` : `换成${option.visit}`}
          onClick={() => onChange(option.change, option.dayIndex)}>
          <Icon size={17} aria-hidden="true" />
          <span>
            <strong>{moved ? `挪到第 ${option.dayIndex + 1} 天` : `换成${option.visit}`}<small>{option.start}–{option.end}</small></strong>
            <span>{option.transport}{range && ` 预留 ${range[0] === range[1] ? range[0] : range.join('–')} 分钟。`}</span>
            {option.displaced && <span>原定的「{option.displaced}」让出这个时段。</span>}
          </span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </li>;
    })}</ul>}
    {returning && <p>返程日 {returning.leaveBy} 前去站，{returning.arriveBy} 前到站。</p>}
  </section>;
}
