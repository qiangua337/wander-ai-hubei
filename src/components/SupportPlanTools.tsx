import { useState } from 'react';
import { ArrowRight, Copy, Download, GitCompareArrows, Pencil, Share2 } from 'lucide-react';
import { formatDetailedPlan, sharePlanUrl, type Profile } from '../planning';
import { compareSupportPlans } from '../support-review';
import { downloadPlan } from '../travel';
import './support-plan-tools.css';

export function SupportPlanTools({ profile, previous, onEdit }: { profile: Profile; previous?: Profile; onEdit: (profile: Profile) => void }) {
  const [feedback, setFeedback] = useState('');
  const [comparing, setComparing] = useState(false);
  const comparison = previous && comparing ? compareSupportPlans(previous, profile) : undefined;
  const copy = async (share = false) => {
    try {
      await navigator.clipboard.writeText(share ? sharePlanUrl(profile) : formatDetailedPlan(profile));
      setFeedback(share ? '分享链接已复制，不含补充备注。' : '完整行程已复制，包含每日吃住行。');
    } catch { setFeedback('暂时无法复制，可以下载文本清单保存。'); }
  };
  return <div className="support-plan-tools">
    <div className="support-plan-tool-buttons" aria-label="这版行程操作">
      <button type="button" onClick={() => onEdit(profile)}><Pencil size={14} />调整这版</button>
      <button type="button" onClick={() => void copy()}><Copy size={14} />复制清单</button>
      <button type="button" onClick={() => { try { downloadPlan(formatDetailedPlan(profile), '小游具体'); setFeedback('文本清单已生成，请在浏览器下载中查看。'); } catch { setFeedback('暂时无法下载，可以复制清单保存。'); } }}><Download size={14} />下载清单</button>
      <button type="button" onClick={() => void copy(true)}><Share2 size={14} />分享链接</button>
      {previous && <button type="button" aria-expanded={comparing} onClick={() => setComparing(value => !value)}><GitCompareArrows size={14} />{comparing ? '收起比较' : '与修改前比较'}</button>}
    </div>
    {feedback && <p className="support-plan-tool-feedback" role="status">{feedback}</p>}
    {comparison && <section className="support-plan-comparison" aria-label="与修改前的行程变化">
      <h4>本次修改</h4><p>对照这次修改时打开的方案。</p>
      {comparison.changes.length > 0 ? <dl>{comparison.changes.map(change => <div key={change.label}><dt>{change.label}</dt><dd><span>{change.before}</span><ArrowRight size={12} /><strong>{change.after}</strong></dd></div>)}</dl> : <p>{comparison.addedDays.length || comparison.removedDays.length ? '天数等条件相同，路线章节有所调整。' : '旅行条件与路线章节一致。'}</p>}
      {(comparison.addedDays.length > 0 || comparison.removedDays.length > 0) && <div className="support-plan-chapter-changes">{comparison.addedDays.length > 0 && <p><strong>新增章节</strong>{comparison.addedDays.join('；')}</p>}{comparison.removedDays.length > 0 && <p><strong>移出章节</strong>{comparison.removedDays.join('；')}</p>}</div>}
      {comparison.revisedDays.length > 0 && <div className="support-plan-chapter-changes">{comparison.revisedDays.map(day => <div key={day.day}><strong>第 {day.day} 天</strong><p>修改前 · {day.before}</p><p>修改后 · {day.after}</p></div>)}</div>}
      <p className="support-plan-comparison-budget"><strong>全团预算预留</strong><span>修改前 ¥{comparison.beforeTotal.map(value => value.toLocaleString()).join('–')}</span><span>修改后 ¥{comparison.afterTotal.map(value => value.toLocaleString()).join('–')}</span></p>
      <small>预算随人数、天数、房间等条件计算，用于规划参考。</small>
    </section>}
  </div>;
}
