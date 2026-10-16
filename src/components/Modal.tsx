import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); ref.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [title]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const targets = Array.from(ref.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex="0"]') ?? []).filter(el => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; if (root) root.inert = wasInert; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose]);
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal-enter relative max-h-[92dvh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl ${wide ? 'max-w-6xl' : 'max-w-lg'}`}>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/95 px-5 py-4 backdrop-blur sm:px-6 sm:py-5"><h2 id={id} className="text-lg font-bold text-ink">{title}</h2><button type="button" onClick={onClose} aria-label="关闭弹窗" className="shrink-0 rounded-full p-2 text-muted transition hover:bg-sage hover:text-pine"><X size={20} /></button></div>
      {children}
    </div>
  </div>, document.body);
}
