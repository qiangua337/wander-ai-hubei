import { useState } from 'react';
import { ArrowUpRight, Copy, MapPin, Utensils } from 'lucide-react';
import { localFoodShops } from '../data/food-shops';
import { practicalMapUrl } from '../data/practical-maps';

export function LocalFoodShops({ cityId }: { cityId: string }) {
  const shops = localFoodShops[cityId];
  const [copyResult, setCopyResult] = useState<{ shop: string; message: string }>();
  if (!shops?.length) return null;

  const copyAddress = async (shop: (typeof shops)[number]) => {
    let message = '地址已复制';
    try { await navigator.clipboard.writeText(shop.address); }
    catch { message = '请选中店铺地址后复制'; }
    setCopyResult({ shop: shop.name, message });
  };

  return <section className="local-food-shops" aria-label="顺路的具体店铺">
    <div className="food-shops-heading">
      <h3>顺路店铺</h3>
      <p>看想吃的菜、所在片区和推荐依据，出发前再确认营业。</p>
    </div>
    <div className="food-shops-grid">
      {shops.map(shop => <article key={shop.name} className="food-shop-card">
        <p className="food-shop-area">{shop.area}</p>
        <h4>{shop.name}</h4>
        <p className="food-shop-dish"><Utensils size={15} aria-hidden="true" />{shop.dish}</p>
        <p className="food-shop-address"><MapPin size={14} aria-hidden="true" />{shop.address}</p>
        <p>{shop.routeFit}</p>
        <div className="food-shop-evidence">
          <p>{shop.evidence}</p>
          <ul aria-label="推荐依据">
            {shop.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} aria-hidden="true" /></a></li>)}
          </ul>
        </div>
        <div className="food-shop-actions">
          <a href={practicalMapUrl(shop.map)} target="_blank" rel="noreferrer" className="food-shop-map" aria-label={`在高德地图找${shop.name}`}><MapPin size={14} aria-hidden="true" />高德地图<ArrowUpRight size={13} aria-hidden="true" /></a>
          <button type="button" className="food-shop-map" onClick={() => void copyAddress(shop)} aria-label={`复制${shop.name}地址`}><Copy size={13} aria-hidden="true" />复制地址</button>
          <span role="status" className="food-shop-status">{copyResult?.shop === shop.name ? copyResult.message : ''}</span>
        </div>
      </article>)}
    </div>
  </section>;
}
