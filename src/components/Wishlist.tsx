import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronDown, Clock3, Heart, Landmark, MapPin, Mountain, Route, X } from 'lucide-react';
import { cityById, destinationById, type Destination } from '../data';
import { displayPhoto } from '../data/photos';
import type { Profile } from '../planning';
import { planWishlist } from '../wishlist-planning';
import { Modal, type ModalBack } from './Modal';
import { Button } from './ui';
import './wishlist.css';

export type WishlistView = { selection: string[]; expandedCities: string[]; scrollTop: number; focusId?: string };

type WishlistProps = {
  saved: string[];
  date: string;
  travelers: number;
  initialView?: WishlistView;
  onClose: () => void;
  back?: ModalBack;
  onOpenPlace: (place: Destination, view: WishlistView) => void;
  onRemove: (place: Destination) => void;
  onPlan: (profile: Profile, view: WishlistView) => void;
  onExplore: () => void;
};

export function Wishlist({ saved, date, travelers, initialView, onClose, back, onOpenPlace, onRemove, onPlan, onExplore }: WishlistProps) {
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState(() => new Set(initialView?.selection ?? saved));
  const [expandedCities, setExpandedCities] = useState(() => new Set(initialView?.expandedCities ?? []));
  const places = useMemo(() => [...new Set(saved)].flatMap(id => Object.hasOwn(destinationById, id) ? [destinationById[id]] : []), [saved]);
  const byCity = useMemo(() => {
    const grouped = new Map<string, Destination[]>();
    for (const place of places) grouped.set(place.cityId, [...(grouped.get(place.cityId) || []), place]);
    return grouped;
  }, [places]);
  const itineraryChoices = useMemo(() => [...byCity].map(([id, cityPlaces]) => {
    const selection = cityPlaces.filter(place => selected.has(place.id)).map(place => place.id);
    return { id, cityPlaces, selection, draft: planWishlist(id, selection, date, travelers) };
  }), [byCity, date, selected, travelers]);
  const cityIds = [...byCity.keys()];

  useEffect(() => {
    if (!initialView) return;
    const frame = window.requestAnimationFrame(() => {
      if (!root.current) return;
      const dialog = root.current.closest<HTMLElement>('[role="dialog"]');
      dialog?.scrollTo({ top: initialView.scrollTop, behavior: 'instant' });
      if (initialView.focusId) document.getElementById(`${prefix}-${initialView.focusId}`)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialView, prefix]);

  const currentView = (focusId: string): WishlistView => ({
    selection: places.filter(place => selected.has(place.id)).map(place => place.id),
    expandedCities: [...expandedCities],
    scrollTop: root.current?.closest<HTMLElement>('[role="dialog"]')?.scrollTop || 0,
    focusId,
  });
  const setSelection = (ids: string[], checked: boolean) => {
    setSelected(before => {
      const next = new Set(before);
      ids.forEach(id => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };
  const toggleDays = (id: string, open: boolean) => {
    setExpandedCities(before => {
      if (before.has(id) === open) return before;
      const next = new Set(before);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const remove = (place: Destination) => {
    setSelection([place.id], false);
    onRemove(place);
    setFeedback(`已从心愿单移除「${place.title}」。`);
    window.requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('.wishlist-place-open, .wishlist-empty button')?.focus({ preventScroll: true }));
  };

  return <Modal title="我的旅行心愿单" onClose={onClose} back={back} wide sheet dialogClassName="wishlist-dialog">
    <div ref={root} className="wishlist-content">
      <div className="wishlist-intro"><div><h3>从收藏开始排路线</h3><span>勾选这次想去的景点。同城景点按已有路线组合，可以一天顺路去的只排一天。</span></div><div className="wishlist-counts"><span><strong>{places.length}</strong> 个去处</span><span><strong>{cityIds.length}</strong> 座城市</span></div></div>
      <p role="status" aria-live="polite" className={'wishlist-feedback ' + (feedback ? 'has-message' : '')}>{feedback}</p>

      {places.length === 0 ? <div className="wishlist-empty"><span className="wishlist-empty-icon"><Heart size={32} strokeWidth={1.3} /></span><h3>还没有收藏景点</h3><p>可以先收藏几个想去的地方，再回来安排路线。</p><Button onClick={onExplore}>去发现湖北<ArrowUpRight size={17} /></Button></div> : <>
        {cityIds.length > 1 && <nav className="wishlist-city-nav" aria-label="按城市查看收藏">{itineraryChoices.map(({ id, cityPlaces }) => <button type="button" key={id} onClick={() => document.getElementById(`${prefix}-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><MapPin size={13} />{cityById[id].shortName}<span>{cityPlaces.length}</span><ArrowDown size={12} /></button>)}</nav>}
        <div className={'wishlist-cities ' + (cityIds.length > 1 ? 'has-multiple' : '')}>{itineraryChoices.map(({ id, cityPlaces, selection, draft }) => <section key={id} id={`${prefix}-${id}`} className="wishlist-city" aria-labelledby={`${prefix}-${id}-title`}>
          <div className="wishlist-city-heading">
            <div><p>{cityById[id].area}</p><h3 id={`${prefix}-${id}-title`}>{cityById[id].shortName}<span>已选 {selection.length} / {cityPlaces.length} 处</span></h3></div>
            <button type="button" className="wishlist-set-all" onClick={() => setSelection(cityPlaces.map(place => place.id), selection.length < cityPlaces.length)}>{selection.length === cityPlaces.length ? '取消全选' : '全选本城'}</button>
          </div>
          <div className="wishlist-plan-preview">
            <div className="wishlist-plan-summary">
              <div><Route size={19} aria-hidden="true" /><p role="status">{draft.profile ? <><strong>{draft.days.length} 天 · 已排 {draft.included.length} 处</strong><span>{draft.days.some(day => day.conditionalPlaceIds.length) ? '含可选景点，见分日安排' : '查看交通、吃住和出发时间'}</span></> : <strong>{selection.length ? '暂时无法排入' : '先选这次想去的景点'}</strong>}</p></div>
              {draft.profile && <Button className="wishlist-plan" id={`${prefix}-plan-${id}`} onClick={() => { if (draft.profile) onPlan(draft.profile, currentView(`plan-${id}`)); }}>查看行程<ArrowUpRight size={15} /></Button>}
            </div>
            {draft.days.length > 0 && <details className="wishlist-plan-days" open={expandedCities.has(id)} onToggle={event => toggleDays(id, event.currentTarget.open)}>
              <summary>查看分日安排<ChevronDown size={15} aria-hidden="true" /></summary>
              <ol>{draft.days.map((day, index) => <li key={day.chapter}><strong>第 {index + 1} 天</strong><span>{day.placeIds.map(placeId => destinationById[placeId].title + (day.conditionalPlaceIds.includes(placeId) ? '（可选）' : '')).join('、') || day.title}</span></li>)}</ol>
            </details>}
            {draft.skipped.length > 0 && <div className="wishlist-plan-skipped"><h4>暂未排入</h4><ul>{draft.skipped.map(item => <li key={item.id}>{destinationById[item.id]?.title || item.id} · {item.reason}</li>)}</ul></div>}
          </div>
          <div className={'wishlist-place-grid ' + (cityPlaces.length === 1 ? 'is-single' : '')}>{cityPlaces.map(place => <article key={place.id} className="wishlist-place">
            <button type="button" id={`${prefix}-place-${place.id}`} className="wishlist-place-open" aria-label={`查看${place.title}攻略`} onClick={() => onOpenPlace(place, currentView(`place-${place.id}`))}>
              <span className="wishlist-place-image">{place.image ? <img src={displayPhoto(place.image)} alt={place.imageAlt || place.title} width="180" height="224" loading="lazy" decoding="async" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} /> : <span aria-hidden="true">{place.category === 'nature' ? <Mountain size={30} strokeWidth={1.2} /> : <Landmark size={30} strokeWidth={1.2} />}<small>{place.category === 'nature' ? '山水自然' : '城市人文'}</small></span>}</span>
              <span className="wishlist-place-copy"><strong>{place.title}</strong><span className="wishlist-place-meta">{place.tag}<span><Clock3 size={12} />{place.duration}</span></span><span className="wishlist-place-description">{place.description}</span><span className="wishlist-read">查看攻略<ArrowUpRight size={14} /></span></span>
            </button>
            <label className="wishlist-choose-place"><input type="checkbox" checked={selected.has(place.id)} aria-label={`将${place.title}选入这次路线`} onChange={event => setSelection([place.id], event.currentTarget.checked)} />选入这次路线</label>
            <button type="button" className="wishlist-remove" aria-label={`移除${place.title}收藏`} onClick={() => remove(place)}><X size={16} /></button>
          </article>)}</div>
        </section>)}</div>
      </>}
      <p className="wishlist-storage-note">收藏保存在当前浏览器，换设备或清除浏览器数据后可能无法保留。</p>
    </div>
  </Modal>;
}
