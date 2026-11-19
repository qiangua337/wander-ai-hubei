import { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { SelectField } from './ui';
import { CityPicker } from './CityPicker';
import type { DestinationSort } from '../discovery';
import './explore-refinement.css';

type Selection = { id: string; label: string; onRemove: () => void };
export function ExploreSummary({ cityId, count, order, onOrder, selections, onChangeCity, onReset, onFilters }: {
  cityId: string; count: number; order: DestinationSort; onOrder: (order: DestinationSort) => void;
  selections: Selection[]; onChangeCity: (id: string) => void; onReset: () => void; onFilters: () => void;
}) {
  const panelId = useId();
  const summary = useRef<HTMLDivElement>(null);
  const filterButton = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const hasSelections = selections.length > 0;
  const panelOpen = expanded && hasSelections;

  useEffect(() => {
    if (!panelOpen) return;
    const closeFromOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !summary.current?.contains(event.target)) setExpanded(false);
    };
    window.addEventListener('pointerdown', closeFromOutside);
    return () => window.removeEventListener('pointerdown', closeFromOutside);
  }, [panelOpen]);

  const openFilters = () => {
    setExpanded(false);
    onFilters();
  };

  const removeFilter = (onRemove: () => void, closePanel: boolean) => {
    if (closePanel) setExpanded(false);
    onRemove();
    filterButton.current?.focus({ preventScroll: true });
  };

  return <div ref={summary} className="explore-summary" onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && panelOpen) {
      event.preventDefault();
      setExpanded(false);
      filterButton.current?.focus({ preventScroll: true });
    }
  }}>
    <div className="explore-result-heading">
      <CityPicker value={cityId} onChange={onChangeCity} />
      <p role="status" className="explore-result-count"><strong>{count}</strong> 处<span className="explore-count-unit">景点</span></p>
      <div className="explore-result-actions">
        <button ref={filterButton} type="button" className="explore-show-filters" onClick={hasSelections ? () => setExpanded(!panelOpen) : openFilters}
          aria-label={hasSelections ? `筛选，已选 ${selections.length} 项` : '回到景点筛选'}
          aria-controls={hasSelections ? panelId : undefined} aria-expanded={hasSelections ? panelOpen : undefined}>
          <SlidersHorizontal size={16} aria-hidden="true" /><span>筛选</span>
          {hasSelections && <small aria-hidden="true">{selections.length}</small>}
        </button>
        <SelectField aria-label="目的地排序" value={order} onChange={event => onOrder(event.target.value as DestinationSort)}>
          <option value="recommended">推荐顺序</option><option value="duration">时长短优先</option><option value="city">按城市排列</option>
        </SelectField>
      </div>
    </div>
    <section id={panelId} className="explore-filter-panel" aria-label="已选筛选条件" hidden={!panelOpen}>
      <div className="explore-filter-header">
        <p>已选条件</p>
        <button type="button" className="explore-reset" onClick={() => removeFilter(onReset, true)}>清空筛选</button>
      </div>
      <div className="explore-selections">
        {selections.map(item => <button key={item.id} type="button" title={item.label} aria-label={'取消' + item.label + '筛选'}
          onClick={() => removeFilter(item.onRemove, selections.length === 1)}><span>{item.label}</span><X size={14} aria-hidden="true" /></button>)}
      </div>
      <button type="button" className="explore-edit-filters" onClick={openFilters}><SlidersHorizontal size={15} aria-hidden="true" />修改筛选</button>
    </section>
  </div>;
}
