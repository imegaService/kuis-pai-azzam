import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Eye, EyeOff, Loader2, PlugZap, Sparkles, CheckCircle2, XCircle, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Btn, Card, Segmented } from '../../components/kit';
import { CATEGORIES } from '../../lib/categories';
import { DEFAULT_MODEL, FALLBACK_MODELS, generateQuestions, testConnection } from '../../lib/gemini';
import type { CategoryId, Difficulty, Question } from '../../types';

export default function AiTab() {
  const app = useApp();
  const s = app.settings;
  const [key, setKey] = useState(s.geminiKey);
  const [model, setModel] = useState(s.geminiModel || DEFAULT_MODEL);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; kind?: string; message: string } | null>(null);
  const [cat, setCat] = useState<CategoryId>('aqidah');
  const [count, setCount] = useState(5);
  const [diff, setDiff] = useState<Difficulty>(1);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Question[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const saveKey = () => { app.updateSettings({ geminiKey: key.trim(), geminiModel: model.trim() || DEFAULT_MODEL }); toast.success('Pengaturan AI disimpan.'); };
  const removeKey = () => { setKey(''); app.updateSettings({ geminiKey: '' }); setStatus(null); toast.success('API key dihapus dari perangkat.'); };
  const test = async () => {
    setTesting(true); setStatus(null);
    const r = await testConnection(key.trim(), model.trim() || DEFAULT_MODEL);
    setStatus(r); setTesting(false);
    if (r.ok) app.updateSettings({ geminiKey: key.trim(), geminiModel: model.trim() || DEFAULT_MODEL });
  };
  const gen = async () => {
    setBusy(true);
    try {
      const r = await generateQuestions(s.geminiKey, s.geminiModel, cat, count, diff, topic);
      setPreview(r.valid); setPicked(new Set(r.valid.map((q) => q.id)));
      toast.success(`${r.valid.length} soal dibuat (model ${r.model})${r.rejected ? `, ${r.rejected} ditolak karena tidak valid` : ''}.`);
    } catch (e: any) { toast.error(e?.message || 'Gagal membuat soal.'); }
    setBusy(false);
  };
  const saveSelected = () => {
    preview.filter((q) => picked.has(q.id)).forEach(app.saveQuestion);
    toast.success(`${picked.size} soal ditambahkan ke bank soal.`);
    setPreview([]); setPicked(new Set());
  };
  const StatusIcon = status?.ok ? CheckCircle2 : status?.kind === 'offline' ? WifiOff : XCircle;
  const canUse = !!s.geminiKey && app.online;

  return (
    <div className="anim-up grid gap-6">
      <Card className="p-4 bg-amber-50 border-amber-200 flex gap-3 text-sm text-amber-900">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>AI bersifat opsional. Semua latihan tetap jalan tanpa AI dan tanpa internet. API key disimpan di browser perangkat ini saja (tidak seaman server) — gunakan key pribadi, batasi kuotanya, dan hapus jika perangkat dipinjamkan.</p>
      </Card>

      <Card className="p-5 grid gap-3">
        <p className="font-semibold">Gemini API key</p>
        <div className="flex gap-2">
          <input data-testid="gemini-key-input" type={show ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder="Tempel API key (AIza... atau AQ....)" autoComplete="off" spellCheck={false} className="field font-mono text-base" />
          <button data-testid="gemini-key-toggle" aria-label="Lihat key" onClick={() => setShow(!show)} className="w-14 shrink-0 rounded-2xl border border-stone-200 flex items-center justify-center">{show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
        </div>
        <Btn variant="secondary" data-testid="gemini-test-btn" disabled={testing || !key.trim()} onClick={test}>
          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlugZap className="w-5 h-5" />}Tes Koneksi API
        </Btn>
        {status && (
          <p data-testid="gemini-test-status" className={`text-sm font-semibold flex items-center gap-2 rounded-xl px-3 py-2 ${status.ok ? 'bg-emerald-50 text-emerald-800' : status.kind === 'offline' ? 'bg-stone-100 text-stone-700' : 'bg-rose-50 text-rose-700'}`}>
            <StatusIcon className="w-4 h-4 shrink-0" />{status.message}
          </p>
        )}
        <label className="block mt-2">
          <span className="text-sm font-semibold text-stone-700">Nama model</span>
          <input data-testid="gemini-model-input" value={model} onChange={(e) => setModel(e.target.value)} className="field mt-2 font-mono text-base" list="gemini-models" />
          <datalist id="gemini-models">{FALLBACK_MODELS.map((m) => <option key={m} value={m} />)}</datalist>
          <span className="text-xs text-stone-500 mt-1 block">Jika model ini tidak tersedia, otomatis mencoba: {FALLBACK_MODELS.join(' → ')}.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Btn data-testid="gemini-save-btn" onClick={saveKey}>Simpan</Btn>
          <Btn variant="secondary" data-testid="gemini-remove-btn" disabled={!s.geminiKey} onClick={removeKey}>Hapus key</Btn>
        </div>
        <label className="flex items-center gap-3 text-sm mt-1">
          <input type="checkbox" data-testid="setting-ai-check" checked={s.aiCheck} onChange={(e) => app.updateSettings({ aiCheck: e.target.checked })} className="w-5 h-5 accent-emerald-700" />
          Bantu cek jawaban isian dengan AI saat online (jika penilaian lokal menyatakan salah)
        </label>
      </Card>

      <Card className="p-5 grid gap-4">
        <p className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-sky-600" />Buat soal tambahan</p>
        {!canUse && <p data-testid="ai-unavailable" className="text-sm text-stone-500">{!app.online ? 'Sedang offline — fitur ini nonaktif.' : 'Isi dan simpan API key terlebih dahulu.'}</p>}
        <select data-testid="ai-category" value={cat} onChange={(e) => setCat(e.target.value as CategoryId)} className="field">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input data-testid="ai-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Subtopik (opsional), mis. Asmaul Husna" className="field" />
        <Segmented testid="ai-count" value={count} onChange={setCount} options={[3, 5, 10].map((n) => ({ value: n, label: `${n} soal` }))} />
        <Segmented testid="ai-difficulty" value={diff} onChange={setDiff} options={[{ value: 1, label: 'Mudah' }, { value: 2, label: 'Sedang' }, { value: 3, label: 'Sulit' }]} />
        <Btn data-testid="ai-generate-btn" disabled={!canUse || busy} onClick={gen}>{busy ? <><Loader2 className="w-5 h-5 animate-spin" />Membuat soal...</> : 'Buat soal'}</Btn>
        {preview.length > 0 && (
          <div className="grid gap-2" data-testid="ai-preview">
            <p className="text-sm text-stone-600">Periksa dulu sebelum disimpan. Hapus centang soal yang kurang tepat.</p>
            {preview.map((q) => (
              <label key={q.id} className="flex gap-3 bg-stone-50 rounded-2xl p-3 text-sm">
                <input type="checkbox" checked={picked.has(q.id)} onChange={() => { const n = new Set(picked); n.has(q.id) ? n.delete(q.id) : n.add(q.id); setPicked(n); }} className="w-5 h-5 accent-emerald-700 mt-0.5 shrink-0" />
                <span><b>{q.question}</b><br /><span className="text-emerald-800">Jawaban: {q.answer}</span>{q.options && <span className="text-stone-500"> · Opsi: {q.options.join(' / ')}</span>}<br /><span className="text-stone-500">{q.explanation}</span></span>
              </label>
            ))}
            <Btn data-testid="ai-save-selected-btn" disabled={!picked.size} onClick={saveSelected}>Simpan {picked.size} soal</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}
