import { useState } from 'react';
import { ArrowDown, BedDouble, ChevronDown, MapPin, TrainFront, Utensils } from 'lucide-react';
import { cityById, cityPhotos } from '../data';
import { practical } from '../data/practical';
import { displayPhoto, editorialPhotos } from '../data/photos';
import { Button, SelectField } from './ui';
import { CityOptions } from './CityPicker';
import { LocalFoodShops } from './LocalFoodShops';
import { PracticalMapLinks } from './PracticalMapLinks';
import { localFoodShops } from '../data/food-shops';

export function TravelLife({ fallbackCity, onExplore, onPlan }: { fallbackCity: string; onExplore: (cityId: string) => void; onPlan: (cityId: string) => void }) {
  const [chosenCity, setChosenCity] = useState('');
  const cityId = chosenCity || (Object.hasOwn(cityById, fallbackCity) ? fallbackCity : 'wuhan');
  const city = cityById[cityId];
  const photo = cityId === 'wuhan' ? editorialPhotos.noodles : cityPhotos[cityId];
  const [stay, ...otherStays] = practical[cityId].stays;
  const [food, ...otherFood] = practical[cityId].food;
  const shopCount = localFoodShops[cityId]?.length || 0;

  return <section id="travel-life" aria-labelledby="life-title" className="life-section section-space">
    <div className="page-width">
      <div className="section-heading">
        <div><h2 id="life-title" className="section-title">湖北吃住交通指南</h2><p className="section-detail">按城市看住宿、当地菜和到达方式，直接打开对应片区的地图。</p></div>
        <label className="life-city-select"><span><MapPin size={15} />切换城市</span><SelectField aria-label="吃住指南城市" value={cityId} onChange={event => setChosenCity(event.target.value)}><CityOptions /></SelectField></label>
      </div>

      <div role="group" aria-label="快速查看吃住城市" className="life-city-picks">
        {Object.keys(localFoodShops).map(id => <button type="button" key={id} aria-pressed={cityId === id} onClick={() => setChosenCity(id)}>
          {cityById[id].shortName}
        </button>)}
      </div>
      <div key={cityId} role="region" aria-label={`${city.shortName}吃住交通`} className={'life-panel' + (photo?.filename ? ' has-photo' : '')}>
        {photo?.filename && <figure className="life-photo"><img key={cityId} src={displayPhoto(`/images/${photo.filename}`)} alt={photo.alt || photo.subject} width="800" height="900" loading="lazy" decoding="async" /><figcaption><MapPin size={14} />{cityId === 'wuhan' ? photo.subject : `${city.shortName} · ${photo.subject}`}</figcaption></figure>}
        <div className="life-content">
          <div className="life-notes">
            <article className="life-note">
              <p className="life-note-label"><BedDouble size={18} />住宿片区</p>
              <h3>{stay.area}</h3>
              <p className="life-best-for">{stay.bestFor}</p>
              <p>{stay.reason}</p>
              <p className="life-timing">{stay.check}</p>
              <PracticalMapLinks links={stay.mapLinks} />
            </article>
            <article className="life-note">
              <p className="life-note-label"><Utensils size={18} />地方味道</p>
              <h3>{food.area}</h3>
              <p>{food.order}</p>
              <p className="life-timing">{food.timing}</p>
              <PracticalMapLinks links={food.mapLinks} />
            </article>
          </div>
          {(otherStays.length > 0 || otherFood.length > 0) && <div className="life-more-options">
            {otherStays.length > 0 && <details>
              <summary><BedDouble size={16} aria-hidden="true" /><span>比较其他住宿片区</span><small>{otherStays.length} 处</small><ChevronDown size={15} aria-hidden="true" /></summary>
              <ul>{otherStays.map(option => <li key={option.area}><h4>{option.area}</h4><p>{option.bestFor}。{option.reason}</p><p>{option.check}</p><PracticalMapLinks links={option.mapLinks} /></li>)}</ul>
            </details>}
            {otherFood.length > 0 && <details>
              <summary><Utensils size={15} aria-hidden="true" /><span>看看更多吃法和片区</span><small>{otherFood.length} 处</small><ChevronDown size={15} aria-hidden="true" /></summary>
              <ul>{otherFood.map(option => <li key={option.area}><h4>{option.area}</h4><p>{option.order}</p><p>{option.timing}</p><PracticalMapLinks links={option.mapLinks} /></li>)}</ul>
            </details>}
          </div>}
          <div className="life-arrival"><TrainFront size={18} /><p><strong>怎么到、怎么走</strong>{city.arrival}</p></div>
          <div className="life-actions"><Button onClick={() => onPlan(cityId)}>请小游排{city.shortName}行程</Button><Button variant="neutral" onClick={() => onExplore(cityId)}>继续探索{city.shortName}</Button>
            {shopCount > 0 && <a href="#life-shop-list" className="life-shop-jump">看 {shopCount} 家具体店铺<ArrowDown size={15} aria-hidden="true" /></a>}
          </div>
          <p className="life-footnote">片区与餐食为编辑建议；房价、供餐和交通接驳请在出发前确认。</p>
        </div>
      </div>
      {shopCount > 0 && <div id="life-shop-list"><LocalFoodShops key={cityId} cityId={cityId} /></div>}
    </div>
  </section>;
}
