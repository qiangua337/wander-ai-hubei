import { useId, useState } from 'react';
import { Clock3, Footprints, TrainFront } from 'lucide-react';
import { returnWalks } from '../data/return-mornings';
import { buildTrip, getTripTimingConflict, type PlannedDay, type Profile } from '../planning';
import { clockWindow, manualTravelBuffer, normalizeClockInput, normalizeReturnLogistics, normalizeStation, parseClock, readReturnMinutes } from '../return-timing';
import { Button, InputField, SelectField } from './ui';
import './return-day-editor.css';

export function ReturnDayEditor({ day, profile, onApply }: { day: PlannedDay; profile: Profile; onApply: (profile: Profile) => void }) {
  const headingId = useId();
  const timing = day.afternoonReturn;
  const [editing, setEditing] = useState(false);
  const [area, setArea] = useState(profile.returnLogistics?.area || '');
  const [travel, setTravel] = useState(profile.returnLogistics?.travelMinutes?.toString() || '');
  const [luggage, setLuggage] = useState(profile.returnLogistics?.luggageMinutes?.toString() || '');
  const [time, setTime] = useState(profile.departureTime || '');
  const [station, setStation] = useState(profile.departureStation || '');
  const [error, setError] = useState('');
  const savedSchedule = day.stationSchedule;

  const draftTime = normalizeClockInput(time);
  const minutes = parseClock(draftTime);
  const draftStation = normalizeStation(station);
  const travelMinutes = readReturnMinutes(travel, 'travelMinutes');
  const luggageMinutes = readReturnMinutes(luggage, 'luggageMinutes');
  const updated: Profile = {
    ...profile,
    departure: 'afternoon',
    departureTime: draftTime,
    departureStation: draftStation,
    returnLogistics: normalizeReturnLogistics({ area, travelMinutes, luggageMinutes }, day.cityId),
  };
  let problem = '';
  if (time.trim() && !draftTime) problem = '发车时间请填 24 小时制，例如 15:30。';
  else if (minutes !== undefined && clockWindow(minutes) !== 'afternoon') problem = '这张卡适用于 12:00–17:59 发车。上午或晚间返程可在「调整条件」里修改。';
  else if (station.trim() && (!draftStation || draftStation.endsWith('机场'))) problem = '请填写票面铁路车站名，例如武昌站。';
  else if (travel.trim() && travelMinutes === undefined) problem = '去站车程请填 1–360 分钟。';
  else if (luggage.trim() && luggageMinutes === undefined) problem = '取行李时间请填 0–120 分钟。';
  else problem = getTripTimingConflict(updated) || '';
  const preview = editing && !problem ? buildTrip(updated).at(-1) : undefined;
  const previewSchedule = preview?.stationSchedule;

  const reset = () => {
    setArea(profile.returnLogistics?.area || '');
    setTravel(profile.returnLogistics?.travelMinutes?.toString() || '');
    setLuggage(profile.returnLogistics?.luggageMinutes?.toString() || '');
    setTime(profile.departureTime || '');
    setStation(profile.departureStation || '');
    setError('');
    setEditing(false);
  };

  return <section className="return-day-editor" aria-labelledby={headingId}>
    <div className="return-day-header">
      <div><h4 id={headingId}><TrainFront size={17} />最后一天怎么去车站</h4><p>{timing?.area || '按实际落脚片区安排'}{profile.departureStation ? ` → ${profile.departureStation}` : ''}</p></div>
      <Button variant="neutral" className="return-day-trigger px-3 text-xs" aria-expanded={editing} onClick={() => editing ? reset() : setEditing(true)}>{editing ? '收起调整' : '调整返程接驳'}</Button>
    </div>
    {savedSchedule ? <dl className="return-day-times">
      <div><dt>{timing?.luggageMinutes === 0 ? '结束上午安排' : '开始取行李'}</dt><dd>{savedSchedule.finishBy}</dd></div>
      <div><dt>前往车站</dt><dd>{savedSchedule.leaveForStationBy} 前</dd></div>
      <div><dt>到站候车</dt><dd>{savedSchedule.arriveBy} 前</dd></div>
    </dl> : <p className="return-day-hint">填上发车时间、车站和地图车程，就能倒推结束游览和去站时间。</p>}
    {savedSchedule && <p className="return-day-hint">预留 {timing?.travelAllowance} 分钟去站，{timing?.stationMinutes} 分钟进站候车。</p>}
    {day.returnMorning && <p className="return-day-walk"><Footprints size={15} />{day.returnMorning.sight} · {day.returnMorning.conditional ? '可选约' : '约'} {day.returnMorning.minutes} 分钟</p>}
    {day.breakfast && <p className="return-day-breakfast">{day.breakfast}</p>}
    {editing && <form className="return-day-form" onSubmit={event => {
      event.preventDefault();
      if (problem) { setError(problem); return; }
      if (updated.departureTime === profile.departureTime && updated.departureStation === profile.departureStation
        && JSON.stringify(updated.returnLogistics) === JSON.stringify(profile.returnLogistics)) { reset(); return; }
      setEditing(false); setError(''); onApply(updated);
    }}>
      <label className="return-day-area">实际落脚片区<SelectField value={area} onChange={event => { setArea(event.target.value); setTravel(''); setError(''); }}>
        <option value="">沿用行程里的落脚片区</option>
        {returnWalks[day.cityId]?.map(walk => <option value={walk.id} key={walk.id}>{walk.area}</option>)}
        <option value="other">其他片区</option>
      </SelectField></label>
      <label>发车时间<InputField value={time} maxLength={5} placeholder="如 15:30" onChange={event => { setTime(event.target.value); setError(''); }} /></label>
      <label>上车站<InputField value={station} maxLength={20} placeholder="如 武昌站" onChange={event => { setStation(event.target.value); setTravel(''); setError(''); }} /></label>
      <label>地图车程（分钟）<InputField value={travel} inputMode="numeric" maxLength={3} placeholder="如 75" onChange={event => { setTravel(event.target.value); setError(''); }} /></label>
      <label>取行李（分钟）<InputField value={luggage} inputMode="numeric" maxLength={3} placeholder={`默认 ${timing?.luggageMinutes ?? 20}`} onChange={event => { setLuggage(event.target.value); setError(''); }} /></label>
      <p className="return-day-hint">地图车程另加 {manualTravelBuffer} 分钟等车或换乘余量。随身携带行李可填 0。</p>
      {previewSchedule && <p className="return-day-live" role="status"><Clock3 size={15} />{previewSchedule.finishBy} 结束上午安排 · {previewSchedule.leaveForStationBy} 前去站 · {previewSchedule.arriveBy} 前到站。{preview.returnMorning ? `可逛约 ${preview.returnMorning.minutes} 分钟。` : preview.tip}</p>}
      {error && <p className="return-day-error" role="alert">{error}</p>}
      <div className="return-day-action"><Button type="submit" className="px-4 text-xs">更新返程安排</Button></div>
    </form>}
  </section>;
}
