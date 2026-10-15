import { cities, destinations } from '../data';
import { SelectField } from './ui';

const regions = [...new Set(cities.map(city => city.area))];

export function CityPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const directory = <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{regions.map(region => <div key={region} className="rounded-xl border border-line bg-white p-4"><p className="mb-3 text-[11px] font-semibold text-muted">{region}</p><div className="flex flex-wrap gap-2">{cities.filter(city => city.area === region).map(city => <button key={city.id} onClick={() => onChange(city.id)} aria-pressed={value === city.id} className={`min-h-10 rounded-lg px-3 text-xs transition ${value === city.id ? 'bg-pine text-white' : 'bg-cream text-ink hover:bg-sage'}`}>{city.shortName}<span className="ml-1.5 font-display text-[10px] opacity-60">{destinations.filter(place => place.cityId === city.id).length}</span></button>)}</div></div>)}</div>;
  return <div role="group" aria-label="按市州浏览" className="mt-7">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><button onClick={() => onChange('all')} aria-pressed={value === 'all'} className={`min-h-11 rounded-xl border px-4 text-xs font-semibold ${value === 'all' ? 'border-pine bg-pine text-white' : 'border-line bg-white text-pine'}`}>全部湖北 · {destinations.length} 个去处</button><span className="text-[11px] text-muted">按旅行区域分组 · 17 个市州</span></div>
    <div className="md:hidden"><SelectField aria-label="快速切换城市" value={value} onChange={event => onChange(event.target.value)}><option value="all">全部湖北</option>{regions.map(region => <optgroup label={region} key={region}>{cities.filter(city => city.area === region).map(city => <option value={city.id} key={city.id}>{city.shortName}</option>)}</optgroup>)}</SelectField><details className="mt-3"><summary className="min-h-10 cursor-pointer py-2 text-xs font-medium text-pine">展开区域城市目录</summary><div className="mt-2">{directory}</div></details></div>
    <div className="hidden md:block">{directory}</div>
  </div>;
}
