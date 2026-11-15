import { MapPin } from 'lucide-react';
import { cityGroups } from '../discovery';
import { SelectField } from './ui';

export function CityPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <label className="catalogue-city-field" title="切换城市">
    <MapPin size={15} aria-hidden="true" />
    <SelectField aria-label="筛选目的地城市" value={value} onChange={event => onChange(event.target.value)}>
      <option value="all">湖北全境</option>
      <CityOptions />
    </SelectField>
  </label>;
}
export function CityOptions() {
  return <>{cityGroups.map(group => <optgroup key={group.area} label={group.area}>
    {group.cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}
  </optgroup>)}</>;
}
