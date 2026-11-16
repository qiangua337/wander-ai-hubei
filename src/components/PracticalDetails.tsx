import { BedDouble, Utensils } from 'lucide-react';
import { type CityGuide } from '../data';
import { practical } from '../data/practical';
import { LocalFoodShops } from './LocalFoodShops';
import { PracticalMapLinks } from './PracticalMapLinks';

export function StaySuggestions({ city }: { city: CityGuide }) {
  return <section className="guide-practical-section" aria-label={`${city.shortName}住宿建议`}>
    <h3><BedDouble size={20} aria-hidden="true" />顺路住宿片区</h3>
    <div className="guide-practical-cards">
      {practical[city.id].stays.map(stay => <article key={stay.area} className="guide-practical-card">
        <h4>{stay.area}</h4>
        <p className="guide-practical-use">{stay.bestFor}</p>
        <p>{stay.reason}</p>
        <p className="guide-practical-note">{stay.check}</p>
        <PracticalMapLinks links={stay.mapLinks} />
      </article>)}
    </div>
  </section>;
}

export function FoodSuggestions({ city }: { city: CityGuide }) {
  return <>
    <section className="guide-practical-section" aria-label={`${city.shortName}美食建议`}>
      <h3><Utensils size={20} aria-hidden="true" />用餐片区和地方菜</h3>
      <div className="guide-practical-cards">
        {practical[city.id].food.map(food => <article key={food.area} className="guide-practical-card">
          <h4>{food.area}</h4>
          <p>{food.order}</p>
          <p className="guide-practical-note">{food.timing}</p>
          <PracticalMapLinks links={food.mapLinks} />
        </article>)}
      </div>
    </section>
    <LocalFoodShops cityId={city.id} />
  </>;
}
