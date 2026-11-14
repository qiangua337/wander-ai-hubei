import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Heart, Menu, MessageCircle, Search, X } from 'lucide-react';
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
import { cities, cityById, destinations, destinationById, featuredDestinations, type Destination } from './data';
import { findDestinations, type DurationFilter, type Filter } from './travel';

type ModalState = { type: 'guide'; cityId: string; placeId?: string } | { type: 'planner'; profile?: Profile; dayIndex?: number } | { type: 'wishlist' } | { type: 'support'; openForm?: boolean; days?: number } | { type: 'credits' } | { type: 'info'; title: string; body: string } | null;
const mainNav = [['popular', '热门去处'], ['routes', '经典路线'], ['destinations', '目的地'], ['culture', '荆楚文化'], ['travel-life', '吃住指南']] as const;
const filters: { key: Filter; label: string }[] = [{ key: 'all', label: '全部' }, { key: 'nature', label: '山水自然' }, { key: 'city', label: '古城文博' }, { key: 'family', label: '亲子研学' }, { key: 'saved', label: '已收藏' }];
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
  const { date, travelers } = browse;
  const [activeCity, setActiveCity] = useState(browse.city);
  const [filter, setFilter] = useState<Filter>(browse.filter);
  const [duration, setDuration] = useState<DurationFilter>(browse.duration);
  const [keyword, setKeyword] = useState(browse.keyword);
  const [limit, setLimit] = useState(browse.limit);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [order, setOrder] = useState<DestinationSort>(browse.order);
  const [modal, setModal] = useState<ModalState>(() => { const profile = parsePlanUrl(window.location.search); return profile ? { type: 'planner', profile } : null; });
  const [toast, setToast] = useState('');
  const catalogueFilters = useRef<HTMLDivElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => { try { localStorage.setItem('wander-saved', JSON.stringify(saved)); } catch { /* Favorites remain available in this session. */ } }, [saved]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const cover = document.querySelector('.home-cover'); if (!cover) return; const observer = new IntersectionObserver(([entry]) => setShowQuickNav(!entry.isIntersecting)); observer.observe(cover); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const sections = mainNav.map(([id]) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    const fromBottom = [...sections].reverse();
    const update = () => setActiveSection(fromBottom.find(section => section.getBoundingClientRect().top <= 114)?.id || '');
    const observer = new IntersectionObserver(update, { rootMargin: '-102px 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
    update();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!mobileMenu) return;
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenu(false); };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [mobileMenu]);

  const visible = useMemo(() => sortDestinations(findDestinations(activeCity, keyword, filter, saved, duration), order), [activeCity, keyword, filter, saved, duration, order]);
  const activeGuide = cityById[activeCity];
  const scrollToCities = () => {
    const heading = resultsHeading.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
  };
  const scrollToCityPicker = () => {
    catalogueFilters.current?.scrollIntoView({ block: 'start' });
    catalogueFilters.current?.querySelector('select')?.focus({ preventScroll: true });
  };
  const showPlanner = () => { setMobileMenu(false); setModal({ type: 'planner' }); };
  const showSupport = (openForm = false, days?: number) => { setMobileMenu(false); setModal({ type: 'support', openForm, days }); };
  const openPlace = (place: Destination) => setModal({ type: 'guide', cityId: place.cityId, placeId: place.id });
  const toggleSave = (place: Destination) => {
    const wasSaved = saved.includes(place.id);
    setSaved(previous => previous.includes(place.id) ? previous.filter(id => id !== place.id) : [...previous, place.id]);
    setToast(wasSaved ? `已取消收藏「${place.title}」` : `已收藏「${place.title}」，在「我的收藏」中查看`);
  };
  const chooseCity = (id: string) => { setActiveCity(id); setSelection(id); setLimit(12); };
  const reset = () => { chooseCity('all'); setKeyword(''); setFilter('all'); setDuration('any'); setOrder('recommended'); };
  const revealDestinations = (id: string, term = '', category: Filter = 'all') => {
    chooseCity(id); setKeyword(term); setFilter(category); setDuration('any'); setOrder('recommended');
    window.requestAnimationFrame(scrollToCities);
  };
  const showSaved = () => { setModal({ type: 'wishlist' }); setMobileMenu(false); };
  const planCity = (id: string) => setModal({ type: 'planner', profile: defaultProfile(id, date, Number(travelers)) });
  const showTemplate = (id: string, dayIndex?: number) => {
    const template = templates.find(item => item.id === id);
    if (template) setModal({ type: 'planner', profile: { ...defaultProfile(template.cityId, date, Number(travelers)), template: id }, dayIndex });
  };
  const exploreMode = (mode: 'nature' | 'city' | 'family' | 'food') => {
    if (mode === 'food') { document.getElementById('travel-life')?.scrollIntoView({ block: 'start' }); return; }
    revealDestinations(selection, '', mode);
  };
  const search = (term: string) => revealDestinations(selection, term);
  const showInfo = (title: string, body: string) => setModal({ type: 'info', title, body });
  const supportAction = (action: SupportAction) => {
    if (action.kind === 'plan' && action.profile) { setModal({ type: 'planner', profile: normalizeProfile(action.profile), dayIndex: action.dayIndex }); return; }
    if (action.kind === 'wishlist') { showSaved(); return; }
    if (action.kind === 'explore') { closeModal(); revealDestinations('all'); return; }
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
    if (!window.location.search && !window.location.hash && position > 0) window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: position, behavior: 'instant' })));
    window.addEventListener('pagehide', remember); window.addEventListener('beforeunload', remember);
    return () => { window.removeEventListener('pagehide', remember); window.removeEventListener('beforeunload', remember); };
  }, []);

  return <>
    <a href="#destinations" className="sr-only z-50 rounded-lg bg-white px-5 py-3 text-pine focus:not-sr-only focus:fixed focus:left-4 focus:top-4">跳转到城市目录</a>
    <div id="top" aria-hidden="true" />
    <header className="site-header">
      <div className="site-nav page-width">
        <Brand onClick={() => setMobileMenu(false)} />
        <nav aria-label="主导航" className="desktop-nav">{mainNav.map(([id, label]) => <a key={id} href={'#' + id} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}</nav>
        <div className="header-actions">
          <button type="button" className="header-saved" onClick={showSaved} aria-label="我的收藏"><Heart size={19} /><span>收藏</span></button>
          <Button className="header-plan" onClick={showPlanner}>我的行程<ArrowUpRight size={16} /></Button>
          <button type="button" aria-label={mobileMenu ? '关闭菜单' : '打开菜单'} aria-expanded={mobileMenu} aria-controls="site-mobile-nav" onClick={() => setMobileMenu(!mobileMenu)} className="header-menu">{mobileMenu ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {mobileMenu && <nav id="site-mobile-nav" aria-label="手机导航" className="mobile-nav">
        {mainNav.map(([id, label]) => <a key={id} href={'#' + id} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMobileMenu(false)}>{label}<ArrowUpRight size={16} /></a>)}
        <a href="#faq" onClick={() => setMobileMenu(false)}>行前问答<ArrowUpRight size={16} /></a>
        <button type="button" onClick={() => showSupport()}><MessageCircle size={17} />问小游</button>
      </nav>}
    </header>

    <main>
      <HomeHero selection={selection} onCity={setSelection} onSearch={search} onPlan={days => showSupport(true, days)} onAsk={() => showSupport()} onExplore={exploreMode} />

      <section id="popular" aria-labelledby="popular-title" className="popular-section section-space">
        <div className="page-width">
          <div className="section-heading"><div><h2 id="popular-title" className="section-title">湖北人气去处</h2><p className="section-detail">看江城夜景，访武当宫观，走进恩施峡谷。</p></div><a href="#destinations" className="text-link">看全部目的地<ArrowUpRight size={17} /></a></div>
          <div className="featured-grid">{featuredDestinations.map(place => <DestinationCard key={place.id} place={place} featured saved={saved.includes(place.id)} onSave={() => toggleSave(place)} onOpen={() => openPlace(place)} />)}</div>
        </div>
      </section>

      <RouteTemplates onChoose={showTemplate} />

      <section id="destinations" aria-labelledby="destinations-title" className="city-section section-space">
        <div className="page-width">
          <div className="section-heading"><div><h2 id="destinations-title" ref={resultsHeading} tabIndex={-1} className="section-title">按城市找去处</h2><p className="section-detail">湖北 {cities.length} 个市州，{destinations.length} 处景点与文化去处。</p></div></div>
          <div className="catalogue-filters" ref={catalogueFilters}>
            <div className="catalogue-tools">
              <CityPicker value={activeCity} onChange={chooseCity} />
              <label className="catalogue-search-field"><span><Search size={15} />景点或主题</span><InputField type="search" aria-label="搜索景点或主题" maxLength={100} value={keyword} onChange={event => { setKeyword(event.target.value); setLimit(12); }} placeholder="例如：古城、博物馆、湿地" /></label>
              <label className="catalogue-duration-field"><span><Clock3 size={15} />游玩时长</span><SelectField aria-label="游玩时长筛选" value={duration} onChange={event => { setDuration(event.target.value as DurationFilter); setLimit(12); }}><option value="any">不限时长</option><option value="half">半天以内</option><option value="day">一天及以上</option></SelectField></label>
            </div>
            <div role="group" aria-label="目的地分类" className="catalogue-tabs">{filters.map(item => <button key={item.key} type="button" onClick={() => { setFilter(item.key); setLimit(12); }} aria-pressed={filter === item.key} className={filter === item.key ? 'is-active' : ''}>{item.key === 'saved' && <Heart size={14} />}{item.label}</button>)}{(activeGuide || filter !== 'all' || duration !== 'any' || keyword.trim()) && <button type="button" className="catalogue-reset" onClick={reset}>清空筛选</button>}</div>
          </div>
          {activeGuide && <div className="catalogue-city-guide"><div><strong>{activeGuide.shortName}</strong><span>{activeGuide.area}</span></div><div><button type="button" onClick={() => setModal({ type: 'guide', cityId: activeCity })}>城市攻略<ArrowUpRight size={15} /></button><button type="button" onClick={() => planCity(activeCity)}>规划{activeGuide.shortName}行程<ArrowUpRight size={15} /></button></div></div>}
          <ExploreSummary city={activeGuide?.shortName || '湖北全境'} count={visible.length} order={order} onOrder={value => { setOrder(value); setLimit(12); }} onChangeCity={scrollToCityPicker} onReset={reset} selections={[
            ...(activeGuide ? [{ id: 'city', label: activeGuide.shortName, onRemove: () => chooseCity('all') }] : []),
            ...(filter !== 'all' ? [{ id: 'type', label: filters.find(item => item.key === filter)!.label, onRemove: () => { setFilter('all'); setLimit(12); } }] : []),
            ...(duration !== 'any' ? [{ id: 'duration', label: duration === 'half' ? '半天以内' : '一天及以上', onRemove: () => { setDuration('any'); setLimit(12); } }] : []),
            ...(keyword.trim() ? [{ id: 'keyword', label: keyword.trim(), onRemove: () => { setKeyword(''); setLimit(12); } }] : []),
          ]} />
          <div className="catalogue-grid">{visible.slice(0, limit).map(place => <DestinationCard key={place.id} place={place} saved={saved.includes(place.id)} onSave={() => toggleSave(place)} onOpen={() => openPlace(place)} />)}</div>
          {visible.length === 0 && <div className="catalogue-empty"><Search size={27} /><h3>{filter === 'saved' && saved.length === 0 ? '还没有收藏的去处' : '没有找到符合条件的去处'}</h3><p>{filter === 'saved' && saved.length === 0 ? '点击景点卡片的爱心，就能在这里找到。' : '可以扩大城市范围，或试试更短的关键词。'}</p><Button variant="neutral" onClick={reset}>查看全部去处<ArrowRight size={16} /></Button></div>}
          {visible.length > limit && <div className="catalogue-more"><p role="status">已显示 {limit} / {visible.length} 处</p><Button variant="neutral" onClick={() => setLimit(value => value + 12)}>加载更多去处<ChevronDown size={16} /></Button></div>}
        </div>
      </section>

      <CultureAtlas onOpenPlace={id => openPlace(destinationById[id])} />
      <TravelLife fallbackCity={selection} onExplore={revealDestinations} onPlan={planCity} />
      <TravelFaq onAsk={() => showSupport()} />
      <JourneyInvitation onPlan={() => showSupport(true)} />
    </main>

    <footer className="site-footer"><div className="page-width">
      <div className="footer-columns">
        <div><Brand inverse /><p className="mt-4 max-w-xs text-sm leading-7 text-muted">湖北的景点、传统与地方风味。按城市浏览攻略，也可以直接规划路线。</p></div>
        <FooterColumn title="发现湖北" items={[['热门去处', () => document.getElementById('popular')?.scrollIntoView()], ['目的地', scrollToCities], ['吃住指南', () => document.getElementById('travel-life')?.scrollIntoView()]]} />
        <FooterColumn title="出行工具" items={[['我的行程', showPlanner], ['我的收藏', showSaved], ['问小游', () => showSupport()]]} />
        <FooterColumn title="关于本站" items={[['图片与来源', () => setModal({ type: 'credits' })], ['行前问答', () => document.getElementById('faq')?.scrollIntoView()], ['预订说明', () => showInfo('预订说明', '本站提供旅行攻略与规划建议。参观预约、开放时间、车船班次和天气请在出发前通过运营方的官方渠道确认。')]]} />
      </div>
      <div className="footer-legal"><p>© 2026 Wander AI · 寻游湖北</p><button onClick={() => showInfo('隐私说明', '目的地收藏、规划草稿和已保存行程保存在当前浏览器，可删除或清理网站数据。分享链接包含所选旅行设置与日期，不包含自由备注。小游依据站内资料在本页匹配，不上传问题。对话保留在当前页面，刷新后清空。')}>隐私说明</button></div>
    </div></footer>

    {showQuickNav && <div className="travel-tools"><a href="#top" aria-label="返回顶部" className="back-to-top"><ArrowUp size={18} /></a><button className="support-launcher" onClick={() => showSupport()} aria-label="打开湖北旅行问答"><MessageCircle size={18} />问小游</button></div>}
    <SupportDesk open={modal?.type === 'support'} openForm={modal?.type === 'support' && !!modal.openForm} initialCity={selection} initialDays={modal?.type === 'support' ? modal.days : undefined} initialParty={Number(travelers)} initialDate={date} onClose={closeModal} onAction={supportAction} />
    {toast && createPortal(<div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[70] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-xs leading-6 text-white shadow-xl"><Check size={16} className="shrink-0 text-seafoam" />{toast}</div>, document.body)}
    {modal?.type === 'guide' && <Modal title={modal.placeId ? `${destinationById[modal.placeId].title} · 攻略与路线` : `${cityById[modal.cityId].shortName} · 城市旅行攻略`} onClose={closeModal} wide><TravelGuide key={`${modal.cityId}-${modal.placeId || 'city'}`} city={cityById[modal.cityId]} place={modal.placeId ? destinationById[modal.placeId] : undefined} date={date} travelers={travelers} onCopy={copyPlan} onOpenPlace={openPlace} onPlan={() => planCity(modal.cityId)} saved={modal.placeId ? saved.includes(modal.placeId) : undefined} onSave={modal.placeId ? () => toggleSave(destinationById[modal.placeId!]) : undefined} /></Modal>}
    {modal?.type === 'planner' && <Planner initialCity={activeCity} initialDate={date} travelers={travelers} initialProfile={modal.profile} initialDayIndex={modal.dayIndex} onClose={closeModal} onCopy={copyPlan} />}
    {modal?.type === 'wishlist' && <Wishlist saved={saved} onClose={closeModal} onOpenPlace={openPlace} onRemove={toggleSave} onPlan={planCity} onExplore={() => { closeModal(); revealDestinations('all'); }} />}
    {modal?.type === 'credits' && <CreditsDialog onClose={closeModal} />}
    {modal?.type === 'info' && <Modal title={modal.title} onClose={closeModal}><p className="p-7 text-sm leading-8 text-muted">{modal.body}</p></Modal>}
  </>;
}

function FooterColumn({ title, items }: { title: string; items: [string, () => void][] }) { return <div><h3 className="mb-5 text-xs font-semibold">{title}</h3><ul className="space-y-4">{items.map(([label, action]) => <li key={label}><button onClick={action} className="text-xs text-muted hover:text-pine">{label}</button></li>)}</ul></div>; }
