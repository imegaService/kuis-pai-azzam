import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Btn, CatBadge, ConfirmDialog } from '../../components/kit';
import { CATEGORIES } from '../../lib/categories';
import { BUILTIN_QUESTIONS } from '../../data';

export default function QuestionsTab() {
  const app = useApp();
  const nav = useNavigate();
  const [cat, setCat] = useState('all');
  const [term, setTerm] = useState('');
  const [limit, setLimit] = useState(30);
  const [del, setDel] = useState<string | null>(null);
  const [restore, setRestore] = useState(false);
  const list = useMemo(() => app.bank.filter((q) => (cat === 'all' || q.category === cat) && (!term || `${q.question} ${q.answer} ${q.subtopic}`.toLowerCase().includes(term.toLowerCase()))), [app.bank, cat, term]);
  const counts = CATEGORIES.map((c) => ({ ...c, n: app.bank.filter((q) => q.category === c.id).length }));
  const mc = app.bank.filter((q) => q.type === 'mc').length;

  return (
    <div className="anim-up">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p data-testid="bank-total" className="font-heading text-3xl font-extrabold">{app.bank.length} soal</p>
          <p className="text-sm text-stone-500">{mc} pilihan ganda · {app.bank.length - mc} isian · {app.custom.length} tambahan</p>
        </div>
        <Btn data-testid="add-question-btn" className="shrink-0" onClick={() => nav('/orangtua/soal/baru')}><Plus className="w-5 h-5" />Tambah</Btn>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 text-xs">{counts.map((c) => <span key={c.id} className={`px-2.5 py-1 rounded-full ${c.bg} ${c.text} font-semibold`}>{c.name}: {c.n}</span>)}</div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <select data-testid="bank-filter-category" value={cat} onChange={(e) => { setCat(e.target.value); setLimit(30); }} className="field">
          <option value="all">Semua kategori</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input data-testid="bank-search-input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cari soal..." className="field pl-11" />
        </div>
      </div>

      <div className="grid gap-2 mt-4" data-testid="bank-list">
        {list.slice(0, limit).map((q) => (
          <div key={q.id} data-testid={`bank-item-${q.id}`} className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <CatBadge id={q.category} />
              <span className="text-xs text-stone-500">{q.type === 'mc' ? 'Pilihan ganda' : 'Isian'} · {q.source === 'builtin' ? (app.overrides[q.id] ? 'bawaan (diedit)' : 'bawaan') : q.source === 'ai' ? 'AI' : 'manual'}</span>
            </div>
            <p className="mt-2 font-medium leading-snug">{q.question}</p>
            <p className="text-sm text-emerald-800 mt-1">Jawaban: {q.answer}</p>
            <div className="flex gap-2 mt-3">
              <button data-testid={`edit-question-${q.id}`} onClick={() => nav(`/orangtua/soal/${q.id}`)} className="min-h-[40px] px-3 rounded-xl border border-stone-200 text-sm font-semibold flex items-center gap-1.5 hover:bg-stone-50"><Pencil className="w-4 h-4" />Edit</button>
              <button data-testid={`delete-question-${q.id}`} onClick={() => setDel(q.id)} className="min-h-[40px] px-3 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-rose-50"><Trash2 className="w-4 h-4" />Hapus</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-stone-500" data-testid="bank-empty">Tidak ada soal yang cocok.</p>}
        {list.length > limit && <Btn variant="secondary" data-testid="bank-load-more-btn" onClick={() => setLimit(limit + 30)}>Tampilkan lebih banyak ({list.length - limit})</Btn>}
      </div>

      {(app.hidden.length > 0 || Object.keys(app.overrides).length > 0) && (
        <Btn variant="ghost" data-testid="restore-builtins-btn" className="w-full mt-6" onClick={() => setRestore(true)}><RotateCcw className="w-4 h-4" />Pulihkan soal bawaan ({app.hidden.length} dihapus, {Object.keys(app.overrides).length} diedit)</Btn>
      )}

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Hapus soal ini?"
        message={del && BUILTIN_QUESTIONS.some((q) => q.id === del) ? 'Soal bawaan akan disembunyikan dan bisa dipulihkan kembali.' : 'Soal tambahan akan dihapus permanen.'}
        confirmLabel="Hapus" onConfirm={() => del && app.deleteQuestion(del)} />
      <ConfirmDialog open={restore} onClose={() => setRestore(false)} title="Pulihkan soal bawaan?" message="Semua soal bawaan yang dihapus atau diedit akan kembali ke versi asli." confirmLabel="Pulihkan" danger={false} onConfirm={app.restoreBuiltins} />
    </div>
  );
}
