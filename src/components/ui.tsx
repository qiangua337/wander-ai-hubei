import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'neutral' | 'subtle' | 'orange' | 'white' };
const variants = {
  primary: 'bg-pine text-white hover:bg-pine-deep',
  orange: 'bg-terracotta text-white hover:bg-terracotta-deep',
  neutral: 'border border-line bg-white text-ink hover:border-pine hover:bg-sage',
  subtle: 'bg-transparent text-ink hover:bg-sage',
  white: 'bg-cream text-pine hover:bg-white',
};
export function Button({ variant = 'primary', className = '', children, type = 'button', ...props }: ButtonProps) {
  const padding = /(^|\s)px-\S+/.test(className) ? '' : 'px-5';
  const fontSize = /(^|\s)text-(xs|sm|base|lg|xl|[2-9]xl|\[\d)/.test(className) ? '' : 'text-sm';
  return <button type={type} className={`inline-flex min-h-11 items-center justify-center gap-3 rounded-sm ${padding} ${fontSize} font-medium transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

type FieldProps = { label: string; icon: ReactNode; children: ReactNode; className?: string };
export function Field({ label, icon, children, className = '' }: FieldProps) {
  return <label className={`block min-w-0 text-left ${className}`}><span className="mb-2.5 flex items-center gap-2 text-xs font-medium text-muted">{icon}{label}</span>{children}</label>;
}
export function InputField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-12 w-full min-w-0 rounded-sm border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-pine focus:ring-2 focus:ring-pine/10 ${className}`} {...props} />;
}
export function SelectField({ children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="relative block"><select className={`h-12 w-full cursor-pointer appearance-none rounded-sm border border-line bg-white px-3 pr-9 text-sm text-ink outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/10 ${className}`} {...props}>{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-muted" /></span>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`overflow-hidden rounded-2xl border border-line bg-white ${className}`}>{children}</article>;
}
export function Brand({ inverse = false, onClick }: { inverse?: boolean; onClick?: () => void }) {
  return <a href="#top" onClick={onClick} aria-label="Wander AI 首页" className={`brand flex shrink-0 items-center gap-3 ${inverse ? 'text-white' : 'text-pine'}`}><img src="/images/compass.svg" width="34" height="34" alt="" className={inverse ? 'brightness-0 invert' : ''} /><span><span className="block font-display text-[25px] font-semibold leading-none tracking-[-.4px]">Wander<span className="ml-1.5 align-top text-xs font-semibold tracking-normal">AI</span></span><span className="mt-2 block text-[10px] font-medium tracking-normal opacity-75">寻游湖北 · 慢行指南</span></span></a>;
}
