import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { X, Clock, Loader2, SkipForward } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, ConfirmDialog, Page } from '../components/kit';
import { Feedback, OptionList, QuestionCard, ShortAnswer } from '../components/QuestionView';
import { buildRounds, Round } from '../lib/session';
import { gradeShort } from '../lib/grading';
import { evaluateShort } from '../lib/gemini';
import { sfx } from '../lib/sound';
import type { AnswerLog, SessionConfig } from '../types';

type Phase = 'intro' | 'answer' | 'checking' | 'feedback';

export default function Session() {
  const location = useLocation();
  const nav = useNavigate();
  const app = useApp();
  const config = (location.state as { config?: SessionConfig } | null)?.config;
  const [rounds] = useState<Round[]>(() => (config && app.active ? buildRounds(config, app.bank, app.active) : []));
  const [ri, setRi] = useState(0);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>(rounds.length > 1 ? 'intro' : 'answer');
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [remaining, setRemaining] = useState(rounds[0]?.timerSec ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [exitOpen, setExitOpen] = useState(false);
  const qStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());
  const lock = useRef(false);
  const round = rounds[ri];
  const confusables = useMemo(() => app.bank.flatMap((x) => [x.answer, ...(x.options ?? [])]), [app.bank]);
  const q = round?.questions[qi];

  useEffect(() => {
    if (phase !== 'answer' || !round?.timerSec) return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [phase, ri, qi]); // eslint-disable-line

  useEffect(() => {
    if (phase !== 'answer' || !round?.timerSec) return;
    if (remaining <= 0) submit('', true);
    else if (remaining <= 3) sfx.tick();
  }, [remaining]); // eslint-disable-line

  if (!config || !app.active) return <Navigate to="/beranda" replace />;
  if (!round || !q) {
    return <Page><p className="text-stone-600" data-testid="session-empty">Tidak ada soal yang cocok.</p><Btn className="mt-4 w-full" onClick={() => nav('/beranda')}>Kembali</Btn></Page>;
  }

  const total = rounds.reduce((s, r) => s + r.questions.length, 0);
  const doneBefore = rounds.slice(0, ri).reduce((s, r) => s + r.questions.length, 0) + qi;
  const points = logs.reduce((s, l) => s + l.points, 0);
  const last = logs[logs.length - 1];

  const begin = (r: Round) => { setPhase('answer'); setRemaining(r.timerSec); setSelected(null); setText(''); qStart.current = Date.now(); lock.current = false; };

  async function submit(given: string, timedOut = false) {
    if (lock.current || !q) return;
    lock.current = true;
    const timeMs = Date.now() - qStart.current;
    const passed = given === '__pass__';
    let correct = false, aiJudged = false, aiNote: string | undefined;
    setSelected(given);
    if (!passed && !timedOut) {
      if (q.type === 'mc') correct = given === q.answer;
      else {
        correct = gradeShort(given, q, app.settings.tolerance, confusables).correct;
        const s = app.settings;
        if (!correct && s.aiCheck && s.geminiKey && navigator.onLine && given.trim()) {
          setPhase('checking');
          try {
            const ev = await evaluateShort(s.geminiKey, s.geminiModel, q, given);
            if (ev.correct) { correct = true; aiJudged = true; }
            aiNote = ev.feedback;
          } catch { /* AI gagal: tetap pakai penilaian lokal */ }
        }
      }
    }
    const bonus = correct && round.timeBonus && round.timerSec ? Math.round((5 * Math.max(0, remaining)) / round.timerSec) : 0;
    const pts = correct ? round.correctPts + bonus : passed ? 0 : round.wrongPts;
    if (correct) sfx.correct(); else if (timedOut) sfx.timeout(); else sfx.wrong();
    setLogs((l) => [...l, { q, given, correct, timeMs, points: pts, timedOut, passed, aiJudged, aiNote }]);
    setPhase('feedback');
  }

  const finish = () => {
    const durationMs = Date.now() - sessionStart.current;
    app.recordSession({ mode: config.mode, category: config.category, logs, durationMs });
    sfx.finish();
    nav('/hasil', { replace: true, state: { config, logs, durationMs } });
  };

  const next = () => {
    if (qi + 1 < round.questions.length) { setQi(qi + 1); begin(round); }
    else if (ri + 1 < rounds.length) { setRi(ri + 1); setQi(0); setPhase('intro'); }
    else finish();
  };

  const pct = round.timerSec ? Math.max(0, remaining) / round.timerSec : 0;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button data-testid="session-exit-btn" aria-label="Keluar" onClick={() => setExitOpen(true)} className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center hover:bg-stone-200/60"><X className="w-6 h-6" /></button>
          <div className="flex-1">
            <p className="text-xs font-semibold text-stone-500">{round.name}</p>
            <div className="h-2 bg-stone-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${(doneBefore / total) * 100}%` }} /></div>
          </div>
          <span data-testid="session-progress" className="text-sm font-bold text-stone-600 tabular-nums">{doneBefore + 1}/{total}</span>
          <span data-testid="session-points" className="text-sm font-bold text-emerald-700 tabular-nums">{points} poin</span>
        </div>
        {round.timerSec > 0 && phase !== 'intro' && (
          <div className="h-1.5 bg-stone-200"><div data-testid="timer-bar" className={`h-full transition-[width] duration-1000 ease-linear ${remaining <= 5 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${pct * 100}%` }} /></div>
        )}
      </header>

      <Page>
        {phase === 'intro' ? (
          <div className="anim-up pt-6" data-testid="round-intro">
            <p className="text-sm font-semibold text-sky-700 uppercase tracking-wide">Bersiap</p>
            <h2 className="font-heading text-4xl font-extrabold mt-1">{round.name}</h2>
            <p className="text-stone-600 mt-3 text-lg leading-relaxed">{round.desc}</p>
            <p className="text-stone-500 mt-2">{round.questions.length} soal</p>
            <Btn data-testid="round-start-btn" className="w-full mt-8" onClick={() => begin(round)}>Mulai babak</Btn>
          </div>
        ) : (
          <>
            {round.timerSec > 0 && (
              <div className={`flex items-center gap-1.5 mb-4 font-heading font-bold text-lg tabular-nums ${remaining <= 5 ? 'text-rose-600' : 'text-amber-700'}`} data-testid="timer-remaining">
                <Clock className="w-5 h-5" />{Math.max(0, remaining)} detik
              </div>
            )}
            <QuestionCard key={q.id} q={q} />
            {q.type === 'mc'
              ? <OptionList q={q} selected={selected} revealed={phase !== 'answer'} onPick={(o) => submit(o)} />
              : <ShortAnswer value={text} onChange={setText} disabled={phase !== 'answer'} onSubmit={() => submit(text)} />}
            {phase === 'answer' && round.allowPass && (
              <Btn variant="ghost" data-testid="pass-btn" className="w-full mt-3" onClick={() => submit('__pass__')}><SkipForward className="w-5 h-5" />Lewati (0 poin)</Btn>
            )}
            {phase === 'checking' && <p data-testid="ai-checking" className="mt-4 text-sm text-sky-700 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Mengecek jawaban dengan AI...</p>}
            {phase === 'feedback' && last && (
              <>
                <Feedback log={last} />
                <Btn data-testid="next-question-btn" className="w-full mt-4" onClick={next} autoFocus>
                  {qi + 1 < round.questions.length ? 'Lanjut' : ri + 1 < rounds.length ? 'Babak berikutnya' : 'Lihat hasil'}
                </Btn>
              </>
            )}
          </>
        )}
      </Page>

      <ConfirmDialog open={exitOpen} onClose={() => setExitOpen(false)} title="Keluar dari sesi?" message="Jawaban di sesi ini tidak akan disimpan." confirmLabel="Keluar" onConfirm={() => nav('/beranda')} />
    </div>
  );
}
