import { ArrowUpRight, Heart, X } from 'lucide-react';
import { SelectField } from './ui';
import type { DestinationSort } from '../discovery';
import './explore-refinement.css';

type Selection = { id: string; label: string; onRemove: () => void };
export function ExploreSummary({ city, count, order, onOrder, selections, savedCount, onSaved }: {
  city: string; count: number; order: DestinationSort; onOrder: (order: DestinationSort) => void;
  selections: Selection[]; savedCount: number; onSaved: () => void;
}) {
  return <div className="explore-summary">
    <div className="explore-result-heading"><p role="status"><strong>{city}</strong><span>找到 {count} 个去处</span></p><div className="explore-result-actions"><button onClick={onSaved}><Heart size={15} />心愿清单{savedCount > 0 && <b>{savedCount}</b>}<ArrowUpRight size={13} /></button><SelectField aria-label="目的地排序" value={order} onChange={event => onOrder(event.target.value as DestinationSort)}><option value="recommended">推荐顺序</option><option value="duration">短时游玩优先</option><option value="city">按城市排列</option></SelectField></div></div>
    {selections.length > 0 && <div className="explore-selections" aria-label="已选筛选条件"><span>正在看</span>{selections.map(item => <button key={item.id} aria-label={'取消' + item.label + '筛选'} onClick={item.onRemove}>{item.label}<X size={12} /></button>)}</div>}
  </div>;
}
