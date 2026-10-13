import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Heart, Leaf, MapPin, Menu, Mountain, Search, ShieldCheck, Sparkles, Star, Users, X } from 'lucide-react';
import { Brand, Button, Card, Field, InputField, SelectField } from './components/ui';
import { Modal } from './components/Modal';
import { destinations, imageCredits, stories, type Destination } from './data';

type Filter = 'all' | 'nature' | 'city' | 'saved';
type ModalState = { type: 'destination'; destination: Destination } | { type: 'auth'; mode: 'signup' | 'login' } | { type: 'planner' } | { type: 'credits' } | { type: 'info'; title: string; body: string } | null;
const filterOptions: { key: Filter; label: string }[] = [{ key: 'all', label: '全部探索' }, { key: 'nature', label: '山水自然' }, { key: 'city', label: '城市人文' }, { key: 'saved', label: '我的收藏' }];
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function loadSaved(): string[] { try { const saved = JSON.parse(localStorage.getItem('wander-saved') || '[]'); return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []; } catch { return []; } }

export default function App() {
  const [selection, setSelection] = useState('all');
  const [date, setDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('all');
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState('');
  const [authComplete, setAuthComplete] = useState(false);
  const [interest, setInterest] = useState<'nature' | 'city'>('nature');
  const [planReady, setPlanReady] = useState(false);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => { try { localStorage.setItem('wander-saved', JSON.stringify(saved)); } catch { /* Favorites remain available for this session. */ } }, [saved]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3000); return () => window.clearTimeout(timer); }, [toast]);

  const visible = useMemo(() => destinations.filter(d => (query === 'all' || d.id === query) && (filter === 'all' || (filter === 'saved' ? saved.includes(d.id) : d.category === filter))), [filter, query, saved]);
  const showAuth = (mode: 'signup' | 'login' = 'signup') => { setAuthComplete(false); setMobileMenu(false); setModal({ type: 'auth', mode }); };
  const showPlanner = () => { setPlanReady(false); setMobileMenu(false); setModal({ type: 'planner' }); };
  const toggleSave = (d: Destination) => { const wasSaved = saved.includes(d.id); setSaved(prev => wasSaved ? prev.filter(id => id !== d.id) : [...prev, d.id]); setToast(wasSaved ? `已取消收藏「${d.title}」` : `已收藏「${d.title}」，在「我的收藏」中查看`); };
  const scrollToDestinations = () => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
  const search = (event: FormEvent) => { event.preventDefault(); setQuery(selection); setFilter('all'); setSearched(true); scrollToDestinations(); };
  const changeFilter = (next: Filter) => { setFilter(next); setQuery('all'); setSearched(false); };
  const showInfo = (title: string, body: string) => setModal({ type: 'info', title, body });
  const suggested = interest === 'city' ? destinations[2] : destinations[0];

  return <>
    <a href="#destinations" className="sr-only z-50 rounded-lg bg-white px-5 py-3 text-pine focus:not-sr-only focus:fixed focus:left-4 focus:top-4">跳转到目的地</a>
    <header id="top" data-node-id="4:32" className="relative z-30 border-b border-line/60 bg-white">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-8 px-5 lg:h-[88px] lg:px-10">
        <Brand />
        <nav aria-label="主导航" className="hidden items-center gap-9 text-sm font-medium md:flex">
          <a href="#destinations" className="relative py-8 text-pine after:absolute after:bottom-5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-terracotta">探索湖北</a>
          <button onClick={showPlanner} className="flex items-center gap-1.5 text-muted transition hover:text-pine">行程灵感 <Sparkles size={14} className="text-terracotta" /></button>
          <a href="#stories" className="text-muted transition hover:text-pine">旅行者说</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex"><Button variant="subtle" onClick={() => showAuth('login')}>登录</Button><Button onClick={() => showAuth()}>注册，开启旅程 <ArrowUpRight size={16} /></Button></div>
        <button aria-label={mobileMenu ? '关闭菜单' : '打开菜单'} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-pine md:hidden">{mobileMenu ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      {mobileMenu && <nav aria-label="手机导航" className="absolute inset-x-0 top-20 border-b border-line bg-white px-6 py-6 shadow-lg md:hidden"><div className="flex flex-col gap-5"><a href="#destinations" onClick={() => setMobileMenu(false)}>探索湖北</a><button onClick={showPlanner} className="text-left">行程灵感</button><a href="#stories" onClick={() => setMobileMenu(false)}>旅行者说</a><Button onClick={() => showAuth()}>注册，开启旅程 <ArrowRight size={16} /></Button></div></nav>}
    </header>

    <main>
      <section data-node-id="4:33" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-pine-deep px-5 pb-24 pt-16 sm:pt-20 lg:min-h-[700px] lg:pb-24 lg:pt-[92px]">
        <img src="/images/xiling.jpg" alt="湖北宜昌西陵峡灯影峡的长江、山峦与临江亭阁" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_57%]" />
        <div className="hero-shade absolute inset-0 -z-10" />
        <div className="hero-copy mx-auto max-w-4xl text-center text-white">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[2px] backdrop-blur-sm"><span className="h-1.5 w-1.5 rounded-full bg-seafoam" /> WANDER INTO HUBEI · 寻游湖北</span>
          <h1 id="hero-title" className="text-[38px] font-semibold leading-[1.35] tracking-tight sm:text-[52px] lg:text-[62px]">你的下一站，<br /><span className="text-[#f0e3c5]">在湖北的山水之间。</span></h1>
          <p className="mt-5 text-sm leading-7 text-white/85 sm:text-base">从一江碧水到千年楚韵，<span className="inline-block">让每一次出发都有新的答案。</span></p>
        </div>

        <form onSubmit={search} data-node-id="7:206" aria-label="搜索湖北旅行" className="search-panel mx-auto mt-10 max-w-[1120px] rounded-2xl bg-white p-5 shadow-[0_18px_65px_rgba(7,34,31,0.2)] sm:p-6">
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1.45fr_1.18fr_.96fr_.84fr]">
            <Field label="想去哪里" icon={<MapPin size={15} />}><SelectField data-node-id="7:208" value={selection} onChange={e => setSelection(e.target.value)} aria-label="选择湖北目的地"><option value="all">湖北，遇见更多风景</option>{destinations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</SelectField></Field>
            <Field label="什么时候出发" icon={<CalendarDays size={15} />}><div className="relative"><InputField data-node-id="7:222" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} aria-label="出行日期" className={date ? '' : 'text-transparent focus:text-ink'} />{!date && <span className="pointer-events-none absolute left-3 top-3.5 text-sm text-muted">选择出行日期</span>}</div></Field>
            <Field label="和谁一起" icon={<Users size={15} />}><SelectField data-node-id="7:228" value={travelers} onChange={e => setTravelers(e.target.value)} aria-label="出行人数">{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} 位旅行者</option>)}</SelectField></Field>
            <Button type="submit" data-node-id="7:241" variant="orange" className="h-12 w-full"><Search size={18} /> 发现好旅程</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line/80 pt-4">
            <div className="flex flex-wrap items-center gap-3 text-xs"><span className="text-muted">心动目的地</span>{destinations.map(d => <button type="button" key={d.id} onClick={() => setSelection(d.id)} className={`rounded-full px-3 py-1.5 transition hover:bg-sage hover:text-pine ${selection === d.id ? 'bg-sage text-pine' : 'bg-cream text-muted'}`}>{d.id === 'wuhan' ? '黄鹤楼' : d.title}</button>)}</div>
            <button type="button" onClick={showPlanner} className="flex items-center gap-1.5 text-xs font-semibold text-pine transition hover:text-terracotta"><Sparkles size={15} /> 还没想好？找一点行程灵感 <ArrowUpRight size={14} /></button>
          </div>
        </form>
        <div className="absolute inset-x-0 bottom-6 mx-auto flex max-w-[1280px] items-center justify-between px-5 text-[11px] text-white/75 lg:px-10"><span className="photo-credit flex items-center gap-1.5"><MapPin size={13} /> 宜昌 · 西陵峡 / 灯影峡</span><a href="#destinations" aria-label="向下探索目的地" className="flex items-center gap-2 tracking-widest hover:text-white">向下探索 <ArrowDown size={14} /></a></div>
      </section>

      <section id="destinations" data-node-id="4:34" aria-labelledby="destinations-title" className="mx-auto max-w-[1280px] px-5 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold tracking-[2.5px] text-terracotta"><span className="h-px w-7 bg-terracotta" /> CURATED DESTINATIONS</p><h2 id="destinations-title" className="text-[29px] font-semibold tracking-tight lg:text-[36px]">把湖北，慢慢走成你的故事。</h2><p className="mt-3 text-sm leading-7 text-muted">山川有回响，街巷有温度。总有一处风景，值得你为它出发。</p></div>
          <button onClick={() => { changeFilter('all'); setSelection('all'); }} className="flex items-center gap-2 pb-1 text-sm font-medium text-pine hover:text-terracotta">探索全部目的地 <ArrowUpRight size={17} /></button>
        </div>
        <div role="group" aria-label="目的地分类" className="mt-8 flex flex-wrap gap-2">{filterOptions.map(f => <button key={f.key} onClick={() => changeFilter(f.key)} aria-pressed={filter === f.key} className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium transition ${filter === f.key ? 'bg-pine text-white' : 'border border-line bg-white text-muted hover:border-pine/30 hover:text-pine'}`}>{f.key === 'saved' && <Heart size={13} />}{f.label}{f.key === 'saved' && saved.length > 0 && <span className="ml-0.5 text-[10px]">{saved.length}</span>}</button>)}</div>
        {searched && <p role="status" className="mt-5 rounded-lg bg-sage px-4 py-3 text-sm text-pine">为 {travelers} 位旅行者找到 {visible.length} 个湖北目的地{date ? ` · 出发日期 ${date}` : ''}。以下为行程灵感，可点击查看详情。</p>}
        <div className="mt-7 grid gap-6 md:grid-cols-3" aria-live="polite">
          {visible.map(d => <Card key={d.id} className="group transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-15px_rgba(28,70,56,.25)]">
            <div className="relative h-[240px] overflow-hidden lg:h-[252px]"><button onClick={() => setModal({ type: 'destination', destination: d })} className="block h-full w-full" aria-label={`查看${d.title}行程`}><img src={d.image} alt={d.imageAlt} loading="lazy" width="800" height="500" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" style={d.imagePosition ? { objectPosition: d.imagePosition } : undefined} /></button><span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-pine shadow-sm">{d.tag}</span><button aria-label={`${saved.includes(d.id) ? '取消收藏' : '收藏'}${d.title}`} aria-pressed={saved.includes(d.id)} onClick={() => toggleSave(d)} className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 ${saved.includes(d.id) ? 'text-terracotta' : 'text-ink/70'}`}><Heart size={17} fill={saved.includes(d.id) ? 'currentColor' : 'none'} /></button></div>
            <div className="p-6"><p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={12} />{d.region}</p><h3 className="text-[23px] font-semibold tracking-tight">{d.title}</h3><p className="mb-4 mt-2.5 min-h-10 text-[13px] leading-6 text-muted">{d.description}</p><div className="flex items-center justify-between border-t border-line pt-4"><span className="flex items-center gap-1.5 text-xs text-muted"><Clock3 size={14} /> 建议 {d.duration}</span><button onClick={() => setModal({ type: 'destination', destination: d })} className="flex items-center gap-1.5 text-xs font-semibold text-pine hover:text-terracotta">探索行程 <ArrowRight size={16} /></button></div></div>
          </Card>)}
        </div>
        {visible.length === 0 && <div className="mt-7 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center"><Heart size={28} className="mx-auto text-muted" /><h3 className="mt-4 text-lg font-semibold">先收藏一处让你心动的风景</h3><p className="mt-2 text-sm text-muted">点击目的地照片上的爱心，就能把旅行灵感留在这里。</p><Button className="mt-5" variant="neutral" onClick={() => changeFilter('all')}>去发现目的地 <ArrowRight size={16} /></Button></div>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] text-muted"><span className="flex items-center gap-2"><Leaf size={15} className="text-pine" /> 为自然，也为自己留点时间</span><span className="flex items-center gap-2"><Sparkles size={15} className="text-terracotta" /> 灵感按你的喜好展开</span><span className="flex items-center gap-2"><Heart size={15} className="text-pine" /> 收藏风景，继续心动</span></div>
      </section>

      <section id="stories" data-node-id="4:35" aria-labelledby="stories-title" className="border-y border-line/70 bg-sand/65 px-5 py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px]"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 font-display text-[11px] font-bold tracking-[2.5px] text-terracotta">STORIES FROM THE ROAD</p><h2 id="stories-title" className="text-[29px] font-semibold tracking-tight lg:text-[34px]">好旅行，是会被记住的。</h2><p className="mt-3 text-sm text-muted">让沿途的心动，成为下一次出发的理由。</p></div><span className="text-[10px] text-muted">旅行故事示例 · 界面展示</span></div>
          <div className="grid gap-6 md:grid-cols-3">{stories.map(story => <Card key={story.name} className="p-6"><div aria-label="示例五星评价" className="mb-5 flex gap-1 text-[#cf9b53]">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" strokeWidth={0} />)}</div><h3 className="mb-3 text-base font-semibold">{story.title}</h3><p className="min-h-[100px] text-[13px] leading-[1.95] text-muted">{story.quote}</p><div className="mt-5 flex items-center gap-3 border-t border-line/70 pt-5"><div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${story.color}`}>{story.initial}</div><div><p className="text-xs font-semibold">{story.name}<span className="ml-2 font-normal text-muted">· 示例旅行者</span></p><p className="mt-1 text-[10px] text-muted">{story.theme}</p></div><CheckCircle2 size={15} className="ml-auto text-pine/60" /></div></Card>)}</div>
        </div>
      </section>

      <section data-node-id="4:36" aria-labelledby="cta-title" className="cta-pattern relative overflow-hidden bg-pine px-5 py-20 text-center text-white lg:py-[84px]"><span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-seafoam/30 bg-white/5"><Sparkles size={21} className="text-[#ecdbb9]" /></span><p className="font-display text-[10px] font-semibold tracking-[3px] text-seafoam/75">YOUR NEXT CHAPTER STARTS HERE</p><h2 id="cta-title" className="mt-5 text-[31px] font-semibold leading-snug tracking-tight lg:text-[42px]">世界很大，先从湖北出发。</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">把心动的风景收藏起来，<span className="inline-block">让 Wander AI 陪你把下一段旅程慢慢规划好。</span></p><Button variant="white" onClick={() => showAuth()} className="mt-8 min-h-13 rounded-full px-8">注册，开启我的旅程 <ArrowUpRight size={17} /></Button><p className="mt-5 text-[10px] text-white/50">属于你的灵感，属于你的旅行节奏。</p></section>
    </main>

    <footer data-node-id="4:37" className="bg-cream px-5 py-12 lg:px-10"><div className="mx-auto max-w-[1200px]"><div className="grid gap-10 sm:grid-cols-[1.6fr_1fr_1fr_1fr]"><div><Brand /><p className="mt-5 text-xs leading-7 text-muted">用 AI 发现世界，用旅行连接自己。<br />Wander AI · 寻游湖北</p><span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[10px] text-pine"><Leaf size={12} /> 让每一次出发，都更有意义</span></div>
      <FooterColumn title="发现湖北" items={[['精选目的地', scrollToDestinations], ['行程灵感', showPlanner], ['旅行者说', () => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })]]} />
      <FooterColumn title="关于 Wander" items={[['我们的故事', () => showInfo('关于 Wander AI', 'Wander AI 是一份围绕湖北旅行打造的网页设计原型。这里用真实的湖北景点照片，展示从探索目的地到整理行程灵感的体验。')], ['图片与来源', () => setModal({ type: 'credits' })], ['联系与反馈', () => showInfo('联系与反馈', '欢迎把你想去的湖北景点、喜欢的页面细节和改进建议直接告诉设计者，让下一版更贴近你的旅行方式。')]]} />
      <FooterColumn title="旅行支持" items={[['使用帮助', () => showInfo('怎样使用这份原型', '选择目的地和人数后，点击「发现好旅程」筛选卡片。点击爱心收藏旅行灵感，点击「探索行程」查看建议路线。收藏仅保存在当前浏览器中。')], ['预订说明', () => showInfo('预订说明', '当前页面用于高保真设计与交互体验，暂不提供真实订单、支付和旅游库存。行程时长为示意建议，实际交通、开放时间与景区安排请在出发前确认。')], ['我的收藏', () => { changeFilter('saved'); scrollToDestinations(); }]]} />
      </div><div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[10px] text-muted"><p className="font-display">© 2026 Wander AI. Made for your next adventure.</p><div className="flex flex-wrap items-center gap-6"><button onClick={() => showInfo('隐私说明', '此原型的表单不会向服务器提交姓名或邮箱，也不会创建真实账号。目的地收藏仅保存在此浏览器；可通过取消收藏或清理网站数据删除。')}>隐私说明</button><button onClick={() => setModal({ type: 'credits' })}>图片鸣谢</button><span>中文 / 湖北</span><span className="rounded-full border border-line px-2.5 py-1">交互原型</span></div></div></div></footer>

    {toast && <div role="status" className="fixed bottom-6 left-1/2 z-60 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-center text-xs text-white shadow-xl"><Check size={16} className="shrink-0 text-seafoam" />{toast}</div>}
    {modal?.type === 'destination' && <Modal title={modal.destination.title} onClose={closeModal} wide><img src={modal.destination.image} alt={modal.destination.imageAlt} className="h-60 w-full object-cover sm:h-72" style={modal.destination.imagePosition ? { objectPosition: modal.destination.imagePosition } : undefined} /><div className="p-6 sm:p-8"><div className="flex items-center gap-4 text-xs text-muted"><span className="flex items-center gap-1"><MapPin size={14} />{modal.destination.region}</span><span className="flex items-center gap-1"><Clock3 size={14} />建议 {modal.destination.duration}</span></div><p className="mt-5 text-sm leading-8 text-muted">{modal.destination.overview}</p><h3 className="mb-4 mt-6 font-semibold">一段可以慢慢展开的旅程</h3><ol className="space-y-3">{modal.destination.itinerary.map((day, i) => <li key={day} className="flex gap-3 text-sm leading-7"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage font-display text-xs font-bold text-pine">{i + 1}</span><span>{day}</span></li>)}</ol><p className="mt-5 text-[11px] leading-6 text-muted">行程仅作灵感建议；请根据天气、景区安排与个人体力调整。当前原型不提供实际预订。</p><Button className="mt-6 w-full" onClick={() => toggleSave(modal.destination)}><Heart size={16} fill={saved.includes(modal.destination.id) ? 'currentColor' : 'none'} />{saved.includes(modal.destination.id) ? '已收藏 · 点击取消' : '收藏这段旅行灵感'}</Button></div></Modal>}
    {modal?.type === 'auth' && <Modal title={modal.mode === 'signup' ? '下一段旅程，从这里开始' : '欢迎回到 Wander AI'} onClose={closeModal}><div className="p-7">{authComplete ? <div className="py-8 text-center"><CheckCircle2 size={46} className="mx-auto text-pine" /><h3 className="mt-5 text-xl font-semibold">界面体验已完成</h3><p className="mt-3 text-sm leading-7 text-muted">这是高保真交互原型，未创建真实账户。<br />你可以继续探索、收藏湖北目的地。</p><Button className="mt-6" onClick={closeModal}>继续探索 <ArrowRight size={16} /></Button></div> : <><Brand /><p className="mb-6 mt-4 text-sm leading-7 text-muted">收藏你的心动风景，让每一次出发更有方向。</p><form onSubmit={e => { e.preventDefault(); setAuthComplete(true); }} className="space-y-4">{modal.mode === 'signup' && <label className="block text-xs font-medium">怎么称呼你<InputField className="mt-2" placeholder="你的旅行昵称" required maxLength={30} autoComplete="nickname" /></label>}<label className="block text-xs font-medium">电子邮箱<InputField className="mt-2" type="email" placeholder="hello@example.com" required autoComplete="email" /></label><p className="flex items-start gap-2 rounded-lg bg-sage p-3 text-[11px] leading-6 text-muted"><ShieldCheck size={16} className="mt-1 shrink-0 text-pine" />原型体验，不创建真实账户，不提交你的邮箱。</p><Button type="submit" className="w-full">{modal.mode === 'signup' ? '体验注册' : '体验登录'} <ArrowRight size={16} /></Button></form><button onClick={() => showAuth(modal.mode === 'signup' ? 'login' : 'signup')} className="mt-5 block w-full text-center text-xs text-muted">{modal.mode === 'signup' ? '已有账号？' : '还没有账号？'}<span className="ml-1 font-semibold text-pine">{modal.mode === 'signup' ? '登录' : '注册'}</span></button></>}</div></Modal>}
    {modal?.type === 'planner' && <Modal title="找一点，属于你的旅行灵感" onClose={closeModal}><div className="p-7"><span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[11px] text-pine"><Sparkles size={14} /> 湖北行程灵感预览</span><h3 className="mb-5 mt-6 text-xl font-semibold">这次，想怎样度过假期？</h3><div className="grid grid-cols-2 gap-3">{(['nature', 'city'] as const).map(kind => <button key={kind} onClick={() => { setInterest(kind); setPlanReady(false); }} aria-pressed={interest === kind} className={`flex flex-col items-center gap-3 rounded-xl border p-5 text-sm transition ${interest === kind ? 'border-pine bg-sage text-pine' : 'border-line text-muted hover:border-pine/40'}`}>{kind === 'nature' ? <Mountain size={27} /> : <MapPin size={27} />}{kind === 'nature' ? '山水与自然' : '城市与人文'}</button>)}</div><Button onClick={() => setPlanReady(true)} className="mt-5 w-full"><Sparkles size={16} /> 发现我的行程灵感</Button>{planReady && <div className="mt-6 rounded-2xl border border-line bg-cream p-5"><p className="font-display text-[10px] font-bold tracking-widest text-terracotta">YOUR NEXT JOURNEY</p><h4 className="mt-2 text-lg font-bold">{suggested.title} · {suggested.duration}</h4><p className="mt-2 text-xs leading-6 text-muted">{suggested.description}</p><button onClick={() => setModal({ type: 'destination', destination: suggested })} className="mt-4 flex items-center gap-1 text-xs font-semibold text-pine">展开建议行程 <ChevronRight size={16} /></button></div>}<p className="mt-5 text-[11px] leading-6 text-muted">根据主题展示预设的湖北旅行建议，正式智能规划服务将在后续开放。</p></div></Modal>}
    {modal?.type === 'credits' && <Modal title="真实风景，感谢记录它的人" onClose={closeModal} wide><div className="space-y-5 p-7"><p className="text-sm leading-7 text-muted">本页使用对应湖北景点的实拍照片。图片按容器比例显示裁切，部分作为文字背景叠加了色罩；原始图像的许可保持不变。</p>{imageCredits.map(c => <div key={c.subject} className="rounded-xl border border-line p-4"><h3 className="text-sm font-semibold">{c.subject}</h3><p className="mt-2 text-xs text-muted">摄影 / 来源：{c.author}</p><div className="mt-3 flex flex-wrap gap-5 text-xs font-medium text-pine"><a href={c.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">原图与来源 <ArrowUpRight size={13} /></a><a href={c.licenseUrl} target="_blank" rel="noreferrer">{c.license}</a></div></div>)}</div></Modal>}
    {modal?.type === 'info' && <Modal title={modal.title} onClose={closeModal}><p className="p-7 text-sm leading-8 text-muted">{modal.body}</p></Modal>}
  </>;
}

function FooterColumn({ title, items }: { title: string; items: [string, () => void][] }) {
  return <div><h3 className="mb-5 text-xs font-semibold">{title}</h3><ul className="space-y-4">{items.map(([label, action]) => <li key={label}><button onClick={action} className="text-xs text-muted transition hover:text-pine">{label}</button></li>)}</ul></div>;
}
