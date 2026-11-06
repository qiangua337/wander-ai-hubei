import { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Clock3, Heart, Landmark, MapPin, Mountain, Route, X } from 'lucide-react';
import { cityById, destinationById, type Destination } from '../data';
import { Modal } from './Modal';
import { Button } from './ui';
import './wishlist.css';

type WishlistProps = {
  saved: string[];
  onClose: () => void;
  onOpenPlace: (place: Destination) => void;
  onRemove: (place: Destination) => void;
  onPlan: (cityId: string) => void;
  onExplore: () => void;
};

export function Wishlist({ saved, onClose, onOpenPlace, onRemove, onPlan, onExplore }: WishlistProps) {
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState('');
  const places = [...new Set(saved)].map(id => destinationById[id]).filter((place): place is Destination => Boolean(place));
  const cityIds = [...new Set(places.map(place => place.cityId))];
  const remove = (place: Destination) => {
    onRemove(place);
    setFeedback(`已从心愿单移除「${place.title}」。`);
    window.requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('.wishlist-place-open, .wishlist-empty button')?.focus({ preventScroll: true }));
  };

  return <Modal title="我的旅行心愿单" onClose={onClose} wide>
    <div ref={root} className="wishlist-content">
      <div className="wishlist-intro"><div><p><Heart size={15} />把喜欢的地方，留给下一次出发</p><h3>从心动，走到出发。</h3><span>先按城市看看想去哪里，再安排合适的天数与节奏。</span></div><div className="wishlist-counts"><span><strong>{places.length}</strong> 个去处</span><span><strong>{cityIds.length}</strong> 座城市</span></div></div>
      <p role="status" aria-live="polite" className={'wishlist-feedback ' + (feedback ? 'has-message' : '')}>{feedback}</p>

      {places.length === 0 ? <div className="wishlist-empty"><span className="wishlist-empty-icon"><Heart size={32} strokeWidth={1.3} /></span><h3>给下一次旅行，留几个心动。</h3><p>遇到喜欢的风景，点一下卡片上的爱心。<br />收藏后，就能在这里按城市慢慢安排。</p><Button onClick={onExplore}>去发现湖北<ArrowUpRight size={17} /></Button></div> : <>
        <div className="wishlist-note"><Route size={18} /><p>城市规划提供可调整的编辑路线，<strong>收藏地点不会自动全部排入行程。</strong>先读攻略，再按时间与体力取舍。</p></div>
        {cityIds.length > 1 && <nav className="wishlist-city-nav" aria-label="按城市查看收藏">{cityIds.map(id => <button type="button" key={id} onClick={() => document.getElementById(`${prefix}-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><MapPin size={13} />{cityById[id].shortName}<span>{places.filter(place => place.cityId === id).length}</span><ArrowDown size={12} /></button>)}</nav>}
        <div className={'wishlist-cities ' + (cityIds.length > 1 ? 'has-multiple' : '')}>{cityIds.map(id => <section key={id} id={`${prefix}-${id}`} className="wishlist-city" aria-labelledby={`${prefix}-${id}-title`}>
          <div className="wishlist-city-heading"><div><p>{cityById[id].area}</p><h3 id={`${prefix}-${id}-title`}>{cityById[id].shortName}<span>{places.filter(place => place.cityId === id).length} 个心动去处</span></h3></div><Button variant="neutral" onClick={() => onPlan(id)}><Route size={16} />规划{cityById[id].shortName}行程<ArrowUpRight size={15} /></Button></div>
          <div className={'wishlist-place-grid ' + (places.filter(place => place.cityId === id).length === 1 ? 'is-single' : '')}>{places.filter(place => place.cityId === id).map(place => <article key={place.id} className="wishlist-place">
            <button type="button" className="wishlist-place-open" aria-label={`查看${place.title}攻略`} onClick={() => onOpenPlace(place)}>
              <span className="wishlist-place-image">{place.image ? <img src={place.image} alt={place.imageAlt || place.title} width="180" height="224" loading="lazy" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /> : <span aria-hidden="true">{place.category === 'nature' ? <Mountain size={30} strokeWidth={1.2} /> : <Landmark size={30} strokeWidth={1.2} />}<small>{place.category === 'nature' ? '山水自然' : '城市人文'}</small></span>}</span>
              <span className="wishlist-place-copy"><strong>{place.title}</strong><span className="wishlist-place-meta">{place.tag}<span><Clock3 size={12} />{place.duration}</span></span><span className="wishlist-place-description">{place.description}</span><span className="wishlist-read">查看攻略<ArrowUpRight size={14} /></span></span>
            </button>
            <button type="button" className="wishlist-remove" aria-label={`移除${place.title}收藏`} onClick={() => remove(place)}><X size={16} /></button>
          </article>)}</div>
        </section>)}</div>
      </>}
      <p className="wishlist-storage-note">收藏保存在当前浏览器，换设备或清除浏览器数据后可能无法保留。</p>
    </div>
  </Modal>;
}
