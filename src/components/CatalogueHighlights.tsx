import { useState } from 'react';
import { ArrowUpRight, Copy, History, MapPin, Route } from 'lucide-react';
import { cityById, cityPhotos, destinationById, type CityGuide, type Destination } from '../data';
import { displayPhoto } from '../data/photos';
import { placesByCity } from '../discovery';
import { Button, InputField } from './ui';

export function RecentlyViewed({ ids, onOpen, onClear }: {
  ids: string[];
  onOpen: (place: Destination) => void;
  onClear: () => void;
}) {
  if (!ids.length) return null;
  return <section className="catalogue-recent" aria-labelledby="recent-places-title">
    <div className="catalogue-recent-heading">
      <h3 id="recent-places-title"><History size={18} aria-hidden="true" />最近看过</h3>
      <button type="button" onClick={onClear} aria-label="清除最近看过的景点">清除记录</button>
    </div>
    <ul>{ids.map(id => {
      const place = destinationById[id];
      return <li key={id}><button type="button" onClick={() => onOpen(place)}>
        <span><small>{cityById[place.cityId].shortName}</small><strong>{place.title}</strong></span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </button></li>;
    })}</ul>
  </section>;
}

export function CatalogueCityHeader({ city, onGuide, onPlan }: { city: CityGuide; onGuide: () => void; onPlan: () => void }) {
  const photo = cityPhotos[city.id];
  return <div className="catalogue-city-guide">
    {photo?.filename && <img src={displayPhoto('/images/' + photo.filename)} alt="" loading="lazy" decoding="async" width="112" height="90" />}
    <div className="catalogue-city-copy">
      <div><strong>{city.shortName}</strong><span>{placesByCity[city.id].length} 处去处</span></div>
      <p>{city.tagline}</p>
    </div>
    <div className="catalogue-city-cta">
      <button type="button" onClick={onGuide}><MapPin size={16} aria-hidden="true" />城市攻略</button>
      <button type="button" onClick={onPlan}><Route size={16} aria-hidden="true" />规划{city.shortName}行程</button>
    </div>
  </div>;
}

export function CatalogueSharePanel({ link }: { link: string }) {
  const [status, setStatus] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('链接已复制');
    } catch {
      setStatus('请选中下方链接手动复制');
    }
  };
  return <div className="catalogue-share-panel">
    <p>对方打开链接即可查看这份目录和筛选条件。最近浏览和收藏记录只保存在你的浏览器里。</p>
    <label>目录链接<InputField readOnly value={link} onFocus={event => event.currentTarget.select()} /></label>
    <Button onClick={() => void copy()}><Copy size={16} aria-hidden="true" />复制链接</Button>
    <p role="status">{status}</p>
  </div>;
}
