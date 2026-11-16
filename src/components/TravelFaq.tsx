import { travelFaq } from '../data/help';
import { ArrowUpRight, Plus } from 'lucide-react';
export function TravelFaq({ onAsk }: { onAsk?: () => void }) {
  const questions = travelFaq;
  return <section id="faq" aria-labelledby="faq-title" className="faq-section section-space"><div className="page-width faq-layout">
    <div><h2 id="faq-title" className="section-title">行前问答</h2>
      <p className="section-detail">返程、预约和带孩子出游的常见问题。</p>
      {onAsk && <button onClick={onAsk} className="text-link section-link mt-4">问小游<ArrowUpRight size={16} /></button>}
    </div>
    <div className="faq-questions">{questions.map(item => <details key={item.q}>
      <summary>{item.q}<Plus size={18} aria-hidden="true" /></summary><p>{item.a}</p>
    </details>)}</div>
  </div></section>;
}
