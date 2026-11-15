import { ArrowUpRight, Compass } from 'lucide-react';
import { cityGroups, placesByCity } from '../discovery';

export function CityDirectory({ onChoose }: { onChoose: (cityId: string) => void }) {
  return <div className="city-index-grid" aria-label="湖北城市索引">
    {cityGroups.map(group => <section key={group.area} className="city-index-group">
      <h3><Compass size={17} aria-hidden="true" />{group.area}</h3>
      <ul>{group.cities.map(city => <li key={city.id}>
        <button type="button" onClick={() => onChoose(city.id)} aria-label={`查看${city.shortName}的景点`}>
          <strong>{city.shortName}</strong><span>{placesByCity[city.id].length} 处景点</span><ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </li>)}</ul>
    </section>)}
  </div>;
}
