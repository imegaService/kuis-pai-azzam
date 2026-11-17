import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Btn, Page, Segmented, TopBar } from '../components/kit';
import { CATEGORIES } from '../lib/categories';
import { validateQuestion } from '../lib/validate';
import { uid } from '../lib/storage';
import type { Question } from '../types';

const blank = (): Question => ({ id: `custom-${uid()}`, category: 'aqidah', subtopic: '', type: 'mc', question: '', options: ['', '', '', ''], answer: '', aliases: [], explanation: '', difficulty: 1, tag: 'belajar', source: 'custom' });

export default function QuestionEditor() {
  const { id } = useParams();
  const app = useApp();
  const nav = useNavigate();
  const existing = id && id !== 'baru' ? app.bank.find((q) => q.id === id) : undefined;
  const [q, setQ] = useState<Question>(() => (existing ? { ...existing, options: existing.options ? [...existing.options, '', '', '', ''].slice(0, Math.max(4, existing.options.length)) : ['', '', '', ''] } : blank()));
  const [aliasText, setAliasText] = useState((existing?.aliases ?? []).join(', '));
  const [errors, setErrors] = useState<string[]>([]);
  if (id && id !== 'baru' && !existing) return <Navigate to="/orangtua/pengaturan" replace />;
  const set = (p: Partial<Question>) => setQ((x) => ({ ...x, ...p }));

  const save = () => {
    const final: Question = {
      ...q,
      question: q.question.trim(),
      subtopic: q.subtopic.trim() || 'Umum',
      explanation: q.explanation.trim(),
      answer: q.answer.trim(),
      options: q.type === 'mc' ? (q.options ?? []).map((o) => o.trim()) : undefined,
      aliases: q.type === 'short' ? aliasText.split(',').map((a) => a.trim()).filter(Boolean) : [],
      arabic: q.category === 'juzamma' ? q.arabic?.trim() || undefined : undefined,
      latin: q.category === 'juzamma' ? q.latin?.trim() || undefined : undefined,
      meaning: q.category === 'juzamma' ? q.meaning?.trim() || undefined : undefined,
    };
    const e = validateQuestion(final);
    setErrors(e);
    if (e.length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    app.saveQuestion(final);
    nav('/orangtua/pengaturan', { replace: true, state: { tab: 'soal', saved: true } });
  };

  return (
    <>
      <TopBar title={existing ? 'Edit soal' : 'Tambah soal'} back="/orangtua/pengaturan" />
      <Page>
        {errors.length > 0 && (
          <div data-testid="editor-errors" className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
            <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Periksa lagi:</p>
            <ul className="list-disc pl-5 mt-1">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}
        <div className="grid gap-5">
          <Field label="Kategori">
            <select data-testid="editor-category" value={q.category} onChange={(e) => set({ category: e.target.value as Question['category'] })} className="field">
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subtopik"><input data-testid="editor-subtopic" value={q.subtopic} onChange={(e) => set({ subtopic: e.target.value })} className="field" placeholder="contoh: Malaikat" /></Field>
          <Field label="Tipe soal"><Segmented testid="editor-type" value={q.type} onChange={(v) => set({ type: v, answer: '' })} options={[{ value: 'mc', label: 'Pilihan ganda' }, { value: 'short', label: 'Isian singkat' }]} /></Field>
          {q.category === 'juzamma' && (
            <>
              <Field label="Teks Arab (opsional)"><textarea data-testid="editor-arabic" dir="rtl" value={q.arabic ?? ''} onChange={(e) => set({ arabic: e.target.value })} className="field font-arabic text-2xl min-h-[90px]" /></Field>
              <Field label="Teks latin (opsional)"><input data-testid="editor-latin" value={q.latin ?? ''} onChange={(e) => set({ latin: e.target.value })} className="field" /></Field>
              <Field label="Arti (opsional)"><input data-testid="editor-meaning" value={q.meaning ?? ''} onChange={(e) => set({ meaning: e.target.value })} className="field" /></Field>
            </>
          )}
          <Field label="Pertanyaan"><textarea data-testid="editor-question" value={q.question} onChange={(e) => set({ question: e.target.value })} className="field min-h-[96px]" /></Field>
          {q.type === 'mc' ? (
            <Field label="Opsi jawaban (pilih satu yang benar)">
              <div className="grid gap-2">
                {(q.options ?? []).map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" data-testid={`editor-correct-${i}`} checked={!!o && q.answer === o} onChange={() => set({ answer: o })} className="w-6 h-6 accent-emerald-700 shrink-0" />
                    <input data-testid={`editor-option-${i}`} value={o} onChange={(e) => { const opts = [...(q.options ?? [])]; const wasAns = q.answer === o; opts[i] = e.target.value; set({ options: opts, answer: wasAns ? e.target.value : q.answer }); }} className="field" placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
                  </div>
                ))}
              </div>
            </Field>
          ) : (
            <>
              <Field label="Jawaban benar"><input data-testid="editor-answer" value={q.answer} onChange={(e) => set({ answer: e.target.value })} className="field" /></Field>
              <Field label="Alias / variasi jawaban (pisahkan dengan koma)"><input data-testid="editor-aliases" value={aliasText} onChange={(e) => setAliasText(e.target.value)} className="field" placeholder="contoh: abubakar, abu bakr" /></Field>
            </>
          )}
          <Field label="Pembahasan"><textarea data-testid="editor-explanation" value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} className="field min-h-[80px]" /></Field>
          <Field label="Tingkat kesulitan"><Segmented testid="editor-difficulty" value={q.difficulty} onChange={(v) => set({ difficulty: v })} options={[{ value: 1, label: 'Mudah' }, { value: 2, label: 'Sedang' }, { value: 3, label: 'Sulit' }]} /></Field>
          <Field label="Tag"><Segmented testid="editor-tag" value={q.tag} onChange={(v) => set({ tag: v })} options={[{ value: 'belajar', label: 'Belajar' }, { value: 'lomba', label: 'Lomba' }]} /></Field>
          <Btn data-testid="editor-save-btn" onClick={save}>Simpan soal</Btn>
        </div>
      </Page>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-sm font-semibold text-stone-700 mb-2">{label}</span>{children}</label>;
}
