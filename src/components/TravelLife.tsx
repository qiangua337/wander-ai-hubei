import { useId, useState } from 'react';
import { ArrowUpRight, BedDouble, MapPin, TrainFront, Utensils } from 'lucide-react';
import { cityById, cityPhotos } from '../data';
import { practical } from '../data/practical';
import { Button } from './ui';

const lifeCities = ['wuhan', 'yichang', 'enshi'] as const;
type LifeCity = typeof lifeCities[number];

export function TravelLife({ onExplore, onPlan }: { onExplore: (cityId: string) => void; onPlan: (cityId: string) => void }) {
  const [cityId, setCityId] = useState<LifeCity>('wuhan');
  const prefix = useId();
  const city = cityById[cityId];
  const photo = cityPhotos[cityId];
  const stay = practical[cityId].stays[0];
  const food = practical[cityId].food[0];

  return <section id="travel-life" aria-labelledby="life-title" className="life-section section-space">
    <div className="page-width">
      <div className="section-heading">
        <div><p className="eyebrow">旅途里的日常</p><h2 id="life-title" className="section-title">住得顺路，吃得地道。</h2></div>
        <p className="section-aside">一晚安稳的落脚处，一顿合胃口的饭。<br />让行程里的每一天，都有着落。</p>
      </div>

      <div role="tablist" aria-label="吃住行城市选择" className="life-tabs">
        {lifeCities.map((id, index) => <button key={id} type="button" role="tab" id={`${prefix}-tab-${id}`} aria-controls={`${prefix}-panel`} aria-selected={cityId === id} tabIndex={cityId === id ? 0 : -1} onClick={() => setCityId(id)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % lifeCities.length : event.key === 'ArrowLeft' ? (index + lifeCities.length - 1) % lifeCities.length : event.key === 'Home' ? 0 : event.key === 'End' ? lifeCities.length - 1 : -1;
          if (next >= 0) { event.preventDefault(); setCityId(lifeCities[next]); document.getElementById(`${prefix}-tab-${lifeCities[next]}`)?.focus(); }
        }}>{cityById[id].shortName}</button>)}
      </div>

      <div id={`${prefix}-panel`} role="tabpanel" aria-labelledby={`${prefix}-tab-${cityId}`} className="life-panel">
        {photo?.filename && <figure className="life-photo"><img key={cityId} src={`/images/${photo.filename}`} alt={photo.alt || photo.subject} width="800" height="1000" loading="lazy" /><figcaption><MapPin size={14} /><span>{city.shortName} · {photo.subject}<small>城市印象</small></span></figcaption></figure>}
        <div className="life-content">
          <div className="life-notes">
            <article className="life-note">
              <p className="life-note-label"><BedDouble size={18} />今晚住哪里</p>
              <h3>{stay.area}</h3>
              <p className="life-best-for">适合：{stay.bestFor}</p>
              <p>{stay.reason}</p>
              <p className="life-timing">订前看一眼：{stay.check}</p>
            </article>
            <article className="life-note">
              <p className="life-note-label"><Utensils size={18} />这一餐吃什么</p>
              <h3>{food.area}</h3>
              <p>{food.order}</p>
              <p className="life-timing">顺路安排：{food.timing}</p>
            </article>
          </div>
          <div className="life-arrival"><TrainFront size={18} /><p><strong>怎么到、怎么走</strong>{city.arrival}</p></div>
          <div className="life-actions"><Button onClick={() => onPlan(cityId)}>安排{city.shortName}吃住行<ArrowUpRight size={16} /></Button><Button variant="neutral" onClick={() => onExplore(cityId)}>继续探索{city.shortName}<ArrowUpRight size={16} /></Button></div>
          <p className="life-footnote">片区与餐食为编辑建议；房价、供餐和交通接驳请在出发前确认。</p>
        </div>
      </div>
    </div>
  </section>;
}
