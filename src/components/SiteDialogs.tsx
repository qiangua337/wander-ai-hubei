import { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { imageCredits } from '../data';
import { Modal } from './Modal';
import { Brand, Button, InputField } from './ui';

export function AuthDialog({ initialMode, onClose }: { initialMode: 'signup' | 'login'; onClose: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [complete, setComplete] = useState(false);
  return <Modal title={mode === 'signup' ? '下一段旅程，从这里开始' : '欢迎回到 Wander AI'} onClose={onClose}><div className="p-7">{complete ? <div className="py-8 text-center"><CheckCircle2 size={46} className="mx-auto text-pine" /><h3 className="mt-5 text-xl font-semibold">界面体验已完成</h3><p className="mt-3 text-sm leading-7 text-muted">未创建真实账户。<br />你可以继续探索、收藏湖北目的地。</p><Button className="mt-6" onClick={onClose}>继续探索<ArrowRight size={16} /></Button></div> : <><Brand /><p className="mb-6 mt-4 text-sm leading-7 text-muted">收藏你的心动风景，让每一次出发更有方向。</p><form onSubmit={event => { event.preventDefault(); setComplete(true); }} className="space-y-4">{mode === 'signup' && <label className="block text-xs font-medium">怎么称呼你<InputField className="mt-2" placeholder="你的旅行昵称" required maxLength={30} autoComplete="nickname" /></label>}<label className="block text-xs font-medium">电子邮箱<InputField className="mt-2" type="email" placeholder="hello@example.com" required autoComplete="email" /></label><p className="flex items-start gap-2 rounded-lg bg-sage p-3 text-[11px] leading-6 text-muted"><ShieldCheck size={16} className="mt-1 shrink-0 text-pine" />原型体验，不创建真实账户，不提交你的邮箱。</p><Button type="submit" className="w-full">{mode === 'signup' ? '体验注册' : '体验登录'}<ArrowRight size={16} /></Button></form><button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="mt-5 block w-full text-center text-xs text-muted">{mode === 'signup' ? '已有账号？' : '还没有账号？'}<span className="ml-1 font-semibold text-pine">{mode === 'signup' ? '登录' : '注册'}</span></button></>}</div></Modal>;
}

export function CreditsDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="真实风景，感谢记录它的人" onClose={onClose} wide><div className="space-y-5 p-5 sm:p-7"><p className="text-sm leading-7 text-muted">实拍照片只用于对应景点或带明确图注的城市风景。图片在容器内裁切，原始许可保持不变；景点事实来源可在每份城市攻略末尾查看。</p>{imageCredits.map(photo => <div key={photo.source} className="rounded-xl border border-line p-4"><h3 className="text-sm font-semibold">{photo.subject}</h3><p className="mt-2 text-xs leading-6 text-muted">摄影 / 来源：{photo.author}</p><div className="mt-3 flex flex-wrap gap-5 text-xs font-medium text-pine"><a href={photo.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">原图与来源<ArrowUpRight size={13} /></a><a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></div></div>)}</div></Modal>;
}
