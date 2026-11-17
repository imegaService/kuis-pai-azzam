import React, { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Timer, Trophy, Zap, RotateCcw, ChevronRight, Flame, Star, Users, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Page } from '../components/kit';
import { computeReadiness } from '../lib/readiness';

const MODES = [
  { id: 'latihan', to: '/mulai/latihan', title: 'Latihan Topik', desc: 'Pilih materi, tanpa batas waktu', icon: BookOpen, tone: 'bg-emerald-50 text-emerald-700' },
  { id: 'kuis', to: '/mulai/kuis', title: 'Kuis Timer', desc: 'Jawab sebelum waktu habis', icon: Timer, tone: 'bg-amber-50 text-amber-700' },
  { id: 'simulasi', to: '/mulai/simulasi', title: 'Simulasi Lomba', desc: 'Babak wajib & rebutan', icon: Trophy, tone: 'bg-sky-50 text-sky-700' },
  { id: 'ulangi', to: '/mulai/ulangi', title: 'Ulangi Soal Salah', desc: '', icon: RotateCcw, tone: 'bg-indigo-50 text-indigo-700' },
  { id: 'buzzer', to: '/buzzer', title: 'Buzzer Rebutan', desc: '2–4 tim di satu perangkat', icon: Zap, tone: 'bg-rose-50 text-rose-700' },
];

export default function Home() {
  const app = useApp();
  const nav = useNavigate();
  const timer = useRef<number | null>(null);
  const p = app.active;
  if (!p) return <Navigate to="/" replace />;
  const wrongCount = Object.keys(p.wrong).length;
  const r = computeReadiness(p);
  const startPress = () => { timer.current = window.setTimeout(() => nav('/orangtua'), 1200); };
  const endPress = () => { if (timer.current) clearTimeout(timer.current); };

  return (
    <Page>
      <div className="flex items-center gap-3 anim-up">
        <button data-testid="home-logo-longpress" aria-label="Logo" onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onContextMenu={(e) => e.preventDefault()} className="select-none">
          <Avatar color={p.color} icon={p.icon} size="lg" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-500">Assalamu'alaikum,</p>
          <h1 data-testid="home-profile-name" className="font-heading text-3xl font-extrabold tracking-tight truncate">{p.name}</h1>
        </div>
        <button data-testid="switch-profile-btn" onClick={() => { app.selectProfile(null); nav('/'); }} className="min-h-[44px] px-3 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-200/60 flex items-center gap-1"><Users className="w-4 h-4" />Ganti</button>
      </div>

      <button data-testid="home-progress-card" onClick={() => nav('/progres')} className="anim-up w-full mt-6 bg-stone-900 text-white rounded-3xl p-5 text-left active:scale-[0.99] transition-transform" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-300">Kesiapan lomba</p>
          <span className="text-xs font-semibold bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" />Lihat progres</span>
        </div>
        <div className="flex items-end gap-3 mt-1">
          <p data-testid="home-readiness" className="font-heading text-5xl font-extrabold">{r.score}%</p>
          <p className="pb-2 text-amber-300 font-semibold">{r.badge.label}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <Stat icon={<Star className="w-4 h-4" />} value={p.totalScore} label="poin" testid="home-stat-score" />
          <Stat icon={<Zap className="w-4 h-4" />} value={p.streak} label="benar beruntun" testid="home-stat-streak" />
          <Stat icon={<Flame className="w-4 h-4" />} value={p.dayStreak} label="hari beruntun" testid="home-stat-days" />
        </div>
      </button>

      <h2 className="font-heading text-base md:text-lg font-bold mt-8 mb-3 text-stone-700">Mau latihan apa?</h2>
      <div className="grid gap-3">
        {MODES.map((m, i) => (
          <button key={m.id} data-testid={`mode-${m.id}-btn`} onClick={() => nav(m.to)} style={{ animationDelay: `${120 + i * 50}ms` }}
            className="anim-up w-full bg-white border border-stone-200 rounded-3xl p-4 flex items-center gap-4 text-left hover:border-stone-300 active:scale-[0.99] transition-[border-color,transform]">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.tone}`}><m.icon className="w-6 h-6" /></div>
            <div className="flex-1">
              <p className="font-heading text-lg font-bold">{m.title}</p>
              <p className="text-sm text-stone-500">{m.id === 'ulangi' ? (wrongCount ? `${wrongCount} soal menunggu diulang` : 'Belum ada soal salah') : m.desc}</p>
            </div>
            {m.id === 'ulangi' && wrongCount > 0 && <span data-testid="wrong-count-badge" className="min-w-[28px] h-7 px-2 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">{wrongCount}</span>}
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </button>
        ))}
      </div>
    </Page>
  );
}

function Stat({ icon, value, label, testid }: { icon: React.ReactNode; value: number; label: string; testid: string }) {
  return (
    <div className="bg-white/5 rounded-2xl py-2.5">
      <p data-testid={testid} className="font-heading text-xl font-bold flex items-center justify-center gap-1">{icon}{value}</p>
      <p className="text-[11px] text-stone-400">{label}</p>
    </div>
  );
}
