import type { Profile } from '../types';
import { CATEGORIES } from './categories';

export interface Readiness {
  score: number;
  accuracy: number;
  speed: number;
  evenness: number;
  answered: number;
  avgSec: number;
  covered: number;
  badge: { label: string; cls: string };
  weakest: { id: string; name: string; acc: number; answered: number } | null;
  perCat: { id: string; name: string; acc: number; answered: number }[];
}

const FULL_COVERAGE = 10;

export function badgeFor(score: number) {
  if (score >= 85) return { label: 'Sangat Matang', cls: 'bg-emerald-600 text-white' };
  if (score >= 65) return { label: 'Siap Lomba', cls: 'bg-sky-600 text-white' };
  if (score >= 40) return { label: 'Mulai Siap', cls: 'bg-amber-500 text-white' };
  return { label: 'Perlu Latihan Dasar', cls: 'bg-stone-500 text-white' };
}

export function computeReadiness(p: Profile): Readiness {
  let answered = 0, correct = 0, timeMs = 0;
  const perCat = CATEGORIES.map((c) => {
    const s = p.stats[c.id];
    answered += s.answered; correct += s.correct; timeMs += s.timeMs;
    return { id: c.id, name: c.name, acc: s.answered ? s.correct / s.answered : 0, answered: s.answered };
  });
  const accuracy = answered ? correct / answered : 0;
  const avgSec = answered ? timeMs / answered / 1000 : 0;
  const speed = answered ? Math.max(0, Math.min(1, (25 - avgSec) / 20)) * accuracy : 0;
  const evenness = perCat.reduce((sum, c) => sum + c.acc * Math.min(1, c.answered / FULL_COVERAGE), 0) / perCat.length;
  const covered = perCat.filter((c) => c.answered >= 5).length;
  const cap = 40 + covered * 15;
  const score = Math.min(cap, Math.round(accuracy * 50 + speed * 25 + evenness * 25));
  const weakest = [...perCat].sort((a, b) => a.acc * Math.min(1, a.answered / FULL_COVERAGE) - b.acc * Math.min(1, b.answered / FULL_COVERAGE))[0] ?? null;
  return { score, accuracy, speed, evenness, answered, avgSec, covered, badge: badgeFor(score), weakest: answered ? weakest : null, perCat };
}
