import React from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Page, TopBar } from '../components/kit';
import { Gauge } from '../components/Gauge';
import { computeReadiness } from '../lib/readiness';
import { CATEGORIES, MODE_LABEL, catName } from '../lib/categories';

export default function Progress() {
  const app = useApp();
  const p = app.active;
  if (!p) return <Navigate to="/" replace />;
  const r = computeReadiness(p);
  const parts = [
    { k: 'Akurasi', v: r.accuracy, w: '50%', testid: 'readiness-accuracy' },
    { k: 'Kecepatan', v: r.speed, w: '25%', testid: 'readiness-speed' },
    { k: 'Pemerataan', v: r.evenness, w: '25%', testid: 'readiness-evenness' },
  ];
  return (
    <>
      <TopBar title={`Progres ${p.name}`} back="/beranda" />
      <Page>
        <Card className="p-6 anim-up">
          <p className="text-sm font-semibold text-stone-500 text-center mb-2">Tolok Ukur Kesiapan Lomba</p>
          <Gauge value={r.score} label="kesiapan" />
          <div className="flex justify-center mt-4"><span data-testid="readiness-badge" className={`px-4 py-1.5 rounded-full text-sm font-bold ${r.badge.cls}`}>{r.badge.label}</span></div>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {parts.map((x) => (
              <div key={x.k} className="bg-stone-50 rounded-2xl p-3 text-center">
                <p data-testid={x.testid} className="font-heading text-xl font-bold">{Math.round(x.v * 100)}%</p>
                <p className="text-xs text-stone-500">{x.k} <span className="text-stone-400">({x.w})</span></p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-4 text-center">{r.answered} soal dijawab · rata-rata {r.avgSec.toFixed(1)} detik/soal</p>
          {r.covered < 4 && r.answered > 0 && <p data-testid="readiness-cap-note" className="text-xs text-amber-700 mt-1 text-center">Baru {r.covered} dari 5 kategori dilatih (min. 5 soal). Kesiapan maksimal {40 + r.covered * 15}% sampai kategori lain dilatih.</p>}
          {r.answered < 30 && <p className="text-xs text-amber-700 mt-1 text-center">Data masih sedikit — hasil makin akurat setelah 30+ soal.</p>}
        </Card>

        {r.weakest && (
          <Card data-testid="weakest-category-note" className="p-5 mt-4 bg-amber-50 border-amber-200 flex gap-3 anim-up" style={{ animationDelay: '80ms' }}>
            <AlertCircle className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="font-heading font-bold text-amber-900">Kategori terlemah: {r.weakest.name}</p>
              <p className="text-sm text-amber-900/80 mt-1">
                {r.weakest.answered === 0 ? 'Belum pernah dilatih. ' : `Akurasi ${Math.round(r.weakest.acc * 100)}% dari ${r.weakest.answered} soal. `}
                Saran untuk orang tua: dampingi latihan topik ini 10 soal per hari.
              </p>
            </div>
          </Card>
        )}

        <h2 className="font-heading text-base md:text-lg font-bold mt-8 mb-3">Per kategori</h2>
        <Card className="p-5 grid gap-4">
          {CATEGORIES.map((c) => {
            const s = p.stats[c.id];
            const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
            return (
              <div key={c.id} data-testid={`cat-stat-${c.id}`}>
                <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold flex items-center gap-1.5"><c.icon className={`w-4 h-4 ${c.text}`} />{c.name}</span><span className="text-stone-500 tabular-nums">{s.correct}/{s.answered} · {acc}%</span></div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${c.bar} rounded-full transition-[width] duration-700`} style={{ width: `${acc}%` }} /></div>
              </div>
            );
          })}
        </Card>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="p-4 text-center"><p data-testid="progress-total-score" className="font-heading text-2xl font-bold">{p.totalScore}</p><p className="text-xs text-stone-500">total poin</p></Card>
          <Card className="p-4 text-center"><p data-testid="progress-best-streak" className="font-heading text-2xl font-bold">{p.bestStreak}</p><p className="text-xs text-stone-500">rekor beruntun</p></Card>
          <Card className="p-4 text-center"><p data-testid="progress-day-streak" className="font-heading text-2xl font-bold">{p.dayStreak}</p><p className="text-xs text-stone-500">hari beruntun</p></Card>
        </div>

        <h2 className="font-heading text-base md:text-lg font-bold mt-8 mb-3">Riwayat latihan</h2>
        {p.history.length === 0 ? <p className="text-stone-500 text-sm" data-testid="history-empty">Belum ada riwayat. Yuk mulai latihan!</p> : (
          <div className="grid gap-2" data-testid="history-list">
            {p.history.slice(0, 30).map((h) => (
              <div key={h.id} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{MODE_LABEL[h.mode]} · {catName(h.category)}</p>
                  <p className="text-xs text-stone-500">{new Date(h.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="text-right"><p className="font-bold tabular-nums">{h.correct}/{h.total}</p><p className="text-xs text-emerald-700 font-semibold">{h.points} poin</p></div>
              </div>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
