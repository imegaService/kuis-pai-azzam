import type { Question, Tolerance } from '../types';

const NUM: Record<string, string> = {
  nol: '0', satu: '1', dua: '2', tiga: '3', empat: '4', lima: '5', enam: '6', tujuh: '7', delapan: '8',
  sembilan: '9', sepuluh: '10', sebelas: '11', duabelas: '12', tigabelas: '13', empatbelas: '14',
  limabelas: '15', duapuluh: '20', duapuluhlima: '25', empatpuluh: '40', enampuluhtiga: '63',
};
const FILLER = /^(surah|surat|qs|nabi|rasul|rasulullah|sayyidina|sayidina|malaikat|kitab|perang|shalat|salat|sholat|air|pimpinan|zakat|sujud|maha)\s+/;
const ARTICLE = /^(al|an|as|ar|at|ad|az|asy|adz|ash|wal)\s+/;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’'`´"“”\-–—_.,!?;:()/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function strip(s: string): string {
  let t = s;
  let prev = '';
  while (prev !== t) {
    prev = t;
    t = t.replace(FILLER, '').replace(ARTICLE, '');
  }
  return t;
}

function phonetic(s: string): string {
  const compact = s.replace(/\s/g, '');
  if (NUM[compact]) return NUM[compact];
  return compact
    .replace(/kh/g, 'h')
    .replace(/dh|dl/g, 'd')
    .replace(/dz|zh/g, 'z')
    .replace(/th/g, 't')
    .replace(/sy|sh|ts/g, 's')
    .replace(/q/g, 'k')
    .replace(/oe/g, 'u')
    .replace(/o/g, 'a')
    .replace(/w/g, 'u')
    .replace(/(.)\1+/g, '$1');
}

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function allowed(len: number, tol: Tolerance): number {
  if (tol === 'ketat' || len <= 3) return 0;
  const base = len <= 6 ? 1 : len <= 11 ? 2 : 3;
  return tol === 'longgar' ? base + 1 : base;
}

export interface GradeResult { correct: boolean; method: 'exact' | 'alias' | 'fuzzy' | 'none' }

const NAMES = [
  'Jibril', 'Mikail', 'Israfil', 'Izrail', 'Munkar', 'Nakir', 'Raqib', 'Atid', 'Malik', 'Ridwan',
  'Adam', 'Idris', 'Nuh', 'Hud', 'Saleh', 'Ibrahim', 'Luth', 'Ismail', 'Ishaq', 'Yakub', 'Yusuf', 'Ayub', 'Syuaib', 'Musa', 'Harun',
  'Zulkifli', 'Daud', 'Sulaiman', 'Ilyas', 'Ilyasa', 'Yunus', 'Zakaria', 'Yahya', 'Isa', 'Muhammad',
  'An-Nas', 'An-Nasr', 'Al-Falaq', 'Al-Fil', 'Al-Lail', 'Al-Alaq', 'Al-Qadr', 'Al-Fajr', 'Al-Asr', 'Ad-Duha', 'At-Tin', 'Al-Ikhlas', 'Al-Kautsar', 'Al-Kafirun', 'Al-Lahab', 'Quraisy', "Al-Ma'un", 'Al-Humazah', 'At-Takatsur', "Al-Qari'ah", 'Al-Adiyat', 'Az-Zalzalah', 'Al-Bayyinah', "An-Naba'",
  'Abu Bakar', 'Umar', 'Utsman', 'Ali', 'Abu Thalib', 'Abu Lahab', 'Abdullah', 'Abdul Muthalib', 'Aminah', 'Khadijah', 'Aisyah', 'Fatimah',
];
const NAME_KEYS = NAMES.map((n) => phonetic(strip(normalize(n))));

export function gradeShort(input: string, q: Question, tol: Tolerance, confusables: string[] = []): GradeResult {
  const raw = normalize(input);
  if (!raw) return { correct: false, method: 'none' };
  const given = phonetic(strip(raw));
  const givenDigits = raw.match(/\d+/g);
  const cands = [q.answer, ...(q.aliases ?? [])];
  const candKeys = new Set(cands.map((c) => phonetic(strip(normalize(c)))));
  const others = [...NAME_KEYS, ...confusables.map((c) => phonetic(strip(normalize(c))))].filter((k) => k && !candKeys.has(k));
  for (let i = 0; i < cands.length; i++) {
    const c = normalize(cands[i]);
    const method = i === 0 ? 'exact' : 'alias';
    if (raw === c || raw.replace(/\s/g, '') === c.replace(/\s/g, '')) return { correct: true, method };
    const target = phonetic(strip(c));
    if (/^\d+$/.test(target)) {
      if (given === target || (givenDigits && givenDigits.length === 1 && givenDigits[0] === target)) return { correct: true, method };
      continue;
    }
    if (given === target) return { correct: true, method };
    const d = lev(given, target);
    if (tol !== 'ketat' && given[0] === target[0] && d <= allowed(target.length, tol) && !others.some((o) => lev(given, o) <= d)) return { correct: true, method: 'fuzzy' };
  }
  return { correct: false, method: 'none' };
}
