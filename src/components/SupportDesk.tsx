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

type Message = { id: number; question: string; reply: SupportReply; baseProfile?: Profile };
const examples = ['武汉2天2人，最后一天15:30从武昌站返程', '恩施3天，2人，带长辈，少台阶', '从武汉出发，去宜昌2天2人', '怎么保存分享行程？'];
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
  const [activeProfile, setActiveProfile] = useState<Profile>();
  const [selectedId, setSelectedId] = useState<number>();
  const [detailOpen, setDetailOpen] = useState(false);
  const serial = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const focusReturn = useRef(false);
  const selected = messages.find(message => message.id === selectedId);
  const profile = selected?.reply.plan;
  const previous = selected?.baseProfile;

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
  useEffect(() => {
    if (!detailOpen) return;
    const trigger = focusReturn.current && detail.current?.querySelector<HTMLButtonElement>('.return-day-trigger');
    focusReturn.current = false;
    if (trigger) {
      trigger.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      trigger.focus({ preventScroll: true });
    } else {
      detail.current?.scrollTo({ top: 0, behavior: 'instant' });
      detail.current?.focus({ preventScroll: true });
    }
  }, [selectedId, detailOpen]);
  const addReply = (question: string, reply: SupportReply, from = context.trip ? activeProfile : undefined) => {
    const id = ++serial.current;
    const baseProfile = reply.plan ? from : undefined;
    setMessages(before => [...before, { id, question, reply, baseProfile }].slice(-12));
    setContext(reply.context); setSuggestions(reply.suggestions.length ? reply.suggestions.slice(0, 4) : promptsFor(reply.context.cityId));
    setDraft(''); setShowTripForm(false); setEditingTrip(undefined);
    if (reply.plan) { setActiveProfile(reply.plan); setSelectedId(id); setDetailOpen(true); }
    else if ((context.trip || reply.context.trip) && !reply.actions.some(action => action.profile)) { setSelectedId(undefined); setDetailOpen(false); }
    if (!reply.context.trip) setActiveProfile(undefined);
  };
  const ask = (value: string) => { const question = value.trim().slice(0, 240); if (question) addReply(question, answerSupport(question, context)); };
  const openPlan = (message: Message) => {
    if (!message.reply.plan) return;
    setContext(message.reply.context);
    setActiveProfile(message.reply.plan);
    setSuggestions(message.reply.suggestions.slice(0, 4));
    setSelectedId(message.id);
    setDetailOpen(true);
  };
  const editPlan = (plan: Profile) => {
    if (!selected) return;
    setContext(selected.reply.context);
    setActiveProfile(plan);
    setEditingTrip({ ...supportTripDraftFromProfile(plan), budget: selected.reply.context.trip?.budget });
    setShowTripForm(true);
    setDetailOpen(false);
  };
  const updateReturn = (next: Profile) => {
    if (!profile) return;
    const requested = selected?.reply.context.trip || supportTripDraftFromProfile(profile);
    const reply = planSupportTrip({ ...requested, departure: next.departure, departureTime: next.departureTime, departureStation: next.departureStation, returnLogistics: next.returnLogistics });
    focusReturn.current = Boolean(reply.plan);
    addReply('更新返程接驳', reply, profile);
  };
  const chooseCity = (cityId?: string) => {
    setContext({ cityId });
    setSuggestions(promptsFor(cityId));
    setSelectedId(undefined);
    setDetailOpen(false);
    setEditingTrip(undefined);
    setActiveProfile(undefined);
  };
  const clear = () => {
    chooseCity(initial);
    setMessages([]);
    setDraft('');
    setShowTripForm(false);
  };
  const returnToChat = () => {
    setDetailOpen(false);
    window.requestAnimationFrame(() => log.current?.focus({ preventScroll: true }));
  };
  if (!open) return null;
  return <Modal title="小游 · 湖北旅行规划" onClose={onClose} dialogClassName={'support-dialog' + (profile ? ' has-itinerary' : '')}>
    <div className={'support-layout' + (profile ? ' has-itinerary' : '') + (profile && detailOpen ? ' detail-open' : '')}>
      <div className="support-shell">
        <div className="support-meta"><span><Compass size={14} />本地攻略 · 无需登录</span><button onClick={clear} disabled={!messages.length} aria-label="清空对话"><RotateCcw size={14} />清空对话</button></div>
        <div className="support-city"><button className="support-trip-entry" onClick={() => { setEditingTrip(undefined); setShowTripForm(value => !value); setDetailOpen(false); }} aria-expanded={showTripForm}>{showTripForm ? <MessageCircle size={15} /> : <Route size={15} />}{showTripForm ? '返回问答' : '填写旅行条件'}</button>{!showTripForm && <SelectField aria-label="问答城市" value={context.cityId || ''} onChange={event => chooseCity(event.target.value || undefined)}><option value="">全部湖北</option>{cities.map(city => <option key={city.id} value={city.id}>{city.shortName}</option>)}</SelectField>}{showTripForm && <span className="support-condition-label">路线 · 抵达 · 返程</span>}</div>
        <div ref={log} tabIndex={-1} className="support-log" role={showTripForm ? 'region' : 'log'} aria-label={showTripForm ? '行程条件' : '旅行问答记录'} aria-live={showTripForm ? 'off' : 'polite'} aria-relevant="additions">
          {showTripForm ? <SupportTripForm draft={editingTrip || context.trip} initialCity={context.cityId} initialParty={initialParty} initialDate={initialDate} onSubmit={(request, question) => addReply(question, planSupportTrip(request))} onCancel={() => setShowTripForm(false)} /> : <>
            <div className="support-welcome"><span className="support-avatar" aria-hidden="true"><Compass size={19} /></span><div><strong>这次想去哪儿？</strong><p>告诉我去哪、几天、几个人。也可以加上抵达和返程时段、体力或美食偏好，我会一起安排每天的吃住行。</p><small>行程依据本站编辑的湖北攻略整理。</small></div></div>
            {messages.map(message => {
              const plan = message.reply.plan;
              const route = plan ? buildTrip(plan) : [];
              const cityNames = [...new Set(route.map(day => cityById[day.cityId].shortName))];
              return <div key={message.id} className="support-turn"><div className="support-question"><span>你</span><p>{message.question}</p></div><div className="support-reply"><span className="support-avatar" aria-hidden="true"><Compass size={17} /></span><div><p>{message.reply.text}</p>
              {plan && <button className={'support-plan-peek' + (selectedId === message.id ? ' is-selected' : '')} onClick={() => openPlan(message)} aria-pressed={selectedId === message.id}>
                <span><Route size={16} />{cityNames.join(' → ')}</span><strong>{route.length} 天 · {plan.party} 人</strong><small>打开这份行程并继续修改<ArrowRight size={14} /></small>
              </button>}
              {!message.reply.plan && message.reply.actions.length > 0 && <div className="support-actions">{message.reply.actions.map((action, index) => <button key={index} onClick={() => onAction(action)}>{action.label}<ArrowUpRight size={13} /></button>)}</div>}
              {message.reply.sources.length > 0 && <details className="support-sources"><summary>参考资料 · {message.reply.sources.length} 条</summary>{message.reply.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}</details>}
            </div></div></div>;
            })}
          </>}
        </div>
        {!showTripForm && <><div className="support-suggestions" aria-label="可以继续问">{suggestions.map(question => <button key={question} onClick={() => ask(question)}>{question}</button>)}</div><form className="support-form" onSubmit={event => { event.preventDefault(); ask(draft); }}><label className="sr-only" htmlFor="support-question">输入旅行问题</label><textarea id="support-question" aria-label="输入旅行问题" rows={2} maxLength={240} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); ask(draft); } }} placeholder="例如：武汉2天2人，下午到，少台阶" /><button type="submit" disabled={!draft.trim()}><Send size={16} />发送</button></form></>}
        <p className="support-privacy">问题不上传，刷新清空对话。车船、开放与房价需核对当期信息。</p>
      </div>
      {profile && <aside className="support-detail" aria-label="行程详情">
        <div className="support-detail-bar"><button className="support-back-chat" onClick={returnToChat}><ArrowLeft size={16} />返回对话</button><span>这份行程</span><button onClick={() => editPlan(profile)}>调整条件</button><button className="support-close-detail" onClick={() => { setSelectedId(undefined); returnToChat(); }} aria-label="收起行程详情"><X size={17} /></button></div>
        <div ref={detail} tabIndex={-1} role="region" aria-label="具体行程内容" className="support-detail-scroll">
          <SupportPlanPreview key={`preview-${selectedId}`} profile={profile} onUpdateReturn={updateReturn} />
          <SupportPlanTools key={selectedId} profile={profile} previous={previous} onEdit={editPlan} />
          <button className="support-open-full" onClick={() => onAction({ kind: 'plan', cityId: profile.cityId, profile, label: '保存与调整完整行程' })}>保存与调整完整行程<ArrowUpRight size={16} /></button>
          <p className="support-detail-footnote">这份预览在当前页面保留。进入完整行程后，可保存到本浏览器。</p>
        </div>
      </aside>}
    </div>
  </Modal>;
}
