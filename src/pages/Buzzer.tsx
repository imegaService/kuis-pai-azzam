import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Eye, Check, X, SkipForward } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, Card, Page, Segmented, TopBar } from '../components/kit';
import { QuestionCard } from '../components/QuestionView';
import { shuffle } from '../lib/session';
import { sfx } from '../lib/sound';
import type { Question } from '../types';

const TEAM_STYLE = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-500', 'bg-rose-500'];
const DEFAULT_NAMES = ['Tim A', 'Tim B', 'Tim C', 'Tim D'];

export default function Buzzer() {
  const app = useApp();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup');
  const [n, setN] = useState(2);
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [count, setCount] = useState(10);
  const [qs, setQs] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [locked, setLocked] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);

  const press = (i: number) => {
    if (phase !== 'play' || locked !== null || reveal || excluded.includes(i) || i >= n) return;
    setLocked(i); sfx.buzz(); navigator.vibrate?.(150);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { const i = Number(e.key) - 1; if (i >= 0 && i < 4) press(i); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const start = () => { setQs(shuffle(app.bank).slice(0, count)); setIdx(0); setScores([0, 0, 0, 0]); resetQ(); setPhase('play'); };
  const resetQ = () => { setLocked(null); setExcluded([]); setReveal(false); };
  const judge = (ok: boolean) => {
    if (locked === null) return;
    const s = [...scores]; s[locked] += ok ? 10 : -5; setScores(s);
    if (ok) { sfx.correct(); setReveal(true); return; }
    sfx.wrong();
    const ex = [...excluded, locked]; setExcluded(ex); setLocked(null);
    if (ex.length >= n) setReveal(true);
  };
  const nextQ = () => { if (idx + 1 >= qs.length) { sfx.finish(); setPhase('done'); } else { setIdx(idx + 1); resetQ(); } };

  if (phase === 'setup') {
    return (
      <>
        <TopBar title="Buzzer Rebutan" back="/beranda" />
        <Page>
          <p className="text-stone-600 anim-up">Satu orang (orang tua/guru) membacakan soal. Peserta menekan tombol timnya secepat mungkin. Di laptop, tekan angka 1–4.</p>
          <h2 className="font-heading text-base md:text-lg font-bold mt-6 mb-3">Jumlah tim</h2>
          <Segmented testid="buzzer-teams" value={n} onChange={setN} options={[2, 3, 4].map((v) => ({ value: v, label: `${v} tim` }))} />
          <div className="grid gap-3 mt-4">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl ${TEAM_STYLE[i]} shrink-0`} />
                <input data-testid={`buzzer-team-name-${i}`} value={names[i]} maxLength={20} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} className="field" />
              </div>
            ))}
          </div>
          <h2 className="font-heading text-base md:text-lg font-bold mt-6 mb-3">Jumlah soal</h2>
          <Segmented testid="buzzer-count" value={count} onChange={setCount} options={[5, 10, 15, 20].map((v) => ({ value: v, label: `${v}` }))} />
          <Btn data-testid="buzzer-start-btn" className="w-full mt-8" onClick={start}>Mulai rebutan</Btn>
        </Page>
      </>
    );
  }

  const teams = Array.from({ length: n }).map((_, i) => ({ name: names[i] || DEFAULT_NAMES[i], score: scores[i], i }));
  if (phase === 'done') {
    const max = Math.max(...teams.map((t) => t.score));
    const winners = teams.filter((t) => t.score === max);
    return (
      <Page className="pt-10">
        <Trophy className="w-12 h-12 text-amber-500" />
        <h1 data-testid="buzzer-winner" className="font-heading text-4xl font-extrabold mt-3">{winners.length > 1 ? 'Seri!' : `${winners[0].name} menang!`}</h1>
        <div className="grid gap-2 mt-6">
          {[...teams].sort((a, b) => b.score - a.score).map((t) => (
            <Card key={t.i} className="p-4 flex items-center gap-3"><span className={`w-8 h-8 rounded-lg ${TEAM_STYLE[t.i]}`} /><span className="flex-1 font-semibold">{t.name}</span><span className="font-heading text-xl font-bold">{t.score}</span></Card>
          ))}
        </div>
        <div className="grid gap-3 mt-8">
          <Btn data-testid="buzzer-again-btn" onClick={() => setPhase('setup')}>Main lagi</Btn>
          <Btn variant="secondary" data-testid="buzzer-home-btn" onClick={() => nav('/beranda')}>Ke beranda</Btn>
        </div>
      </Page>
    );
  }

  const q = qs[idx];
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title={`Soal ${idx + 1}/${qs.length}`} back="/beranda" right={<Btn variant="ghost" data-testid="buzzer-end-btn" className="min-h-[40px] text-sm" onClick={() => setPhase('done')}>Selesai</Btn>} />
      <div className="max-w-2xl w-full mx-auto px-4 pt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {teams.map((t) => <div key={t.i} className="text-center"><p className="text-xs text-stone-500 truncate">{t.name}</p><p data-testid={`buzzer-score-${t.i}`} className="font-heading text-2xl font-bold">{t.score}</p></div>)}
      </div>
      <Page className="flex-1 w-full">
        <QuestionCard key={q.id} q={{ ...q, meaning: undefined }} />
        {q.type === 'mc' && <ol className="mt-4 grid gap-1 text-stone-700">{q.options?.map((o, i) => <li key={o}>{String.fromCharCode(65 + i)}. {o}</li>)}</ol>}
        {reveal && <Card data-testid="buzzer-answer" className="p-4 mt-4 bg-emerald-50 border-emerald-300"><p className="font-semibold">Jawaban: {q.answer}</p><p className="text-sm text-stone-600 mt-1">{q.explanation}</p></Card>}
        {locked !== null && !reveal && (
          <Card data-testid="buzzer-locked" className="p-4 mt-4 anim-up">
            <p className="font-heading text-xl font-bold">{teams[locked].name} menjawab!</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Btn data-testid="buzzer-correct-btn" onClick={() => judge(true)}><Check className="w-5 h-5" />Benar +10</Btn>
              <Btn variant="danger" data-testid="buzzer-wrong-btn" onClick={() => judge(false)}><X className="w-5 h-5" />Salah −5</Btn>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {!reveal && <Btn variant="secondary" data-testid="buzzer-reveal-btn" onClick={() => setReveal(true)}><Eye className="w-5 h-5" />Tampilkan jawaban</Btn>}
          <Btn variant={reveal ? 'primary' : 'secondary'} data-testid="buzzer-next-btn" className={reveal ? 'col-span-2' : ''} onClick={nextQ}><SkipForward className="w-5 h-5" />{idx + 1 >= qs.length ? 'Selesai' : 'Soal berikutnya'}</Btn>
        </div>
      </Page>
      <div className="sticky bottom-0 grid gap-2 p-2 bg-stone-50" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {teams.map((t) => {
          const off = excluded.includes(t.i) || reveal || (locked !== null && locked !== t.i);
          return (
            <button key={t.i} data-testid={`buzzer-btn-${t.i}`} onPointerDown={() => press(t.i)}
              className={`h-28 sm:h-36 rounded-3xl text-white font-heading text-lg font-bold select-none touch-manipulation transition-[opacity,transform] active:scale-95 ${TEAM_STYLE[t.i]} ${off ? 'opacity-30' : ''} ${locked === t.i ? 'ring-4 ring-stone-900 scale-[1.02]' : ''}`}>
              {t.name}<span className="block text-xs font-normal opacity-80">tekan {t.i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
