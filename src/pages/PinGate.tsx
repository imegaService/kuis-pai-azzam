import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Delete, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Page, TopBar } from '../components/kit';

export const PARENT_FLAG = 'cts.parentUnlocked';
export const isParentUnlocked = () => sessionStorage.getItem(PARENT_FLAG) === '1';

export function ParentGuard({ children }: { children: React.ReactNode }) {
  return isParentUnlocked() ? <>{children}</> : <Navigate to="/orangtua" replace />;
}

export default function PinGate() {
  const app = useApp();
  const nav = useNavigate();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [, force] = useState(0);
  const locked = Date.now() < lockedUntil;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => {
    if (pin.length !== 4) return;
    if (pin === app.settings.pin) {
      sessionStorage.setItem(PARENT_FLAG, '1');
      nav('/orangtua/pengaturan', { replace: true });
    } else {
      const f = fails + 1;
      setFails(f);
      setErr('PIN salah.');
      if (f >= 5) { setLockedUntil(Date.now() + 30000); setFails(0); }
      setTimeout(() => setPin(''), 250);
    }
  }, [pin]); // eslint-disable-line

  const press = (d: string) => { if (!locked && pin.length < 4) { setErr(''); setPin(pin + d); } };
  return (
    <>
      <TopBar title="Menu Orang Tua" back={-1} />
      <Page className="pt-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto"><Lock className="w-6 h-6" /></div>
        <p className="font-heading text-2xl font-bold mt-4">Masukkan PIN</p>
        <p className="text-sm text-stone-500 mt-1">Khusus orang tua / pendamping</p>
        <div className={`flex justify-center gap-4 mt-8 ${err ? 'anim-shake' : ''}`} data-testid="pin-dots">
          {[0, 1, 2, 3].map((i) => <span key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-stone-900' : 'bg-stone-300'}`} />)}
        </div>
        <p data-testid="pin-error" className="h-6 mt-3 text-sm text-rose-600">{locked ? `Terlalu banyak percobaan. Tunggu ${Math.ceil((lockedUntil - Date.now()) / 1000)} detik.` : err}</p>
        <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} data-testid={`pin-key-${d}`} onClick={() => press(d)} className="h-16 rounded-2xl bg-white border border-stone-200 font-heading text-2xl font-bold active:bg-stone-100">{d}</button>
          ))}
          <span />
          <button data-testid="pin-key-0" onClick={() => press('0')} className="h-16 rounded-2xl bg-white border border-stone-200 font-heading text-2xl font-bold active:bg-stone-100">0</button>
          <button data-testid="pin-key-back" aria-label="Hapus" onClick={() => setPin(pin.slice(0, -1))} className="h-16 rounded-2xl flex items-center justify-center text-stone-600 active:bg-stone-100"><Delete className="w-6 h-6" /></button>
        </div>
      </Page>
    </>
  );
}
