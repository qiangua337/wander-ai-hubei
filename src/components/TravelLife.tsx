import { useState } from 'react';
import { ArrowUpRight, BedDouble, MapPin, TrainFront, Utensils } from 'lucide-react';
import { cities, cityById, cityPhotos } from '../data';
import { practical } from '../data/practical';
import { Button, SelectField } from './ui';

export function TravelLife({ fallbackCity, onExplore, onPlan }: { fallbackCity: string; onExplore: (cityId: string) => void; onPlan: (cityId: string) => void }) {
  const [chosenCity, setChosenCity] = useState('');
  const cityId = chosenCity || (Object.hasOwn(cityById, fallbackCity) ? fallbackCity : 'wuhan');
  const city = cityById[cityId];
  const photo = cityPhotos[cityId];
  const stay = practical[cityId].stays[0];
  const food = practical[cityId].food[0];

  return <section id="travel-life" aria-labelledby="life-title" className="life-section section-space">
    <div className="page-width">
      <div className="section-heading">
        <div><h2 id="life-title" className="section-title">湖北吃住交通指南</h2><p className="section-detail">住宿片区、地方味道和到达方式，按城市查。</p></div>
        <label className="life-city-select"><span><MapPin size={15} />切换城市</span><SelectField aria-label="吃住指南城市" value={cityId} onChange={event => setChosenCity(event.target.value)}>{cities.map(item => <option value={item.id} key={item.id}>{item.shortName}</option>)}</SelectField></label>
      </div>

      <div role="region" aria-label={`${city.shortName}吃住交通`} className={'life-panel' + (photo?.filename ? ' has-photo' : '')}>
        {photo?.filename && <figure className="life-photo"><img key={cityId} src={cityId === 'enshi' ? '/images/enshi-card.webp' : cityId === 'yichang' ? '/images/xiling-cover-768.webp' : `/images/${photo.filename}`} alt={photo.alt || photo.subject} width="800" height="1000" loading="lazy" /><figcaption><MapPin size={14} />{city.shortName} · {photo.subject}</figcaption></figure>}
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
