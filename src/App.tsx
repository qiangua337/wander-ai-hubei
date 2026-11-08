import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Heart, Leaf, MapPin, Menu, MessageCircle, Route, Search, X } from 'lucide-react';
import { Brand, Button, InputField, SelectField } from './components/ui';
import { Modal } from './components/Modal';
import { DestinationCard } from './components/DestinationCard';
import { TravelGuide } from './components/TravelGuide';
import { Planner } from './components/Planner';
import { CityPicker } from './components/CityPicker';
import { HomeHero } from './components/HomeHero';
import { CultureAtlas } from './components/CultureAtlas';
import { TravelLife } from './components/TravelLife';
import { RouteTemplates } from './components/RouteTemplates';
import { TravelFaq } from './components/TravelFaq';
import { JourneyInvitation } from './components/TravelStories';
import { Wishlist } from './components/Wishlist';
import { ExploreSummary } from './components/ExploreSummary';
import { SupportDesk } from './components/SupportDesk';
import type { SupportAction } from './support';
import { sortDestinations, type DestinationSort } from './discovery';
import { defaultProfile, normalizeProfile, parsePlanUrl, templates, validDate, type Profile } from './planning';
import { CreditsDialog } from './components/SiteDialogs';
import { cities, cityById, cityPhotos, destinations, destinationById, featuredDestinations, type Destination } from './data';
import { findDestinations, type DurationFilter, type Filter } from './travel';

type ModalState = { type: 'guide'; cityId: string; placeId?: string } | { type: 'planner'; profile?: Profile } | { type: 'wishlist' } | { type: 'support' } | { type: 'credits' } | { type: 'info'; title: string; body: string } | null;
const mainNav = [['popular', '山河名胜'], ['culture', '荆楚文化'], ['routes', '经典路线'], ['destinations', '按市探索'], ['travel-life', '吃住指南'], ['faq', '行前指南']] as const;
const filters: { key: Filter; label: string }[] = [{ key: 'all', label: '全部探索' }, { key: 'nature', label: '山水自然' }, { key: 'city', label: '城市人文' }, { key: 'family', label: '亲子研学' }, { key: 'saved', label: '我的收藏' }];
function loadBrowse() {
  try {
    const v = JSON.parse(sessionStorage.getItem('wander-browse-v2') || '{}');
    return { city: Object.hasOwn(cityById, String(v.city)) ? v.city as string : 'all', filter: filters.some(f => f.key === v.filter) ? v.filter as Filter : 'all' as Filter, keyword: typeof v.keyword === 'string' ? v.keyword.slice(0, 100) : '', limit: Number.isInteger(v.limit) && v.limit >= 12 && v.limit <= 72 ? v.limit as number : 12, duration: ['any', 'half', 'day'].includes(v.duration) ? v.duration as DurationFilter : 'any' as DurationFilter, date: typeof v.date === 'string' && validDate(v.date) ? v.date : '', travelers: typeof v.travelers === 'string' && /^[1-6]$/.test(v.travelers) ? v.travelers : '2', order: ['recommended', 'duration', 'city'].includes(v.order) ? v.order as DestinationSort : 'recommended' as DestinationSort };
  } catch { return { city: 'all', filter: 'all' as Filter, keyword: '', limit: 12, duration: 'any' as DurationFilter, date: '', travelers: '2', order: 'recommended' as DestinationSort }; }
}
function loadSaved(): string[] {
  try { const value = JSON.parse(localStorage.getItem('wander-saved') || '[]'); return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && Object.hasOwn(destinationById, id)))] : []; } catch { return []; }
}

