import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { practicalMapUrl, type PracticalMapLink } from '../data/practical-maps';

export function PracticalMapLinks({ links }: { links: readonly PracticalMapLink[] }) {
  return <ul className="practical-map-links" aria-label="高德地图入口">
    {links.map(link => {
      const href = practicalMapUrl(link);
      return <li key={href}>
        <a href={href} target="_blank" rel="noreferrer" aria-label={`${link.label}（高德地图）`}>
          {'poiId' in link ? <MapPin size={14} aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
          <span>{link.label}</span><ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </li>;
    })}
  </ul>;
}
