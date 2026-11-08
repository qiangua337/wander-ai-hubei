import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Compass, MessageCircle, RotateCcw, Route, Send, X } from 'lucide-react';
import { cities, cityById } from '../data';
import { answerSupport, planSupportTrip, type SupportAction, type SupportContext, type SupportReply, type SupportTripDraft } from '../support';
import { buildTrip, type Profile } from '../planning';
import { supportTripDraftFromProfile } from '../support-review';
import { Modal } from './Modal';
import { SupportTripForm } from './SupportTripForm';
import { SupportPlanPreview } from './SupportPlanPreview';
import { SupportPlanTools } from './SupportPlanTools';
import { SelectField } from './ui';
import './support-desk.css';

type Message = { id: number; question: string; reply: SupportReply };
const examples = ['武汉2天，2人，下午到，喜欢美食', '恩施3天，2人，带长辈，少台阶', '从武汉出发，去宜昌2天2人', '怎么保存分享行程？'];
const promptsFor = (cityId?: string) => cityId && cityById[cityId]
  ? [cityById[cityId].shortName + Math.min(2, cityById[cityId].days.length) + '天，2人，轻松游', cityById[cityId].shortName + '住哪里？', cityById[cityId].shortName + '吃什么？', '怎么保存行程？']
  : examples;

