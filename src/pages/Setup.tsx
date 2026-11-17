import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Shuffle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, Card, Page, Segmented, TopBar } from '../components/kit';
import { CATEGORIES, MODE_LABEL } from '../lib/categories';
import { filterPool, subtopicsOf } from '../lib/session';
import type { CategoryId, Difficulty, ModeId, SessionConfig } from '../types';

export default function Setup() {
  const { mode } = useParams<{ mode: ModeId }>();
  const app = useApp();
  const nav = useNavigate();
  const [category, setCategory] = useState<CategoryId | 'campur'>(mode === 'simulasi' ? 'campur' : 'aqidah');
  const [subtopic, setSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState<0 | Difficulty>(0);
  const [count, setCount] = useState(mode === 'simulasi' ? 10 : 10);
  const [timerSec, setTimerSec] = useState(app.settings.timerSec);
  const cfg: SessionConfig = { mode: mode as ModeId, category, subtopic: subtopic || undefined, difficulty, count, timerSec };
  const available = useMemo(() => filterPool(app.bank, cfg).length, [app.bank, category, subtopic, difficulty]); // eslint-disable-line
  if (!app.active || !mode || !MODE_LABEL[mode]) return <Navigate to="/beranda" replace />;
  const start = (c: SessionConfig) => nav('/sesi', { state: { config: c } });

  if (mode === 'ulangi') {
    const n = Object.keys(app.active.wrong).length;
    return (
      <>
        <TopBar title="Ulangi Soal Salah" back="/beranda" />
        <Page>
          <Card className="p-6 anim-up">
            <p className="font-heading text-5xl font-extrabold text-indigo-700" data-testid="wrong-total">{n}</p>
            <p className="text-stone-600 mt-1">soal pernah dijawab salah</p>
            <p className="text-sm text-stone-500 mt-4">Soal akan hilang dari daftar ini setelah kamu menjawabnya dengan benar. Soal salah juga otomatis diselipkan saat Latihan dan Kuis.</p>
          </Card>
          <Btn data-testid="start-session-btn" className="w-full mt-6" disabled={!n} onClick={() => start({ ...cfg, category: 'campur', count: Math.min(n, 15), timerSec: 0 })}>
            {n ? `Ulangi ${Math.min(n, 15)} soal` : 'Belum ada soal salah'}
          </Btn>
        </Page>
      </>
    );
  }

  const subs = subtopicsOf(app.bank, category);
  return (
    <>
      <TopBar title={MODE_LABEL[mode]} back="/beranda" />
      <Page>
        {mode === 'simulasi' && (
          <Card className="p-5 mb-6 bg-sky-50 border-sky-200 anim-up">
            <p className="font-heading font-bold text-sky-900 flex items-center gap-2"><Info className="w-5 h-5" />Aturan simulasi</p>
            <ul className="text-sm text-sky-900/80 mt-2 space-y-1 list-disc pl-5">
              <li>Babak 1 (Wajib): {count} soal, {timerSec} detik/soal. Benar +10.</li>
              <li>Babak 2 (Rebutan): {count} soal, {Math.max(8, timerSec - 5)} detik/soal. Benar +10, salah −5, boleh lewati.</li>
              <li>Soal diambil merata dari 5 kategori.</li>
            </ul>
          </Card>
        )}

        {mode !== 'simulasi' && (
          <section className="anim-up">
            <h2 className="font-heading text-base md:text-lg font-bold mb-3">Pilih materi</h2>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <button key={c.id} data-testid={`category-${c.id}-btn`} onClick={() => { setCategory(c.id); setSubtopic(''); }}
                  className={`p-4 rounded-2xl border-2 text-left transition-[border-color,background-color] ${category === c.id ? `${c.bg} border-current ${c.text}` : 'bg-white border-stone-200'}`}>
                  <c.icon className={`w-6 h-6 ${c.text}`} />
                  <p className="font-heading font-bold mt-2 leading-tight text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{c.desc}</p>
                </button>
              ))}
              <button data-testid="category-campur-btn" onClick={() => { setCategory('campur'); setSubtopic(''); }}
                className={`p-4 rounded-2xl border-2 text-left ${category === 'campur' ? 'bg-stone-100 border-stone-800' : 'bg-white border-stone-200'}`}>
                <Shuffle className="w-6 h-6 text-stone-700" />
                <p className="font-heading font-bold mt-2 text-stone-900">Campuran</p>
                <p className="text-xs text-stone-500 mt-0.5">Semua materi</p>
              </button>
            </div>
          </section>
        )}

        {subs.length > 0 && mode === 'latihan' && (
          <section className="mt-6">
            <h2 className="font-heading text-base md:text-lg font-bold mb-3">Subtopik</h2>
            <select data-testid="subtopic-select" value={subtopic} onChange={(e) => setSubtopic(e.target.value)} className="field">
              <option value="">Semua subtopik</option>
              {subs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </section>
        )}

        <section className="mt-6">
          <h2 className="font-heading text-base md:text-lg font-bold mb-3">Tingkat kesulitan</h2>
          <Segmented testid="difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: 0, label: 'Semua' }, { value: 1, label: 'Mudah' }, { value: 2, label: 'Sedang' }, { value: 3, label: 'Sulit' }]} />
        </section>

        <section className="mt-6">
          <h2 className="font-heading text-base md:text-lg font-bold mb-3">Jumlah soal{mode === 'simulasi' ? ' per babak' : ''}</h2>
          <Segmented testid="count" value={count} onChange={setCount} options={[5, 10, 15, 20].map((n) => ({ value: n, label: `${n}` }))} />
        </section>

        {(mode === 'kuis' || mode === 'simulasi') && (
          <section className="mt-6">
            <h2 className="font-heading text-base md:text-lg font-bold mb-3">Waktu per soal</h2>
            <Segmented testid="timer" value={timerSec} onChange={setTimerSec} options={[10, 15, 20, 30].map((n) => ({ value: n, label: `${n} detik` }))} />
          </section>
        )}

        <p data-testid="available-count" className="text-sm text-stone-500 mt-6">{available} soal tersedia untuk pilihan ini{available < count * (mode === 'simulasi' ? 2 : 1) ? ' — sesi akan memakai soal yang ada.' : '.'}</p>
        <Btn data-testid="start-session-btn" className="w-full mt-3" disabled={!available} onClick={() => start(cfg)}>Mulai</Btn>
      </Page>
    </>
  );
}
