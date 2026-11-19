import { useState } from 'react';
import { ChevronDown, Copy, MapPin, Utensils } from 'lucide-react';
import { foodMealLabels, localFoodShops, type FoodMeal } from '../data/food-shops';
import { practicalMapUrl } from '../data/practical-maps';

export function LocalFoodShops({ cityId, shopIds, compact = false }: { cityId: string; shopIds?: readonly string[]; compact?: boolean }) {
  const shops = (localFoodShops[cityId] || []).filter(shop => !shopIds || shopIds.includes(shop.id));
  const [meal, setMeal] = useState<FoodMeal | 'all'>('all');
  const [copyResult, setCopyResult] = useState<{ shop: string; message: string }>();
  if (!shops.length) return null;
  const meals = (Object.keys(foodMealLabels) as FoodMeal[]).filter(value => shops.some(shop => shop.meals.includes(value)));
  const visible = meal === 'all' ? shops : shops.filter(shop => shop.meals.includes(meal));

  const copyAddress = async (shop: (typeof shops)[number]) => {
    let message = '地址已复制';
    try { await navigator.clipboard.writeText(shop.address); }
    catch { message = '请选中店铺地址后复制'; }
    setCopyResult({ shop: shop.name, message });
  };

  return <section className={'local-food-shops' + (compact ? ' is-compact' : '')} aria-label="具体店铺推荐">
    {!compact && <div className="food-shops-heading">
      <div><h3>这顿，去哪家吃？</h3><p>按片区挑一家。地址、点单和推荐依据都在这里。</p></div>
      {meals.length > 1 && <div role="group" aria-label="按用餐类型筛选" className="food-shop-filters">
        <button type="button" aria-pressed={meal === 'all'} onClick={() => setMeal('all')}>全部</button>
        {meals.map(value => <button key={value} type="button" aria-pressed={meal === value} onClick={() => setMeal(value)}>{foodMealLabels[value]}</button>)}
      </div>}
    </div>}
    <div className="food-shops-grid">
      {visible.map(shop => <article key={shop.id} className="food-shop-card">
        <p className="food-shop-area">{shop.area}</p>
        <h4>{shop.name}</h4>
        <p className="food-shop-dish"><Utensils size={15} aria-hidden="true" />{shop.dish}</p>
        <p className="food-shop-address"><MapPin size={14} aria-hidden="true" />{shop.address}</p>
        <p>{shop.routeFit}</p>
        <details className="food-shop-evidence">
          <summary>为什么推荐这家<ChevronDown size={14} aria-hidden="true" /></summary>
          <p>{shop.evidence}</p>
          <ul aria-label="推荐依据">
            {shop.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}
          </ul>
        </details>
        <div className="food-shop-actions">
          <a href={practicalMapUrl(shop.map)} target="_blank" rel="noreferrer" className="food-shop-map" aria-label={`在高德地图找${shop.name}`}><MapPin size={14} aria-hidden="true" />地图找店</a>
          <button type="button" className="food-shop-map" onClick={() => void copyAddress(shop)} aria-label={`复制${shop.name}地址`}><Copy size={13} aria-hidden="true" />复制地址</button>
          <span role="status" className="food-shop-status">{copyResult?.shop === shop.name ? copyResult.message : ''}</span>
        </div>
      </article>)}
    </div>
    {!compact && <p className="food-shops-footnote">资料推荐以所列报道、商家资料和菜单为依据，出发前请确认营业和当日供应。</p>}
  </section>;
}