export default function App() {
  const [browse] = useState(loadBrowse);
  const [selection, setSelection] = useState(browse.city);
  const [date, setDate] = useState(browse.date);
  const [travelers, setTravelers] = useState(browse.travelers);
  const [activeCity, setActiveCity] = useState(browse.city);
  const [filter, setFilter] = useState<Filter>(browse.filter);
  const [duration, setDuration] = useState<DurationFilter>(browse.duration);
  const [keyword, setKeyword] = useState(browse.keyword);
  const [limit, setLimit] = useState(browse.limit);
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [order, setOrder] = useState<DestinationSort>(browse.order);
  const [modal, setModal] = useState<ModalState>(() => { const profile = parsePlanUrl(window.location.search); return profile ? { type: 'planner', profile } : null; });
  const [toast, setToast] = useState('');
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => { try { localStorage.setItem('wander-saved', JSON.stringify(saved)); } catch { /* Favorites remain available in this session. */ } }, [saved]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const cover = document.querySelector('.home-cover'); if (!cover) return; const observer = new IntersectionObserver(([entry]) => setShowQuickNav(!entry.isIntersecting)); observer.observe(cover); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const sections = mainNav.map(([id]) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    const update = () => setActiveSection([...sections].reverse().find(section => section.getBoundingClientRect().top <= 140)?.id || '');
    const observer = new IntersectionObserver(update, { rootMargin: '-96px 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
    update();
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(() => sortDestinations(findDestinations(activeCity, keyword, filter, saved, duration), order), [activeCity, keyword, filter, saved, duration, order]);
  const activeGuide = cityById[activeCity];
  const photo = activeGuide ? cityPhotos[activeCity] : undefined;
  const scrollToCities = () => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToCityPicker = () => document.querySelector('.city-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const showPlanner = () => { setMobileMenu(false); setModal({ type: 'planner' }); };
  const showSupport = () => { setMobileMenu(false); setModal({ type: 'support' }); };
  const openPlace = (place: Destination) => setModal({ type: 'guide', cityId: place.cityId, placeId: place.id });
  const toggleSave = (place: Destination) => {
    const wasSaved = saved.includes(place.id);
    setSaved(previous => previous.includes(place.id) ? previous.filter(id => id !== place.id) : [...previous, place.id]);
    setToast(wasSaved ? `已取消收藏「${place.title}」` : `已收藏「${place.title}」，在「我的收藏」中查看`);
  };
  const chooseCity = (id: string) => { setActiveCity(id); setSelection(id); setKeyword(''); setLimit(12); setSearched(false); };
  const reset = () => { chooseCity('all'); setFilter('all'); setDuration('any'); };
  const showSaved = () => { setModal({ type: 'wishlist' }); setMobileMenu(false); };
  const planCity = (id: string) => { if (date && !validDate(date)) { setToast('请先填写有效的出发日期，或清空日期。'); return; } setModal({ type: 'planner', profile: defaultProfile(id, date, Number(travelers)) }); };
  const showTemplate = (id: string) => { const template = templates.find(item => item.id === id); if (!template) return; if (date && !validDate(date)) { setToast('请先填写有效的出发日期，或清空日期。'); return; } setModal({ type: 'planner', profile: { ...defaultProfile(template.cityId, date, Number(travelers)), template: id } }); };
  const exploreMode = (mode: 'nature' | 'city' | 'family' | 'food') => { if (mode === 'food') { document.getElementById('travel-life')?.scrollIntoView({ behavior: 'smooth' }); return; } reset(); setFilter(mode); scrollToCities(); };
  const search = (event: FormEvent) => { event.preventDefault(); if (date && !validDate(date)) { setToast('请输入有效日期，例如 2026-11-01。'); return; } chooseCity(selection); setFilter('all'); setSearched(true); scrollToCities(); };
  const showInfo = (title: string, body: string) => setModal({ type: 'info', title, body });
  const supportAction = (action: SupportAction) => {
    if (action.kind === 'plan' && action.profile) { setModal({ type: 'planner', profile: normalizeProfile(action.profile) }); return; }
    if (action.kind === 'wishlist') { showSaved(); return; }
    if (action.kind === 'explore') { closeModal(); reset(); scrollToCities(); return; }
    if (action.kind === 'template' && action.templateId) { showTemplate(action.templateId); return; }
    if (action.kind === 'place' && action.placeId && Object.hasOwn(destinationById, action.placeId)) { openPlace(destinationById[action.placeId]); return; }
    if (action.cityId && Object.hasOwn(cityById, action.cityId)) {
      if (action.kind === 'plan') planCity(action.cityId);
      else if (action.kind === 'city') setModal({ type: 'guide', cityId: action.cityId });
    }
  };
  const copyPlan = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setToast('已复制，可粘贴到聊天或备忘录中使用'); }
    catch { setToast('暂时无法复制，请使用下载按钮保存行程'); }
  };

  useEffect(() => { try { sessionStorage.setItem('wander-browse-v2', JSON.stringify({ city: activeCity, filter, keyword, limit, duration, date: validDate(date) ? date : '', travelers, order })); } catch { /* Session memory is optional. */ } }, [activeCity, filter, keyword, limit, duration, date, travelers, order]);
  useEffect(() => {
    const remember = () => { try { sessionStorage.setItem('wander-scroll-v2', String(window.scrollY)); } catch { /* Continue without scroll memory. */ } };
    let position = 0;
    try { position = Number(sessionStorage.getItem('wander-scroll-v2')) || 0; } catch { /* Continue at the top. */ }
    if (!window.location.search && position > 0) window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: position, behavior: 'instant' })));
    window.addEventListener('pagehide', remember); window.addEventListener('beforeunload', remember);
    return () => { window.removeEventListener('pagehide', remember); window.removeEventListener('beforeunload', remember); };
  }, []);

  return <>
    <a href="#destinations" className="sr-only z-50 rounded-lg bg-white px-5 py-3 text-pine focus:not-sr-only focus:fixed focus:left-4 focus:top-4">跳转到城市目录</a>
    <div id="top" aria-hidden="true" /><header className="site-header"><div className="site-nav page-width"><Brand />
      <nav aria-label="主导航" className="hidden items-center gap-7 text-xs font-medium lg:flex">{mainNav.map(([id,label]) => <a key={id} href={'#'+id} aria-current={activeSection === id ? 'location' : undefined} className="text-muted hover:text-pine">{label}</a>)}</nav>
      <div className="hidden items-center gap-3 lg:flex"><Button variant="subtle" onClick={showSaved}><Heart size={16} />我的收藏</Button><Button onClick={showPlanner}>开始规划<ArrowUpRight size={16} /></Button></div>
      <button aria-label={mobileMenu ? '关闭菜单' : '打开菜单'} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-pine lg:hidden">{mobileMenu ? <X size={24} /> : <Menu size={24} />}</button>
    </div>{mobileMenu && <nav aria-label="手机导航" className="max-h-[calc(100dvh-64px)] overflow-y-auto absolute inset-x-0 top-16 border-b border-line bg-white px-6 py-6 shadow-lg lg:hidden"><div className="flex flex-col gap-5"><a href="#popular" onClick={() => setMobileMenu(false)}>热门精选</a><a href="#culture" onClick={() => setMobileMenu(false)}>荆楚文化</a><a href="#routes" onClick={() => setMobileMenu(false)}>经典路线</a><a href="#destinations" onClick={() => setMobileMenu(false)}>按市探索</a><button onClick={showPlanner} className="text-left">行程灵感</button><a href="#travel-life" onClick={() => setMobileMenu(false)}>吃住有着落</a><button onClick={showSupport} className="text-left">旅行问答</button><button onClick={showSaved} className="text-left">我的收藏</button><Button onClick={showPlanner}>我的行程<ArrowRight size={16} /></Button></div></nav>}</header>

    <main>
      <HomeHero selection={selection} date={date} travelers={travelers} onCity={setSelection} onDate={setDate} onTravelers={setTravelers} onSearch={search} onPlan={() => planCity(selection)} onTemplate={showTemplate} onExplore={exploreMode} />

      <section id="popular" aria-labelledby="popular-title" className="page-width section-space">
        <div className="section-heading"><div><Eyebrow text="值得专程前往" /><h2 id="popular-title" className="section-title">先从一处心动开始。</h2></div><div className="section-aside"><p>看江城、看峡谷，也看古城与宫观。<br />每一站，都有值得细读的线索。</p><a href="#destinations" className="text-link">探索全部目的地<ArrowUpRight size={17} strokeWidth={1.4} /></a></div></div>
        <div className="featured-grid">{featuredDestinations.map((place, index) => <DestinationCard key={place.id} place={place} featured index={index} saved={saved.includes(place.id)} onSave={() => toggleSave(place)} onOpen={() => openPlace(place)} />)}</div>

      </section>

      <CultureAtlas onOpenPlace={id => openPlace(destinationById[id])} />
      <RouteTemplates onChoose={profile => showTemplate(profile.template)} />

      <section id="destinations" aria-labelledby="destinations-title" className="city-section section-space"><div className="page-width">
        <div className="section-heading"><div><Eyebrow text="一城一味，各有精彩" /><h2 id="destinations-title" className="section-title">从一座城，走进湖北。</h2><p className="mt-3 text-sm leading-7 text-muted">找景点、读文博、寻地方风味，再安排适合你的路线。</p></div><span className="inline-flex items-center gap-3 pb-1 text-xs text-muted"><BookOpen size={15} strokeWidth={1.3} />{cities.length} 个市州 · {destinations.length} 处精选</span></div>
        <CityPicker value={activeCity} onChange={chooseCity} />
        {activeGuide && <section aria-label={`${activeGuide.shortName}城市介绍`} className={`city-overview mt-8 grid overflow-hidden border border-line bg-cream ${photo ? 'md:grid-cols-[1.5fr_1fr]' : ''}`}><div className="p-6 sm:p-7"><p className="mb-2 text-xs font-semibold text-terracotta">{activeGuide.area} / {activeGuide.name}</p><h3 className="font-sans text-2xl font-semibold leading-relaxed">{activeGuide.tagline}</h3><p className="mt-3 text-sm leading-7 text-muted">{activeGuide.intro}</p><p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted"><Leaf size={15} className="mt-1 shrink-0 text-pine" />{activeGuide.season}</p><Button className="mt-5" onClick={() => setModal({ type: 'guide', cityId: activeCity })}><Route size={16} />看{activeGuide.shortName} {activeGuide.days.length} 天完整路线<ArrowRight size={16} /></Button><button className="mt-3 block min-h-10 text-xs font-semibold text-pine underline underline-offset-4" onClick={() => setModal({ type: 'planner', profile: defaultProfile(activeCity, date, Number(travelers)) })}>选交通、住宿与预算，定制这座城的行程</button></div>{photo?.filename && <figure className="relative min-h-48"><img src={`/images/${photo.filename}`} alt={photo.alt || photo.subject} loading="lazy" className="h-52 w-full object-cover md:absolute md:inset-0 md:h-full" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-5 pb-3 pt-10 text-xs text-white">{photo.subject} · 文化与风景记录</figcaption></figure>}</section>}
        <div className="catalogue-filters"><div className="catalogue-filter-main">
          <div role="group" aria-label="目的地分类" className="catalogue-tabs">{filters.map(item => <button key={item.key} onClick={() => { setFilter(item.key); setLimit(12); }} aria-pressed={filter === item.key} className={filter === item.key ? 'is-active' : ''}>{item.key === 'saved' && <Heart size={13} />}{item.label}{item.key === 'saved' && saved.length > 0 && <span>{saved.length}</span>}</button>)}</div>
          <div className="catalogue-tools"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" /><InputField aria-label="搜索景点或主题" value={keyword} onChange={event => { setKeyword(event.target.value); setLimit(12); setSearched(false); }} placeholder="搜景点、主题或风味" className="h-11 pl-9 pr-9" />{keyword && <button onClick={() => { setKeyword(''); setLimit(12); }} aria-label="清除搜索关键词" className="absolute right-0 top-0.5 flex h-10 w-9 items-center justify-center text-muted"><X size={16} /></button>}</div><SelectField aria-label="游玩时长筛选" className="h-11" value={duration} onChange={event => { setDuration(event.target.value as DurationFilter); setLimit(12); }}><option value="any">游玩时长不限</option><option value="half">半天以内</option><option value="day">一天及以上</option></SelectField></div>
        </div><div aria-label="搜索灵感" className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="mr-1 text-muted">试试：</span>{['古城','博物馆','湿地','热干面'].map(term => <button key={term} onClick={() => { setKeyword(term); setFilter('all'); setLimit(12); setSearched(false); }} className="min-h-8 rounded-full bg-sand px-3 text-muted hover:text-pine">{term}</button>)}{(activeCity !== 'all' || filter !== 'all' || keyword || duration !== 'any') && <button className="ml-auto min-h-9 px-2 text-pine" onClick={reset}>清空筛选</button>}</div></div>
        {searched && <p className="mt-5 text-xs text-muted">为 {travelers} 位旅行者整理{date ? ` · ${date} 出发` : ''}</p>}
        <ExploreSummary city={activeGuide?.shortName || '湖北全境'} count={visible.length} order={order} onOrder={value => { setOrder(value); setLimit(12); }} savedCount={saved.length} onSaved={showSaved} selections={[
          ...(activeCity !== 'all' ? [{ id:'city', label:activeGuide.shortName, onRemove:() => { setActiveCity('all'); setSelection('all'); setLimit(12); } }] : []),
          ...(filter !== 'all' ? [{ id:'type', label:filters.find(item => item.key === filter)!.label, onRemove:() => { setFilter('all'); setLimit(12); } }] : []),
          ...(duration !== 'any' ? [{ id:'duration', label:duration === 'half' ? '半天以内' : '一天及以上', onRemove:() => { setDuration('any'); setLimit(12); } }] : []),
          ...(keyword ? [{ id:'keyword', label:'关键词：'+keyword, onRemove:() => { setKeyword(''); setLimit(12); } }] : [])
        ]} />
        {visible.length > 0 && <div className="browse-location"><span><strong>{activeGuide?.shortName || '湖北全境'}</strong>{visible.length} 个去处 · {filters.find(item => item.key === filter)!.label}</span><button onClick={scrollToCityPicker}><MapPin size={13} />换座城市</button></div>}
        <div className="catalogue-grid mt-5" aria-live="polite">{visible.slice(0, limit).map(place => <DestinationCard key={place.id} place={place} saved={saved.includes(place.id)} onSave={() => toggleSave(place)} onOpen={() => openPlace(place)} />)}</div>
        {visible.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center"><Search size={28} className="mx-auto text-muted" /><h3 className="mt-4 text-lg font-semibold">{filter === 'saved' && saved.length === 0 ? '先收藏一处让你心动的风景' : '换个城市或关键词，再找找看'}</h3><p className="mt-2 text-sm leading-7 text-muted">{filter === 'saved' ? '点击卡片上的爱心，收藏只保存在当前浏览器。' : '可以试试「古城」「博物馆」「湿地」，或清空当前筛选。'}</p><Button variant="neutral" className="mt-5" onClick={reset}>清空筛选，探索湖北<ArrowRight size={16} /></Button></div>}
        {visible.length > 0 && <div className="mt-8 text-center"><p className="mb-4 text-xs text-muted">正在看 {Math.min(limit, visible.length)} / {visible.length} 个去处 · 下方继续探索</p>{visible.length > limit && <Button className="min-w-64" onClick={() => setLimit(value => value + 12)}>继续探索 · 还有 {visible.length - limit} 个去处<ChevronDown size={16} /></Button>}</div>}
      </div></section>

      <TravelLife onExplore={id => { chooseCity(id); setFilter("all"); setDuration("any"); scrollToCities(); }} onPlan={planCity} />
      <TravelFaq onAsk={showSupport} />
      <JourneyInvitation onPlan={showPlanner} />
    </main>

    <footer className="site-footer"><div className="page-width"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr]"><div><Brand inverse /><p className="mt-4 max-w-xs text-xs leading-7 text-muted">从一座城市开始，慢慢认识湖北。<br />{cities.length} 个市州 · {destinations.length} 个去处 · {cities.length} 份路线</p><span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs text-pine"><Leaf size={12} />让每一次出发，都更有意义</span></div>
      <FooterColumn title="发现湖北" items={[[ '热门精选', () => document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' }) ], ['按市探索', scrollToCities], ['行程灵感', showPlanner]]} />
      <FooterColumn title="旅行资料" items={[[ '如何用这份攻略', () => showInfo('怎样规划一次湖北旅行', '先选择城市，再看景点攻略。点击「开始规划」选择单城或跨城模板，调整同行人群、交通、预算与具体章节。结果包含每日安排、住宿片区与美食建议，可保存到本浏览器、下载文本或复制分享链接。') ], ['图片与来源', () => setModal({ type: 'credits' })], ['关于 Wander', () => showInfo('关于 Wander AI', 'Wander AI 是围绕湖北旅行打造的高保真交互网站。本版覆盖全省 17 个市州、直管市与林区，景点事实参考官方文旅与景区资料，路线组织与时段为编辑建议。')]]} />
      <FooterColumn title="旅行支持" items={[['我的收藏', showSaved], ['预订说明', () => showInfo('预订说明', '本站提供旅行参考与界面体验，暂不提供真实订单、支付与实时旅游库存。参观预约、开放、票种、车船班次和天气请在出发前通过景区官方渠道确认。')], ['旅行问答', showSupport]]} />
      </div><div className="footer-signature" aria-hidden="true"><span>山河有来处，旅途有回响。</span><span>寻游湖北<br />循着山河，走进荆楚。</span></div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted"><p className="font-display">© 2026 Wander AI · 湖北旅行指南</p><div className="flex flex-wrap items-center gap-5"><button onClick={() => showInfo('隐私说明', '目的地收藏、规划草稿和已保存行程保存在当前浏览器，可删除或清理网站数据。分享链接包含所选旅行设置与日期，不包含自由备注。旅行问答基于本站资料在本页匹配，不上传问题、不连接大模型；对话仅在当前页面的内存中保留，刷新后清空。小游中的行程预览仅保留在本页，带入规划后按本地草稿保存。行程复制与下载在你的设备上完成，不创建真实账号。')}>隐私说明</button><button onClick={() => setModal({ type: 'credits' })}>图片鸣谢</button><span>中文 / 湖北</span><span className="rounded-full border border-line px-2.5 py-1">旅行参考 · 交互原型</span></div></div></div></footer>

    {!modal && <div className="travel-tools"><button className="support-launcher" onClick={showSupport} aria-label="打开湖北旅行问答"><MessageCircle size={18} />旅行问答</button>{showQuickNav && <div className="travel-tools-row"><button onClick={scrollToCityPicker} className="flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-xs font-semibold text-pine shadow-lg"><MapPin size={15} />选城市</button><a href="#top" aria-label="返回顶部" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-pine shadow-lg"><ArrowUp size={18} /></a></div>}</div>}
    <SupportDesk open={modal?.type === 'support'} initialCity={activeCity !== 'all' ? activeCity : selection} initialParty={Number(travelers)} initialDate={date} onClose={closeModal} onAction={supportAction} />
    {toast && createPortal(<div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[70] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-xs leading-6 text-white shadow-xl"><Check size={16} className="shrink-0 text-seafoam" />{toast}</div>, document.body)}
    {modal?.type === 'guide' && <Modal title={modal.placeId ? `${destinationById[modal.placeId].title} · 攻略与路线` : `${cityById[modal.cityId].shortName} · 城市旅行攻略`} onClose={closeModal} wide><TravelGuide key={`${modal.cityId}-${modal.placeId || 'city'}`} city={cityById[modal.cityId]} place={modal.placeId ? destinationById[modal.placeId] : undefined} date={date} travelers={travelers} onCopy={copyPlan} onOpenPlace={openPlace} onPlan={() => setModal({ type: 'planner', profile: defaultProfile(modal.cityId, date, Number(travelers)) })} saved={modal.placeId ? saved.includes(modal.placeId) : undefined} onSave={modal.placeId ? () => toggleSave(destinationById[modal.placeId!]) : undefined} /></Modal>}
    {modal?.type === 'planner' && <Planner initialCity={activeCity} initialDate={date} travelers={travelers} initialProfile={modal.profile} onClose={closeModal} onCopy={copyPlan} />}
    {modal?.type === 'wishlist' && <Wishlist saved={saved} onClose={closeModal} onOpenPlace={openPlace} onRemove={toggleSave} onPlan={planCity} onExplore={() => { closeModal(); reset(); scrollToCities(); }} />}
    {modal?.type === 'credits' && <CreditsDialog onClose={closeModal} />}
    {modal?.type === 'info' && <Modal title={modal.title} onClose={closeModal}><p className="p-7 text-sm leading-8 text-muted">{modal.body}</p></Modal>}
  </>;
}

function Eyebrow({ text }: { text: string }) { return <p className="eyebrow">{text}</p>; }


function FooterColumn({ title, items }: { title: string; items: [string, () => void][] }) { return <div><h3 className="mb-5 text-xs font-semibold">{title}</h3><ul className="space-y-4">{items.map(([label, action]) => <li key={label}><button onClick={action} className="text-xs text-muted hover:text-pine">{label}</button></li>)}</ul></div>; }