export function SupportDesk({ open, initialCity, initialParty, initialDate, onClose, onAction }: {
  open: boolean; initialCity: string; initialParty: number; initialDate: string; onClose: () => void; onAction: (action: SupportAction) => void;
}) {
  const initial = Object.hasOwn(cityById, initialCity) ? initialCity : undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<SupportContext>({ cityId: initial });
  const [suggestions, setSuggestions] = useState<string[]>(promptsFor(initial));
  const [draft, setDraft] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<SupportTripDraft>();
  const [selectedId, setSelectedId] = useState<number>();
  const [detailOpen, setDetailOpen] = useState(false);
  const serial = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const selectedIndex = messages.findIndex(message => message.id === selectedId && message.reply.plan);
  const selected = selectedIndex >= 0 ? messages[selectedIndex] : undefined;
  const profile = selected?.reply.plan;
  const previous = profile ? messages.slice(0, selectedIndex).reverse().find(item => item.reply.plan && JSON.stringify(item.reply.plan) !== JSON.stringify(profile))?.reply.plan : undefined;

  useEffect(() => {
    if (!open || messages.length) return;
    setContext({ cityId: initial }); setSuggestions(promptsFor(initial));
  }, [open, initial, messages.length]);
  useEffect(() => {
    if (!open || !log.current) return;
    const element = log.current, last = element.lastElementChild as HTMLElement | null;
    const top = !showTripForm && messages.length && last ? element.scrollTop + last.getBoundingClientRect().top - element.getBoundingClientRect().top - 12 : 0;
    element.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }, [messages, open, showTripForm]);
  useEffect(() => { if (detailOpen) { detail.current?.scrollTo({ top: 0, behavior: 'instant' }); detail.current?.focus({ preventScroll: true }); } }, [selectedId, detailOpen]);
  const addReply = (question: string, reply: SupportReply) => {
    const id = ++serial.current;
    setMessages(before => [...before, { id, question, reply }].slice(-12));
    setContext(reply.context); setSuggestions(reply.suggestions.length ? reply.suggestions.slice(0, 4) : promptsFor(reply.context.cityId));
    setDraft(''); setShowTripForm(false); setEditingTrip(undefined);
    if (reply.plan) { setSelectedId(id); setDetailOpen(true); }
    else if ((context.trip || reply.context.trip) && !reply.actions.some(action => action.profile)) { setSelectedId(undefined); setDetailOpen(false); }
  };
  const ask = (value: string) => { const question = value.trim().slice(0, 240); if (question) addReply(question, answerSupport(question, context)); };
  const editPlan = (plan: Profile) => { setEditingTrip(supportTripDraftFromProfile(plan)); setShowTripForm(true); setDetailOpen(false); };
  const clear = () => { setMessages([]); setDraft(''); setContext({ cityId: initial }); setSuggestions(promptsFor(initial)); setShowTripForm(false); setEditingTrip(undefined); setSelectedId(undefined); setDetailOpen(false); };
  if (!open) return null;
  return <Modal title="小游 · 湖北旅行规划" onClose={onClose} dialogClassName={'support-dialog' + (profile ? ' has-itinerary' : '')}>
    <div className={'support-layout' + (profile ? ' has-itinerary' : '') + (profile && detailOpen ? ' detail-open' : '')}>
      <div className="support-shell">
        <div className="support-meta"><span><Compass size={14} />本地攻略 · 无需登录</span><button onClick={clear} disabled={!messages.length} aria-label="清空对话"><RotateCcw size={14} />清空对话</button></div>
        <div className="support-city"><button className="support-trip-entry" onClick={() => { setEditingTrip(undefined); setShowTripForm(value => !value); setDetailOpen(false); }} aria-expanded={showTripForm}>{showTripForm ? <MessageCircle size={15} /> : <Route size={15} />}{showTripForm ? '返回问答' : '填写旅行条件'}</button>{!showTripForm && <SelectField aria-label="问答城市" value={context.cityId || ''} onChange={event => { const cityId = event.target.value || undefined; setContext({ cityId }); setSuggestions(promptsFor(cityId)); }}><option value="">全部湖北</option>{cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}</SelectField>}{showTripForm && <span className="support-condition-label">路线 · 抵达 · 体力</span>}</div>
        <div ref={log} className="support-log" role={showTripForm ? 'region' : 'log'} aria-label={showTripForm ? '行程条件' : '旅行问答记录'} aria-live={showTripForm ? 'off' : 'polite'} aria-relevant="additions">
          {showTripForm ? <SupportTripForm draft={editingTrip || context.trip} initialCity={context.cityId} initialParty={initialParty} initialDate={initialDate} onSubmit={(request, question) => addReply(question, planSupportTrip(request))} onCancel={() => setShowTripForm(false)} /> : <>
            <div className="support-welcome"><span className="support-avatar" aria-hidden="true"><Compass size={19} /></span><div><strong>先说说，你想怎样过这几天。</strong><p>去哪、几天、几个人？几点到、能不能走台阶、想吃什么，也可以一起告诉我。</p><p>我会把每天的游览、吃住与交通整理成一份可调整的行程；资料不够或条件冲突时，会先说明。</p><small>依据本站编辑资料组合，不连接大模型或人工客服。</small></div></div>
            {messages.map(message => <div key={message.id} className="support-turn"><div className="support-question"><span>你</span><p>{message.question}</p></div><div className="support-reply"><span className="support-avatar" aria-hidden="true"><Compass size={17} /></span><div><p>{message.reply.text}</p>
              {message.reply.plan && <button className={'support-plan-peek' + (selectedId === message.id ? ' is-selected' : '')} onClick={() => { setSelectedId(message.id); setDetailOpen(true); }}><span><Route size={16} />{[...new Set(buildTrip(message.reply.plan).map(day => cityById[day.cityId].shortName))].join(' → ')}</span><strong>{buildTrip(message.reply.plan).length} 天 · {message.reply.plan.party} 人</strong><small>查看每天的游览、吃住与交通<ArrowRight size={14} /></small></button>}
              {!message.reply.plan && message.reply.actions.length > 0 && <div className="support-actions">{message.reply.actions.map((action, index) => <button key={index} onClick={() => onAction(action)}>{action.label}<ArrowUpRight size={13} /></button>)}</div>}
              {message.reply.sources.length > 0 && <details className="support-sources"><summary>参考资料 · {message.reply.sources.length} 条</summary>{message.reply.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}</details>}
            </div></div></div>)}
          </>}
        </div>
        {!showTripForm && <><div className="support-suggestions" aria-label="可以继续问">{suggestions.map(question => <button key={question} onClick={() => ask(question)}>{question}</button>)}</div><form className="support-form" onSubmit={event => { event.preventDefault(); ask(draft); }}><label className="sr-only" htmlFor="support-question">输入旅行问题</label><textarea id="support-question" aria-label="输入旅行问题" rows={2} maxLength={240} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); ask(draft); } }} placeholder="例如：武汉2天2人，下午到，少台阶" /><button type="submit" disabled={!draft.trim()}><Send size={16} />发送</button></form></>}
        <p className="support-privacy">问题不上传，刷新清空对话。车船、开放与房价需核对当期信息。</p>
      </div>
      {profile && <aside className="support-detail" aria-label="行程详情"><div className="support-detail-bar"><button className="support-back-chat" onClick={() => setDetailOpen(false)}><ArrowLeft size={16} />返回对话</button><span>这份行程</span><button onClick={() => editPlan(profile)}>调整条件</button><button className="support-close-detail" onClick={() => { setSelectedId(undefined); setDetailOpen(false); }} aria-label="收起行程详情"><X size={17} /></button></div><div ref={detail} tabIndex={-1} role="region" aria-label="具体行程内容" className="support-detail-scroll"><SupportPlanPreview profile={profile} /><SupportPlanTools key={selectedId} profile={profile} previous={previous} onEdit={editPlan} /><button className="support-open-full" onClick={() => onAction({ kind: 'plan', cityId: profile.cityId, profile, label: '保存与调整完整行程' })}>保存与调整完整行程<ArrowUpRight size={16} /></button><p className="support-detail-footnote">这份预览在当前页面保留。进入完整行程后，可保存到本浏览器。</p></div></aside>}
    </div>
  </Modal>;
}
