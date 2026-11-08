import { travelFaq } from '../data/help';
import { MessageCircle } from 'lucide-react';
export function TravelFaq({ onAsk }: { onAsk?: () => void }) {
  const questions = travelFaq;
  return <section id="faq" aria-labelledby="faq-title" className="page-width section-space grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">行前问答</p><h2 id="faq-title" className="section-title">出发前，<br />你可能还想知道。</h2><p className="mt-5 max-w-sm text-sm leading-8 text-muted">少一点临时纠结，多一点从容。<br />把实际问题放在出发之前。</p>{onAsk && <button onClick={onAsk} className="text-link mt-5"><MessageCircle size={17} />还有问题？问问小游</button>}</div><div className="divide-y divide-line border-y border-line">{questions.map(item => <details className="group py-5" key={item.q}><summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-sm font-medium leading-7">{item.q}<span className="font-display text-xl font-medium text-pine transition group-open:rotate-45">+</span></summary><p className="mt-4 pr-5 text-sm leading-8 text-muted">{item.a}</p></details>)}</div></section>;
}
