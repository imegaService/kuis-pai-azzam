import type { Question, Profile, CategoryId } from '../types';
import { CAT_IDS } from './categories';

export function validateQuestion(q: Partial<Question>): string[] {
  const e: string[] = [];
  if (!q.category || !CAT_IDS.includes(q.category as CategoryId)) e.push('Kategori wajib dipilih.');
  if (!q.question || q.question.trim().length < 5) e.push('Pertanyaan minimal 5 karakter.');
  if (q.type !== 'mc' && q.type !== 'short') e.push('Tipe soal tidak valid.');
  if (q.type === 'mc') {
    const opts = (q.options ?? []).map((o) => (o ?? '').trim());
    if (opts.length < 2 || opts.length > 5) e.push('Pilihan ganda butuh 2–5 opsi.');
    if (opts.some((o) => !o)) e.push('Semua opsi jawaban wajib diisi.');
    if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) e.push('Opsi jawaban tidak boleh kembar.');
    if (!q.answer || !opts.includes(q.answer.trim())) e.push('Jawaban benar harus salah satu dari opsi.');
  }
  if (q.type === 'short' && (!q.answer || !q.answer.trim())) e.push('Jawaban benar wajib diisi.');
  if (!q.explanation || q.explanation.trim().length < 3) e.push('Pembahasan wajib diisi.');
  if (![1, 2, 3].includes(q.difficulty as number)) e.push('Tingkat kesulitan tidak valid.');
  return e;
}

export function emptyStats() {
  return Object.fromEntries(CAT_IDS.map((c) => [c, { answered: 0, correct: 0, timeMs: 0 }])) as Profile['stats'];
}

export function sanitizeProfile(p: any): Profile | null {
  if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') return null;
  const stats = emptyStats();
  for (const c of CAT_IDS) {
    const s = p.stats?.[c];
    if (s) stats[c] = { answered: +s.answered || 0, correct: +s.correct || 0, timeMs: +s.timeMs || 0 };
  }
  return {
    id: p.id,
    name: p.name.slice(0, 30),
    color: p.color || 'emerald',
    icon: p.icon || 'star',
    createdAt: p.createdAt || new Date().toISOString(),
    totalScore: +p.totalScore || 0,
    streak: +p.streak || 0,
    bestStreak: +p.bestStreak || 0,
    dayStreak: +p.dayStreak || 0,
    lastDay: p.lastDay,
    stats,
    wrong: p.wrong && typeof p.wrong === 'object' ? p.wrong : {},
    history: Array.isArray(p.history) ? p.history.slice(0, 200) : [],
  };
}
