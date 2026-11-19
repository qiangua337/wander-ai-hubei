import { useId, useState } from 'react';
import { ArrowRight, BedDouble, Check, ChevronDown, Clock3, Footprints, MapPin, TrainFront, Utensils } from 'lucide-react';
import { buildTrip, defaultProfile, templates } from '../planning';
import { buildDaySchedule, groupLodging, scheduleDuration } from '../day-schedule';
import { cityById, cityPhotos } from '../data';
import { displayPhoto, editorialPhotos } from '../data/photos';
import './route-atlas.css';

const routeCovers = {
  'wuhan-weekend': { name: '武汉周末', cityId: 'wuhan', photo: editorialPhotos.yellowCrane },
  'west-five': { name: '峡江与恩施', cityId: 'enshi', photo: editorialPhotos.enshi },
  'hubei-seven': { name: '湖北一周', cityId: 'yichang', photo: editorialPhotos.dam },
};

const routeOptions = templates.map(template => {
  const profile = { ...defaultProfile(template.cityId), template: template.id };
  const days = buildTrip(profile);
  const cover = routeCovers[template.id as keyof typeof routeCovers];
  const photo = cover?.photo || cityPhotos[template.cityId];
  return {
    template, profile, days, photo,
    name: cover?.name || template.title,
    photoCityId: cover?.cityId || template.cityId,
    image: displayPhoto(photo ? `/images/${photo.filename}` : template.image, true),
    lodging: groupLodging(days),
    transferDays: days.filter(day => day.transfer).length,
    mountainDays: days.filter(day => day.effort === 'high').length,
  };
});

export function RouteTemplates({ onChoose }: { onChoose: (templateId: string, dayIndex: number) => void }) {
  const prefix = useId();
  const [choice, setChoice] = useState({ templateIndex: 0, dayIndex: 0 });
  const { template, profile, days, photo, photoCityId, image, lodging, transferDays, mountainDays } = routeOptions[choice.templateIndex];
  const { dayIndex } = choice;
  const day = days[dayIndex];
  const lastDay = dayIndex === days.length - 1;
  const schedule = buildDaySchedule(day, profile, days[dayIndex - 1], lastDay);
  const firstLeg = schedule.rows.find(row => row.kind === 'move');
  const preview = schedule.rows.filter(row => row === firstLeg || row.kind === 'visit' || row.meal === '午餐').slice(0, 4);
  const dinner = schedule.rows.find(row => row.meal === '晚餐');

  return <section id="routes" aria-labelledby="routes-title" className="route-editorial route-atlas">
    <div className="page-width">
      <div className="section-heading"><div><h2 id="routes-title" className="section-title">湖北经典路线</h2><p className="section-detail">从武汉周末到湖北一周，先比天数和转场，再看每天怎么走、在哪吃住。</p></div></div>
      <div className="route-layout">
        <div className="route-selector" role="group" aria-label="选择经典路线">
          {routeOptions.map((option, index) => {
            const selected = choice.templateIndex === index;
            return <button type="button" key={option.template.id} aria-pressed={selected} aria-controls={prefix + '-preview'} onClick={() => setChoice(current => current.templateIndex === index ? current : { templateIndex: index, dayIndex: 0 })}>
              <span className="route-selector-duration"><b>{option.days.length}</b> 天 <span>· {option.days.length - 1} 晚</span></span>
              {selected && <Check className="route-selector-check" size={16} aria-hidden="true" />}
              <strong>{option.name}</strong>
              <span className="route-selector-cities">{option.template.segments.map(segment => segment.cityId === 'enshi' ? '恩施' : cityById[segment.cityId].shortName).join(' → ')}</span>
              <span className="route-selector-meta">{option.transferDays ? `${option.transferDays} 次市州间转场` : '市内游，无跨城转场'}{option.mountainDays > 0 && <span> · 含山地游览</span>}</span>
            </button>;
          })}
        </div>
        <div className="route-preview" id={prefix + '-preview'}>
          <figure className="route-preview-photo" data-city={photoCityId}>
            <img key={image} src={image} alt={photo?.alt || photo?.subject || '湖北实景'} width="800" height="580" loading="lazy" decoding="async" />
            <figcaption><p className="route-preview-location"><MapPin size={14} aria-hidden="true" />{cityById[photoCityId].shortName} · {photo?.subject}</p><h3>{template.title.replace(/。$/, '')}</h3><p>{template.subtitle}</p></figcaption>
          </figure>
          <div className="route-preview-content">
            <ul className="route-profile" aria-label="路线强度与交通">
              <li><TrainFront size={15} aria-hidden="true" />{transferDays ? '跨市州铁路＋当地接驳' : '城区公交、地铁与步行'}</li>
              <li><Footprints size={15} aria-hidden="true" />{mountainDays ? `${mountainDays} 天高强度山地` : '以城区步行为主'}</li>
            </ul>
            <div className="route-preview-days" role="group" aria-label="预览路线的某一天">
              {days.map((item, index) => <button type="button" key={index} aria-pressed={index === dayIndex} aria-controls={prefix + '-day'} aria-label={`预览第 ${index + 1} 天 · ${cityById[item.cityId].shortName}`} onClick={() => setChoice(current => ({ ...current, dayIndex: index }))}>第 {index + 1} 天</button>)}
            </div>
            <div id={prefix + '-day'} className="route-preview-day" aria-live="polite">
              <h4>{day.transfer ? `${day.transfer} · 接驳日` : schedule.title || day.title}</h4>
              <p className="route-preview-start"><Clock3 size={15} aria-hidden="true" /><strong>{schedule.start}</strong><span>{schedule.from}</span></p>
              <ol className="route-preview-stops">
                {preview.map(row => {
                  const duration = scheduleDuration(row);
                  const detail = row.kind === 'move' || row.meal === '午餐' ? row.detail?.split('。')[0] : undefined;
                  return <li key={row.title}>
                    <span className="route-preview-time">{row.time ? <time dateTime={row.time}>{row.time}</time> : row.phase}</span>
                    <span><strong>{row.title}</strong>{row.optional && <span className="route-optional">可选</span>}{detail && <small>{detail}</small>}</span>
                    {duration && <span className="route-preview-duration">{duration}</span>}
                  </li>;
                })}
              </ol>
              <div className="route-preview-ending">
                {dinner && <p><Utensils size={16} aria-hidden="true" /><span><strong>{dinner.time ? `${dinner.time} · ` : ''}{dinner.title}</strong>{dinner.detail && <small>{dinner.detail}</small>}</span></p>}
                <p className="route-preview-stay"><BedDouble size={17} aria-hidden="true" /><span>{lastDay ? '延住参考' : '这一晚住'} <strong>{day.overnight.split(/[；（]/, 1)[0]}</strong></span></p>
              </div>
            </div>
            <div className="route-preview-actions">
              <button type="button" className="route-preview-use" onClick={() => onChoose(template.id, dayIndex)}>按这条路线规划<ArrowRight size={17} aria-hidden="true" /></button>
              <details key={template.id} className="route-lodging">
                <summary><BedDouble size={16} aria-hidden="true" />查看全程住宿<ChevronDown size={15} aria-hidden="true" /></summary>
                <ul>{lodging.map(block => <li key={block.firstNight}><span>第 {block.firstNight}{block.firstNight !== block.lastNight ? `–${block.lastNight}` : ''} 晚</span><strong>{block.area}</strong></li>)}</ul>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
