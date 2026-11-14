import { useEffect, useId, useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { dayStartWindow, readDayStart } from '../day-starts';
import { Button, InputField } from './ui';

export function DayStartEditor({ suggested, current, dayNumber, onChange }: {
  suggested: string; current?: string; dayNumber: number; onChange: (time?: string) => void;
}) {
  const formId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current || suggested);
  const [error, setError] = useState('');
  useEffect(() => { if (open) field.current?.focus({ preventScroll: true }); }, [open]);

  const apply = (time?: string) => {
    setOpen(false);
    setError('');
    onChange(time);
    window.requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  };

  return <div className="day-start-control">
    <button ref={trigger} type="button" className="day-start-trigger" aria-expanded={open} aria-controls={formId} onClick={() => {
      setOpen(!open);
      setValue(current || suggested);
      setError('');
    }}><Clock3 size={15} />改出门时间</button>
    {open && <form className="day-start-form" id={formId} onSubmit={event => {
      event.preventDefault();
      const time = readDayStart(value);
      if (!time) { setError(`请输入 ${dayStartWindow.min}–${dayStartWindow.max} 的时间，例如 10:30。`); return; }
      apply(time === suggested ? undefined : time);
    }}>
      <label htmlFor={formId + '-time'}>第 {dayNumber} 天想几点出门？</label>
      <InputField ref={field} id={formId + '-time'} aria-describedby={formId + '-help'} aria-invalid={error ? true : undefined}
        placeholder="如 10:30" maxLength={5} value={value} onChange={event => { setValue(event.target.value); setError(''); }} required />
      <Button className="px-4 text-xs" type="submit">重排当天</Button>
      {current && <button type="button" className="day-start-reset" onClick={() => apply()}>恢复 {suggested} 出门</button>}
      <p id={formId + '-help'}>建议出门时间 {suggested}。可设为 {dayStartWindow.min}–{dayStartWindow.max}。改晚时会先安排吃饭，再按剩余时间调整景点。</p>
      {error && <p role="alert" className="day-start-error">{error}</p>}
    </form>}
  </div>;
}
