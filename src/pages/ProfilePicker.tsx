import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, AVATAR_COLORS, AVATAR_ICONS, Btn, Card, Modal, Page } from '../components/kit';

export default function ProfilePicker() {
  const app = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(app.profiles.length === 0);
  const [name, setName] = useState('');
  const [color, setColor] = useState('emerald');
  const [icon, setIcon] = useState('star');
  const [err, setErr] = useState('');

  const pick = (id: string) => { app.selectProfile(id); nav('/beranda'); };
  const create = () => {
    const n = name.trim();
    if (n.length < 2) return setErr('Nama minimal 2 huruf.');
    if (app.profiles.some((p) => p.name.toLowerCase() === n.toLowerCase())) return setErr('Nama ini sudah dipakai.');
    const p = app.addProfile(n, color, icon);
    setOpen(false); setName(''); setErr('');
    pick(p.id);
  };

  return (
    <Page className="pt-10">
      <div className="anim-up">
        <div className="w-14 h-14 rounded-2xl bg-emerald-700 flex items-center justify-center mb-6"><img src="/icon-192.png" alt="" className="w-14 h-14 rounded-2xl" /></div>
        <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">Latihan Cepat Tepat</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 mt-1">Siapa yang<br />belajar hari ini?</h1>
        <p className="text-stone-600 mt-3 text-base">PAI & Kemuhammadiyahan · SD Kelas 5</p>
      </div>

      <div className="grid gap-3 mt-8">
        {app.profiles.map((p, i) => (
          <button key={p.id} data-testid={`profile-card-${p.id}`} onClick={() => pick(p.id)} style={{ animationDelay: `${i * 60}ms` }}
            className="anim-up w-full bg-white border border-stone-200 rounded-3xl p-4 flex items-center gap-4 text-left hover:border-emerald-400 active:scale-[0.99] transition-[border-color,transform]">
            <Avatar color={p.color} icon={p.icon} />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-lg font-bold truncate">{p.name}</p>
              <p className="text-sm text-stone-500">{p.totalScore} poin</p>
            </div>
            {p.dayStreak > 0 && <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 bg-amber-50 rounded-full px-3 py-1"><Flame className="w-4 h-4" />{p.dayStreak} hari</span>}
          </button>
        ))}
        <Btn variant="secondary" data-testid="add-profile-btn" onClick={() => setOpen(true)} className="border-dashed border-2"><Plus className="w-5 h-5" /> Tambah profil anak</Btn>
      </div>

      <button data-testid="parent-entry-link" onClick={() => nav('/orangtua')} className="mt-12 mx-auto flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 min-h-[44px] px-3">
        <Lock className="w-3.5 h-3.5" /> Menu orang tua
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Profil baru">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Nama panggilan</span>
          <input data-testid="profile-name-input" value={name} maxLength={30} onChange={(e) => { setName(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && create()} className="field mt-2" placeholder="contoh: Aisyah" autoFocus />
        </label>
        {err && <p data-testid="profile-name-error" className="text-sm text-rose-600 mt-2">{err}</p>}
        <p className="text-sm font-semibold text-stone-700 mt-5 mb-2">Warna</p>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(AVATAR_COLORS).map((c) => (
            <button key={c} data-testid={`profile-color-${c}`} aria-label={c} onClick={() => setColor(c)} className={`w-11 h-11 rounded-xl ${AVATAR_COLORS[c]} ${color === c ? 'ring-4 ring-offset-2 ring-stone-300' : ''}`} />
          ))}
        </div>
        <p className="text-sm font-semibold text-stone-700 mt-5 mb-2">Ikon</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(AVATAR_ICONS).map(([k, I]) => (
            <button key={k} data-testid={`profile-icon-${k}`} aria-label={k} onClick={() => setIcon(k)} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center ${icon === k ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-500'}`}><I className="w-5 h-5" /></button>
          ))}
        </div>
        <Card className="mt-5 p-3 flex items-center gap-3 bg-stone-50"><Avatar color={color} icon={icon} size="sm" /><span className="font-semibold">{name || 'Nama anak'}</span></Card>
        <Btn data-testid="profile-create-btn" className="w-full mt-5" onClick={create}>Simpan & mulai</Btn>
      </Modal>
    </Page>
  );
}
