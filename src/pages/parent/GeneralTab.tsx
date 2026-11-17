import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { Btn, Card, Segmented } from '../../components/kit';
import { gradeShort } from '../../lib/grading';
import { sfx } from '../../lib/sound';
import type { Tolerance } from '../../types';

function Toggle({ checked, onChange, testid, label, desc }: { checked: boolean; onChange: (v: boolean) => void; testid: string; label: string; desc?: string }) {
  return (
    <button data-testid={testid} role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center gap-4 text-left min-h-[56px]">
      <div className="flex-1"><p className="font-semibold">{label}</p>{desc && <p className="text-sm text-stone-500">{desc}</p>}</div>
      <span className={`w-14 h-8 rounded-full p-1 transition-colors ${checked ? 'bg-emerald-600' : 'bg-stone-300'}`}><span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : ''}`} /></span>
    </button>
  );
}

export default function GeneralTab() {
  const app = useApp();
  const s = app.settings;
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [tryText, setTryText] = useState('abubakar');
  const sample = { id: 'x', category: 'tarikh', subtopic: '', type: 'short', question: '', answer: 'Abu Bakar', aliases: ['abu bakr'], explanation: '', difficulty: 1, tag: 'belajar' } as const;
  const tryRes = gradeShort(tryText, sample as any, s.tolerance);

  const changePin = () => {
    if (!/^\d{4}$/.test(pin1)) return toast.error('PIN harus 4 angka.');
    if (pin1 !== pin2) return toast.error('Konfirmasi PIN tidak sama.');
    app.updateSettings({ pin: pin1 }); setPin1(''); setPin2('');
    toast.success('PIN berhasil diganti.');
  };

  return (
    <div className="anim-up grid gap-6">
      <Card className="p-5 grid gap-4">
        <div>
          <p className="font-semibold mb-2">Durasi timer bawaan (per soal)</p>
          <Segmented testid="setting-timer" value={s.timerSec} onChange={(v) => app.updateSettings({ timerSec: v })} options={[10, 15, 20, 30, 45].map((n) => ({ value: n, label: `${n} dtk` }))} />
        </div>
        <Toggle testid="setting-sound" checked={s.sound} onChange={(v) => { app.updateSettings({ sound: v }); if (v) setTimeout(sfx.correct, 50); }} label="Efek suara" desc="Bunyi ringan saat benar, salah, dan waktu hampir habis" />
        <Toggle testid="setting-offline-notice" checked={s.offlineNotice} onChange={(v) => app.updateSettings({ offlineNotice: v })} label="Tampilkan pemberitahuan offline" />
      </Card>

      <Card className="p-5">
        <p className="font-semibold">Toleransi jawaban isian</p>
        <p className="text-sm text-stone-500 mb-3">Huruf kapital, spasi, strip, dan tanda petik selalu diabaikan.</p>
        <Segmented testid="setting-tolerance" value={s.tolerance} onChange={(v: Tolerance) => app.updateSettings({ tolerance: v })} options={[{ value: 'ketat', label: 'Ketat' }, { value: 'normal', label: 'Normal' }, { value: 'longgar', label: 'Longgar' }]} />
        <p className="text-xs text-stone-500 mt-2">{s.tolerance === 'ketat' ? 'Tanpa toleransi salah ketik.' : s.tolerance === 'normal' ? 'Salah ketik kecil (1–2 huruf) diterima.' : 'Salah ketik lebih banyak diterima.'}</p>
        <div className="mt-4 bg-stone-50 rounded-2xl p-3">
          <p className="text-xs text-stone-500 mb-2">Coba: kunci jawaban “Abu Bakar”</p>
          <input data-testid="tolerance-try-input" value={tryText} onChange={(e) => setTryText(e.target.value)} className="field" />
          <p data-testid="tolerance-try-result" className={`text-sm font-semibold mt-2 ${tryRes.correct ? 'text-emerald-700' : 'text-rose-600'}`}>{tryRes.correct ? 'Diterima sebagai benar' : 'Dianggap salah'}</p>
        </div>
      </Card>

      <Card className="p-5">
        <p className="font-semibold mb-3">Ganti PIN orang tua</p>
        <div className="grid grid-cols-2 gap-3">
          <input data-testid="new-pin-input" type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))} placeholder="PIN baru" className="field" />
          <input data-testid="confirm-pin-input" type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} placeholder="Ulangi PIN" className="field" />
        </div>
        <Btn data-testid="change-pin-btn" className="w-full mt-3" onClick={changePin}>Simpan PIN</Btn>
      </Card>
    </div>
  );
}
