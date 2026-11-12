import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bookmark, Check, MapPin, Route, Sparkles, Trash2 } from 'lucide-react';
import { cities, cityById, cityPhotos } from '../data';
import { arrivalLabels, departureLabels, getTripTimingConflict, mobilityLabels, budgetLabels, buildTrip, defaultProfile, estimateBudget, groupLabels, interestLabels, normalizeProfile, recommendDays, recommendConstrainedDays, templates, tripTitle, validDate, type Profile } from '../planning';
import { Modal } from './Modal';
import { PlannedTrip } from './PlannedTrip';
import { Button, SelectField, InputField } from './ui';
import './planning-ui.css';

type SavedPlan = { id: string; profile: Profile };
function readPlans(): SavedPlan[] {
  try {
    const value = JSON.parse(localStorage.getItem('wander-plans-v2') || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && item.profile).slice(0, 5).map(item => ({ id: item.id, profile: normalizeProfile(item.profile) })) : [];
  } catch { return []; }
}
function StepHeading({ number, title }: { number: string; title: string }) {
  return <div className="planner-step-heading"><span>{number}</span><h4>{title}</h4></div>;
}
export function Planner({ initialCity, initialDate, travelers, initialProfile, onClose, onCopy }: { initialCity: string; initialDate: string; travelers: string; initialProfile?: Profile; onClose: () => void; onCopy: (text: string) => void }) {
  const [profile, setProfile] = useState<Profile>(() => {
    const fallback = defaultProfile(initialCity, initialDate, Number(travelers));
    if (initialProfile) return normalizeProfile(initialProfile, fallback);
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('wander-draft-v2') || 'null');
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return fallback;
      const candidate = stored as Partial<Profile>;
      if (typeof candidate.cityId !== 'string' || !Object.hasOwn(cityById, candidate.cityId) || !Array.isArray(candidate.indices)) return fallback;
      const draft = normalizeProfile(stored, fallback);
      // Reopening a draft keeps its dates, party and choices; an explicit profile above starts afresh.
      if (!Object.hasOwn(cityById, initialCity) || draft.cityId === initialCity) return draft;
      // A different city reuses the draft's travel preferences, dates and party, then rebuilds its chapters.
      return { ...draft, cityId: initialCity, template: 'custom', indices: recommendDays(initialCity, Math.min(draft.indices.length || 2, cityById[initialCity].days.length), draft.interest) };
    } catch { return fallback; }
  });
  const [ready, setReady] = useState(() => Boolean(initialProfile) && !getTripTimingConflict(profile) && buildTrip(profile).length > 0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(readPlans);
  const [feedback, setFeedback] = useState(() => (initialProfile && getTripTimingConflict(profile)) || '');
  const result = useRef<HTMLDivElement>(null);
  const settings = useRef<HTMLDivElement>(null);
  const city = cityById[profile.cityId], selectedTemplate = templates.find(template => template.id === profile.template);
  const days = buildTrip(profile), budget = estimateBudget(profile, days.length);
  const routeCities = [...new Set(days.map(day => day.cityId))];
  const timingConflict = getTripTimingConflict(profile);
  const previewImage = selectedTemplate?.image || (cityPhotos[city.id]?.filename ? '/images/' + cityPhotos[city.id].filename : undefined);
  const focusResult = (behavior: ScrollBehavior = 'smooth') => window.requestAnimationFrame(() => {
    result.current?.scrollIntoView({ behavior, block: 'start' });
    result.current?.focus({ preventScroll: true });
  });
  const edit = () => {
    setReady(false);
    window.requestAnimationFrame(() => {
      settings.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      settings.current?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    if (!initialProfile || getTripTimingConflict(initialProfile) || !buildTrip(initialProfile).length) return;
    const frame = window.requestAnimationFrame(() => {
      result.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      result.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialProfile]);
  useEffect(() => { try { localStorage.setItem('wander-draft-v2', JSON.stringify(profile)); } catch { /* Planning remains usable when storage is unavailable. */ } }, [profile]);
  const update = (patch: Partial<Profile>) => { setProfile(previous => ({ ...previous, ...patch })); setReady(false); setFeedback(''); };
  const updateChapters = (patch: Partial<Profile>, count = profile.indices.length || 2) => {
    const next = { ...profile, ...patch };
    const indices = recommendConstrainedDays(next.cityId, count, next.interest, next.mobility);
    update({ ...patch, indices });
    if (indices.length < count) setFeedback(`现有符合体力条件的章节只有 ${indices.length} 天，原 ${count} 天条件未满足。请确认天数或换一座城市。`);
  };
  const storePlans = (next: SavedPlan[]) => { setSavedPlans(next); try { localStorage.setItem('wander-plans-v2', JSON.stringify(next)); return true; } catch { return false; } };
  const restorePlan = (saved: Profile) => {
    const conflict = getTripTimingConflict(saved);
    setProfile(saved);
    setReady(!conflict && buildTrip(saved).length > 0);
    setFeedback(conflict || '已恢复保存的旅行方案。');
    if (!conflict) focusResult();
  };
  const savePlan = () => {
    const success = storePlans([{ id: String(Date.now()), profile }, ...savedPlans.filter(plan => JSON.stringify(plan.profile) !== JSON.stringify(profile))].slice(0, 5));
    setFeedback(success ? '已保存到这个浏览器的「我的行程」，最多保留 5 份。' : '当前浏览器无法持久保存，可下载完整行程清单。');
    return success;
  };
  return <Modal title="旅行规划室" onClose={onClose} wide>
    <div className="planner-flow" aria-label="规划流程">
      <span className={!ready ? 'is-current' : ''}><i>1</i> 选择路线</span><span><i>2</i> 调整偏好</span><span className={ready ? 'is-current' : ''}><i>3</i> 带走清单</span>
    </div>
    {feedback && <p role="status" className="planner-feedback">{feedback}</p>}
    <div className={'planner-workspace ' + (ready ? 'is-ready' : '')}>
      <div ref={settings} tabIndex={-1} className="planner-settings">
        <div className="planner-setting-intro"><p>旅程，从你的想法开始</p><h3>几步，安排一段湖北时光。</h3><span>选路线、定节奏，把每天的吃住行连起来。</span></div>
        <form className="planner-form" onSubmit={event => {
          event.preventDefault();
          if (!days.length) return;
          if (profile.date && !validDate(profile.date)) { setFeedback('请输入有效日期，例如 2026-11-01。'); return; }
          if (profile.budgetLimit !== undefined && (!Number.isInteger(profile.budgetLimit) || profile.budgetLimit < 1 || profile.budgetLimit > 1000000)) { setFeedback('目标预算请填 1–1000000 元的整数，也可以先留空。'); return; }
          if (profile.mobility === 'gentle' && days.some(day => day.effort === 'high')) { setFeedback('这份方案仍含高体力山地章节，未满足少台阶条件。请减少天数、换城市或取消冲突章节。'); return; }
          if (profile.budgetLimit && profile.budgetScope && budget.total[0] > profile.budgetLimit * (profile.budgetScope === 'per-person' ? profile.party : 1)) { setFeedback('这份方案的最低规划预留已超过目标预算。请调整天数、档位或预算后再整理。'); return; }
          if (timingConflict) { setFeedback(timingConflict); return; }
          setReady(true); setFeedback(''); focusResult();
        }}>
          <fieldset className="planner-form-section">
            <legend className="sr-only">选择路线与日期</legend><StepHeading number="01" title="先选一段旅程" />
            <div role="group" aria-label="快捷路线" className="planner-template-picks">
              {templates.map(template => <button type="button" key={template.id} aria-pressed={profile.template === template.id} onClick={() => update({ template: template.id, cityId: template.cityId, indices: recommendDays(template.cityId, Math.min(profile.indices.length || 2, cityById[template.cityId].days.length), profile.interest) })}><strong>{template.segments.reduce((sum, segment) => sum + segment.indices.length, 0)} 天</strong><span>{template.id === 'wuhan-weekend' ? '武汉周末' : template.id === 'west-five' ? '峡江山水' : '湖北纵览'}</span></button>)}
            </div>
            <label className="planner-field">路线方式<SelectField aria-label="路线模板" value={profile.template} onChange={event => update({ template: event.target.value })}><option value="custom">自选一座城市</option>{templates.map(template => <option value={template.id} key={template.id}>{template.label} · {template.title}</option>)}</SelectField></label>
            {!selectedTemplate && <div className="planner-field-pair">
              <label className="planner-field">目的地<SelectField aria-label="行程城市" value={profile.cityId} onChange={event => { const id = event.target.value; updateChapters({ cityId: id }, Math.min(profile.indices.length || 2, cityById[id].days.length)); }}>{cities.map(item => <option value={item.id} key={item.id}>{item.shortName}</option>)}</SelectField></label>
              <label className="planner-field">计划天数<SelectField aria-label="计划天数" value={profile.indices.length} onChange={event => updateChapters({}, Number(event.target.value))}>{!profile.indices.length && <option value={0}>先选一天</option>}{city.days.map((_, i) => <option key={i} value={i + 1}>{i + 1} 天</option>)}</SelectField></label>
            </div>}
            <label className="planner-field">出发日期<span className="planner-field-hint">还没确定，可以先留空</span><InputField aria-label="行程出发日期" value={profile.date} placeholder="年-月-日" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" maxLength={10} onChange={event => update({ date: event.target.value })} /></label>
            <label className="planner-field">出发城市<InputField aria-label="规划出发城市" value={profile.origin || ''} maxLength={24} onChange={event => update({ origin: event.target.value })} placeholder="出发地与游玩城市分别填写" /></label>
            <div className="planner-field-pair">
              <label className="planner-field">首日抵达<SelectField aria-label="规划首日抵达" value={profile.arrival || ''} onChange={event => update({ arrival: event.target.value ? event.target.value as Profile['arrival'] : undefined })}><option value="">未填写 · 沿用原方案假设</option>{Object.entries(arrivalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
              <label className="planner-field">最后一天返程<SelectField aria-label="规划返程时段" value={profile.departure || 'flexible'} onChange={event => update({ departure: event.target.value as Profile['departure'] })}>{Object.entries(departureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
            </div>
          </fieldset>
          <fieldset className="planner-form-section">
            <legend className="sr-only">同行人与交通方式</legend><StepHeading number="02" title="和谁一起，怎么走" />
            <div className="planner-field-pair">
              <label className="planner-field">同行人数<SelectField aria-label="规划人数" value={profile.party} onChange={event => { const party = Number(event.target.value); update({ party, ...(party > 1 && profile.group === 'solo' ? { group: 'friends' } : {}) }); }}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n} 人</option>)}</SelectField></label>
              <label className="planner-field">同行人群<SelectField aria-label="同行人群" value={profile.group} onChange={event => update({ group: event.target.value as Profile['group'], ...(event.target.value === 'solo' ? { party: 1 } : {}) })}>{Object.entries(groupLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></label>
            </div>
            <div role="group" aria-label="交通偏好" className="planner-transport-picks">{[{ id: 'public', text: '公共交通＋接驳', detail: '城区公交 · 跨城高铁' }, { id: 'drive', text: '自驾出行', detail: '沿途休息 · 停车预留' }].map(item => <button type="button" key={item.id} aria-pressed={profile.mode === item.id} onClick={() => update({ mode: item.id as Profile['mode'] })}><Route size={17} /><strong>{item.text}</strong><span>{item.detail}</span></button>)}</div>
            <label className="planner-field">体力限制<SelectField aria-label="规划体力限制" value={profile.mobility || 'standard'} onChange={event => {
              const mobility = event.target.value as Profile['mobility'];
              if (selectedTemplate) update({ mobility });
              else updateChapters({ mobility });
            }}><option value="standard">{mobilityLabels.standard}</option><option value="gentle">{mobilityLabels.gentle}</option></SelectField></label>
          </fieldset>
          <fieldset className="planner-form-section">
            <legend className="sr-only">旅行偏好</legend><StepHeading number="03" title="把节奏，调成你喜欢的" />
            <div className="planner-field-pair">
              <label className="planner-field">单城玩法<SelectField disabled={Boolean(selectedTemplate)} aria-label="玩法偏好" value={profile.interest} onChange={event => updateChapters({ interest: event.target.value as Profile['interest'] })}>{Object.entries(interestLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></label>
              <label className="planner-field">预算档位<SelectField aria-label="预算档位" value={profile.budget} onChange={event => update({ budget: event.target.value as Profile['budget'] })}>{Object.entries(budgetLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></label>
            </div>
            {selectedTemplate && <p className="planner-small-note">经典路线保留既定主线，可继续调整交通、预算与节奏。</p>}
            <label className="planner-field">旅行节奏<SelectField aria-label="旅行节奏" value={profile.pace} onChange={event => update({ pace: event.target.value as Profile['pace'] })}><option value="classic">经典串游 · 保留上午和下午</option><option value="relaxed">轻松慢游 · 下午活动可选</option></SelectField></label>
            <div className="planner-field-pair"><label className="planner-field">目标预算（元，可留空）<InputField aria-label="规划目标预算" inputMode="numeric" value={profile.budgetLimit || ''} onChange={event => { const value = event.target.value; if (!value || /^\d{1,7}$/.test(value)) update({ budgetLimit: value ? Number(value) : undefined, budgetScope: value ? profile.budgetScope || 'total' : undefined }); }} placeholder="用于与规划预留比较" /></label><label className="planner-field">预算口径<SelectField aria-label="规划预算口径" value={profile.budgetScope || 'total'} onChange={event => update({ budgetScope: event.target.value as Profile['budgetScope'] })}><option value="total">全团合计</option><option value="per-person">每人</option></SelectField></label></div>
            <details className="planner-fine-tune"><summary>自选章节与补充想法</summary><div>
              {!selectedTemplate && <fieldset><legend>自选想走的章节</legend>{city.days.map((day, index) => <label key={day.title} className="planner-chapter"><input type="checkbox" checked={profile.indices.includes(index)} onChange={() => update({ indices: profile.indices.includes(index) ? profile.indices.filter(i => i !== index) : [...profile.indices, index].sort((a, b) => a - b) })} /><span>{day.title}</span></label>)}</fieldset>}
              <label className="planner-field">我的补充想法<textarea aria-label="行程备注" maxLength={500} value={profile.note} onChange={event => update({ note: event.target.value })} placeholder="例如：午后休息、不吃辣、希望听讲解…" /><span className="planner-small-note">备注随清单保留，当前不自动识别或预约。</span></label>
            </div></details>
          </fieldset>
          <div className="planner-submit"><p><strong>{days.length} 天 · {profile.party} 人</strong><span>{budgetLabels[profile.budget]} · {profile.pace === 'relaxed' ? '轻松慢游' : '经典串游'}</span></p><Button type="submit" className="w-full" disabled={!days.length}><Sparkles size={16} />{ready ? '重新整理行程' : '整理 ' + days.length + ' 天完整方案'}<ArrowRight size={16} /></Button><span>依据编辑路线组合，无需注册。预约、车船与房价请另核对。</span></div>
        </form>
        <details className="planner-saved"><summary><Bookmark size={15} />我的行程 <span>{savedPlans.length} / 5</span></summary><p>保存在当前浏览器。分享链接不包含自由备注。</p><div>{savedPlans.map(plan => <article key={plan.id}><button onClick={() => restorePlan(plan.profile)}><strong>{tripTitle(plan.profile)}</strong><span>{plan.profile.date || '日期待定'} · {plan.profile.party} 人</span></button><button aria-label={'删除' + tripTitle(plan.profile)} onClick={() => { const ok = storePlans(savedPlans.filter(item => item.id !== plan.id)); setFeedback(ok ? '已从本浏览器移除这份行程。' : '已在本次会话移除，浏览器存储未更新。'); }}><Trash2 size={15} /></button></article>)}{!savedPlans.length && <p>喜欢的方案可以存下来，下次接着安排。</p>}</div></details>
      </div>
      <div ref={result} tabIndex={-1} aria-label="整理好的行程" className="planner-result">
        {ready ? <PlannedTrip key={JSON.stringify(profile)} profile={profile} onCopy={onCopy} onSave={savePlan} onEdit={edit} /> : <section className="planner-preview">
          {previewImage && <figure><img src={previewImage} alt="所选旅程的湖北目的地实景" /><figcaption><MapPin size={14} />{routeCities.map(id => cityById[id].shortName).join(' → ')}</figcaption></figure>}
          <div className="planner-preview-body"><p className="planner-preview-kicker">旅程草稿 · 随条件更新</p><h3>{tripTitle(profile)}</h3><p className="planner-preview-subtitle">先看方向，再把每一天安排具体。</p><div className="planner-preview-metrics"><span><strong>{days.length}</strong> 天行程</span><span><strong>{budget.nights}</strong> 晚住宿</span><span><strong>{routeCities.length}</strong> 座城市</span></div>
            <ul className="planner-preview-tags"><li>{groupLabels[profile.group]}</li><li>{profile.mode === 'drive' ? '自驾出行' : '公共交通＋接驳'}</li><li>{profile.pace === 'relaxed' ? '轻松慢游' : '经典串游'}</li></ul>
            <ol className="planner-preview-days">{days.slice(0, 3).map((day, index) => <li key={day.title}><span>第 {index + 1} 天</span><div><strong>{day.title}</strong><p>{day.stops.map(stop => stop.title).join(' → ')}</p></div></li>)}</ol>
            {days.length > 3 && <p className="planner-small-note">还有 {days.length - 3} 天，在完整方案中展开。</p>}
            {!days.length && <p className="planner-small-note">请至少选择一天，继续安排旅程。</p>}
            <div className="planner-preview-promise"><Check size={18} /><p><strong>整理后，你会得到</strong><span>分日路线、逐晚住宿、沿途餐食和全团预算，支持保存、分享与下载。</span></p></div>
          </div>
        </section>}
      </div>
    </div>
  </Modal>;
}
