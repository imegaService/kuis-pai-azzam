import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, Card, CatBadge, Page } from '../components/kit';
import { MODE_LABEL, catName } from '../lib/categories';
import type { AnswerLog, SessionConfig } from '../types';

export default function Result() {
  const { state } = useLocation() as { state: { config: SessionConfig; logs: AnswerLog[]; durationMs: number } | null };
  const app = useApp();
  const nav = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!state || !app.active) return <Navigate to="/beranda" replace />;
  const { config, logs } = state;
  const correct = logs.filter((l) => l.correct).length;
  const points = logs.reduce((s, l) => s + l.points, 0);
  const acc = logs.length ? Math.round((correct / logs.length) * 100) : 0;
  const avg = logs.length ? logs.reduce((s, l) => s + l.timeMs, 0) / logs.length / 1000 : 0;
  const msg = acc >= 90 ? 'Masyaa Allah, luar biasa!' : acc >= 70 ? 'Bagus sekali, terus pertahankan!' : acc >= 50 ? 'Sudah baik, ayo latih lagi.' : 'Tidak apa-apa, ulangi pelan-pelan ya.';

  return (
    <Page className="pt-8">
      <div className="anim-up">
        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">{MODE_LABEL[config.mode]} · {catName(config.category)}</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mt-1" data-testid="result-message">{msg}</h1>
      </div>
      <Card className="p-5 mt-6 grid grid-cols-3 gap-3 text-center anim-up" style={{ animationDelay: '80ms' }}>
        <div><p data-testid="result-correct" className="font-heading text-3xl font-extrabold">{correct}/{logs.length}</p><p className="text-xs text-stone-500">benar</p></div>
        <div><p data-testid="result-points" className="font-heading text-3xl font-extrabold text-emerald-700">{points}</p><p className="text-xs text-stone-500">poin</p></div>
        <div><p data-testid="result-avg-time" className="font-heading text-3xl font-extrabold">{avg.toFixed(1)}s</p><p className="text-xs text-stone-500">rata-rata</p></div>
      </Card>
      <p className="text-sm text-stone-500 mt-3">Benar beruntun saat ini: <b data-testid="result-streak">{app.active.streak}</b> · Total poin: <b>{app.active.totalScore}</b></p>

      <h2 className="font-heading text-base md:text-lg font-bold mt-8 mb-3">Pembahasan</h2>
      <div className="grid gap-2">
        {logs.map((l, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl">
            <button data-testid={`review-item-${i}`} onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full p-4 flex items-start gap-3 text-left">
              {l.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
              <span className="flex-1 text-sm font-medium leading-snug">{l.q.question}{l.q.arabic ? ` (${l.q.latin ?? ''})` : ''}</span>
              <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 pl-12 text-sm text-stone-700 space-y-1">
                <CatBadge id={l.q.category} />
                <p className="pt-1">Jawaban benar: <b>{l.q.answer}</b></p>
                <p>Jawabanmu: {l.timedOut ? 'waktu habis' : l.passed ? 'dilewati' : l.given || '-'}</p>
                <p className="text-stone-600">{l.q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 mt-8">
        <Btn data-testid="result-play-again-btn" onClick={() => nav('/sesi', { replace: true, state: { config } })}>Main lagi</Btn>
        <Btn variant="secondary" data-testid="result-home-btn" onClick={() => nav('/beranda')}>Ke beranda</Btn>
      </div>
    </Page>
  );
}
