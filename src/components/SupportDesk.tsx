import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Compass, RotateCcw, Send } from 'lucide-react';
import { cities, cityById } from '../data';
import { answerSupport, type SupportAction, type SupportContext, type SupportReply } from '../support';
import { Modal } from './Modal';
import { SelectField } from './ui';
import './support-desk.css';

type Message = { id: number; question: string; reply: SupportReply };
const examples = ['武汉两天怎么玩？', '恩施住哪里方便？', '宜昌有什么好吃的？', '怎么保存分享行程？'];
const promptsFor = (cityId?: string) => cityId && cityById[cityId]
  ? [`${cityById[cityId].shortName}住哪里？`, `${cityById[cityId].shortName}吃什么？`, `${cityById[cityId].shortName}怎么坐车？`, '怎么保存行程？']
  : examples;

export function SupportDesk({ open, initialCity, onClose, onAction }: {
  open: boolean; initialCity: string; onClose: () => void; onAction: (action: SupportAction) => void;
}) {
  const initial = Object.hasOwn(cityById, initialCity) ? initialCity : undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<SupportContext>({ cityId: initial });
  const [suggestions, setSuggestions] = useState<string[]>(promptsFor(initial));
  const [draft, setDraft] = useState('');
  const serial = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || messages.length) return;
    setContext({ cityId: initial });
    setSuggestions(promptsFor(initial));
  }, [open, initial, messages.length]);
  useEffect(() => {
    if (!open || !log.current) return;
    const element = log.current;
    const last = element.lastElementChild as HTMLElement | null;
    const top = messages.length && last ? element.scrollTop + last.getBoundingClientRect().top - element.getBoundingClientRect().top - 12 : 0;
    element.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }, [messages, open]);
  const ask = (value: string) => {
    const question = value.trim().slice(0, 240);
    if (!question) return;
    const reply = answerSupport(question, context);
    setMessages(previous => [...previous, { id: ++serial.current, question, reply }].slice(-12));
    setContext(reply.context);
    setSuggestions(reply.suggestions.length ? reply.suggestions.slice(0, 4) : promptsFor(reply.context.cityId));
    setDraft('');
  };
  const clear = () => { setMessages([]); setDraft(''); setContext({ cityId: initial }); setSuggestions(promptsFor(initial)); };
  if (!open) return null;
  return <Modal title="小游 · 湖北旅行问答" onClose={onClose}>
    <div className="support-shell">
      <div className="support-meta"><span><Compass size={14} />本站攻略 · 无需登录</span><button onClick={clear} disabled={!messages.length} aria-label="清空对话"><RotateCcw size={14} />清空对话</button></div>
      <div className="support-city"><label htmlFor="support-city">先选城市，也可以直接提问</label><SelectField id="support-city" aria-label="问答城市" value={context.cityId || ''} onChange={event => { const cityId = event.target.value || undefined; setContext({ cityId }); setSuggestions(promptsFor(cityId)); }}><option value="">还没想好 · 全部湖北</option>{cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}</SelectField></div>
      <div ref={log} className="support-log" role="log" aria-label="旅行问答记录" aria-live="polite" aria-relevant="additions">
        <div className="support-welcome"><span className="support-avatar" aria-hidden="true"><Compass size={19} /></span><div><strong>你好，我是小游。</strong><p>从本站攻略里帮你找吃、住、行和路线建议。也能带你打开相关攻略和规划。</p><small>按资料匹配回答，未连接大模型或人工客服。</small></div></div>
        {messages.map(message => <div key={message.id} className="support-turn"><div className="support-question"><span>你</span><p>{message.question}</p></div><div className="support-reply"><span className="support-avatar" aria-hidden="true"><Compass size={17} /></span><div><p>{message.reply.text}</p>{message.reply.actions.length > 0 && <div className="support-actions">{message.reply.actions.map((action, index) => <button key={index} onClick={() => onAction(action)}>{action.label}<ArrowUpRight size={13} /></button>)}</div>}{message.reply.sources.length > 0 && <details className="support-sources"><summary>参考资料 · {message.reply.sources.length} 条</summary>{message.reply.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}</details>}</div></div></div>)}
      </div>
      <div className="support-suggestions" aria-label="可以继续问">{suggestions.map(question => <button key={question} onClick={() => ask(question)}>{question}</button>)}</div>
      <form className="support-form" onSubmit={event => { event.preventDefault(); ask(draft); }}><label className="sr-only" htmlFor="support-question">输入旅行问题</label><textarea id="support-question" aria-label="输入旅行问题" rows={2} maxLength={240} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); ask(draft); } }} placeholder="问问吃住行、路线或使用方法" /><button type="submit" disabled={!draft.trim()}><Send size={16} />发送</button></form>
      <p className="support-privacy">问题不上传，对话仅在当前页面保留。实时票价、天气与开放安排请核对官方渠道。</p>
    </div>
  </Modal>;
}
