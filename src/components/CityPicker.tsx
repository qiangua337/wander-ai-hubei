import { MapPin } from 'lucide-react';
import { cities } from '../data';
import { SelectField } from './ui';

export function CityPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <label className="catalogue-city-field">
    <span><MapPin size={15} />目的地</span>
    <SelectField aria-label="筛选目的地城市" value={value} onChange={event => onChange(event.target.value)}>
      <option value="all">湖北全境</option>
      {cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}
    </SelectField>
  </label>;
}
