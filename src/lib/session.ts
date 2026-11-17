import type { Question, Profile, SessionConfig, CategoryId } from '../types';

export interface Round {
  name: string;
  desc: string;
  timerSec: number;
  correctPts: number;
  wrongPts: number;
  timeBonus: boolean;
  allowPass: boolean;
  questions: Question[];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const prep = (q: Question): Question => (q.type === 'mc' && q.options ? { ...q, options: shuffle(q.options) } : q);

export function filterPool(bank: Question[], c: Pick<SessionConfig, 'category' | 'subtopic' | 'difficulty'>) {
  return bank.filter((q) =>
    (c.category === 'campur' || q.category === c.category) &&
    (!c.subtopic || q.subtopic === c.subtopic) &&
    (!c.difficulty || q.difficulty === c.difficulty));
}

function balanced(pool: Question[], n: number): Question[] {
  const groups: Record<string, Question[]> = {};
  shuffle(pool).forEach((q) => (groups[q.category] ??= []).push(q));
  const lists = shuffle(Object.values(groups));
  const out: Question[] = [];
  while (out.length < n && lists.some((l) => l.length)) {
    for (const l of lists) if (l.length && out.length < n) out.push(l.shift() as Question);
  }
  return out;
}

export function buildRounds(cfg: SessionConfig, bank: Question[], profile: Profile): Round[] {
  const base = { correctPts: 10, wrongPts: 0, timeBonus: false, allowPass: false };
  if (cfg.mode === 'ulangi') {
    const qs = bank.filter((q) => profile.wrong[q.id])
      .sort((a, b) => profile.wrong[b.id].count - profile.wrong[a.id].count)
      .slice(0, cfg.count);
    return [{ ...base, name: 'Ulangi Soal Salah', desc: 'Jawab benar untuk menghapus soal dari daftar.', timerSec: 0, questions: shuffle(qs).map(prep) }];
  }
  const pool = filterPool(bank, cfg);
  if (cfg.mode === 'simulasi') {
    const qs = balanced(pool, cfg.count * 2).map(prep);
    const t = cfg.timerSec;
    return [
      { ...base, name: 'Babak 1 · Wajib', desc: `Setiap soal wajib dijawab dalam ${t} detik. Benar +10, salah 0.`, timerSec: t, questions: qs.slice(0, cfg.count) },
      { ...base, name: 'Babak 2 · Rebutan', desc: `Lebih cepat: ${Math.max(8, t - 5)} detik. Benar +10, salah −5. Boleh lewati jika ragu (0).`, timerSec: Math.max(8, t - 5), wrongPts: -5, allowPass: true, questions: qs.slice(cfg.count) },
    ].filter((r) => r.questions.length);
  }
  const wrongIds = new Set(Object.keys(profile.wrong));
  const wrongQs = shuffle(pool.filter((q) => wrongIds.has(q.id))).slice(0, Math.ceil(cfg.count * 0.3));
  const rest = (cfg.category === 'campur' ? balanced(pool.filter((q) => !wrongIds.has(q.id)), cfg.count) : shuffle(pool.filter((q) => !wrongIds.has(q.id))));
  const qs = shuffle([...wrongQs, ...rest.slice(0, cfg.count - wrongQs.length)]).map(prep);
  if (cfg.mode === 'kuis') {
    return [{ ...base, name: 'Kuis Timer', desc: `${cfg.timerSec} detik per soal. Makin cepat benar, makin besar bonus.`, timerSec: cfg.timerSec, timeBonus: true, questions: qs }];
  }
  return [{ ...base, name: 'Latihan Topik', desc: 'Tanpa batas waktu. Baca pembahasan setiap soal.', timerSec: 0, questions: qs }];
}

export function subtopicsOf(bank: Question[], cat: CategoryId | 'campur'): string[] {
  if (cat === 'campur') return [];
  return Array.from(new Set(bank.filter((q) => q.category === cat).map((q) => q.subtopic)));
}
