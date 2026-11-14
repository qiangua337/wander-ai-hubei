import { useId, useState } from 'react';
import { ArrowRight, BedDouble, Clock3, MapPin } from 'lucide-react';
import { buildTrip, defaultProfile, templates } from '../planning';
import { buildDaySchedule, scheduleDuration } from '../day-schedule';
import { cityById, cityPhotos } from '../data';

export function RouteTemplates({ onChoose }: { onChoose: (templateId: string, dayIndex: number) => void }) {
  const prefix = useId();
  const [choice, setChoice] = useState({ templateIndex: 0, dayIndex: 0 });
  const template = templates[choice.templateIndex];
  const { dayIndex } = choice;
  const profile = { ...defaultProfile(template.cityId), template: template.id };
  const days = buildTrip(profile);
  const day = days[dayIndex];
  const lastDay = dayIndex === days.length - 1;
  const schedule = buildDaySchedule(day, profile, days[dayIndex - 1], lastDay);
  const firstLeg = schedule.rows.find(row => row.kind === 'move');
  const preview = schedule.rows.filter(row => row === firstLeg || row.kind === 'visit' || row.meal === '午餐').slice(0, 4);
  const photo = cityPhotos[template.cityId];
  const image = template.cityId === 'enshi' ? '/images/enshi-card.webp' : template.cityId === 'yichang' ? '/images/xiling-cover-768.webp' : template.image;

  return <section id="routes" aria-labelledby="routes-title" className="route-editorial">
    <div className="page-width">
      <div className="section-heading"><div><h2 id="routes-title" className="section-title">湖北经典路线</h2><p className="section-detail">从武汉周末两日到湖北七日游。选一天，就能看当日怎么走、在哪吃、住哪里。</p></div></div>
      <div className="route-selector" role="group" aria-label="选择经典路线">
        {templates.map((option, index) => {
          const total = option.segments.reduce((sum, segment) => sum + segment.indices.length, 0);
          return <button type="button" key={option.id} aria-pressed={choice.templateIndex === index} aria-controls={prefix + '-preview'} onClick={() => setChoice(current => current.templateIndex === index ? current : { templateIndex: index, dayIndex: 0 })}>
            <strong>{option.segments.map((segment, segmentIndex) => <span key={segment.cityId}>{segmentIndex > 0 && ' · '}{segment.cityId === 'enshi' ? '恩施' : cityById[segment.cityId].shortName}</span>)}</strong>
            <span>{total} 天</span>
          </button>;
        })}
      </div>
      <div className="route-preview" id={prefix + '-preview'}>
        <figure className="route-preview-photo" data-city={template.cityId}>
          <img key={image} src={image} alt={photo?.alt || photo?.subject || '湖北实景'} width="800" height="580" loading="lazy" decoding="async" />
          <figcaption><p className="route-preview-location"><MapPin size={14} />{cityById[template.cityId].shortName} · {photo?.subject}</p><h3>{template.title.replace(/。$/, '')}</h3><p>{template.subtitle}</p></figcaption>
        </figure>
        <div className="route-preview-content">
          <div className="route-preview-days" role="group" aria-label="预览路线的某一天">
            {days.map((item, index) => <button type="button" key={index} aria-pressed={index === dayIndex} aria-controls={prefix + '-day'} aria-label={`预览第 ${index + 1} 天 · ${cityById[item.cityId].shortName}`} onClick={() => setChoice(current => ({ ...current, dayIndex: index }))}>第 {index + 1} 天</button>)}
          </div>
          <div id={prefix + '-day'} className="route-preview-day" aria-live="polite">
            <h4>{day.transfer ? `${day.transfer} · 接驳日` : day.title}</h4>
            <p className="route-preview-start"><Clock3 size={15} /><strong>{schedule.start}</strong><span>{schedule.from}</span></p>
            <ol className="route-preview-stops">
              {preview.map(row => {
                const duration = scheduleDuration(row);
                const detail = row.kind === 'move' || row.meal === '午餐' ? row.detail?.split('。')[0] : undefined;
                return <li key={row.title}>
                  <span className="route-preview-time">{row.time ? <time dateTime={row.time}>{row.time}</time> : row.phase}</span>
                  <span><strong>{row.title}</strong>{detail && <small>{detail}</small>}</span>
                  {duration && <span className="route-preview-duration">{duration}</span>}
                </li>;
              })}
            </ol>
            <p className="route-preview-stay"><BedDouble size={15} /><span>{lastDay ? '延住参考' : '这一晚住'} <strong>{day.overnight.split(/[；（]/, 1)[0]}</strong></span></p>
          </div>
          <button type="button" className="route-preview-use" onClick={() => onChoose(template.id, dayIndex)}>使用这条路线<ArrowRight size={17} /></button>
        </div>
      </div>
    </div>
  </section>;
}
