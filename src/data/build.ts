import type { CategoryId, Question, Difficulty } from '../types';

export interface Extra { ar?: string; lt?: string; mn?: string }
// Row: [subtopik, pertanyaan, opsi[] | jawaban, indexBenar | alias[], pembahasan, kesulitan?, tag?, extra?]
export type Row = [string, string, string[] | string, number | string[], string, Difficulty?, ('lomba' | 'belajar')?, Extra?];

export function build(cat: CategoryId, rows: Row[]): Question[] {
  return rows.map((r, i) => {
    const [subtopic, question, third, fourth, explanation, diff = 1, tag, extra] = r;
    const isMc = Array.isArray(third);
    const difficulty = diff as Difficulty;
    return {
      id: `${cat}-${String(i + 1).padStart(3, '0')}`,
      category: cat,
      subtopic,
      type: isMc ? 'mc' : 'short',
      question,
      options: isMc ? (third as string[]) : undefined,
      answer: isMc ? (third as string[])[fourth as number] : (third as string),
      aliases: isMc ? [] : (fourth as string[]),
      explanation,
      difficulty,
      tag: tag ?? (difficulty === 1 ? 'belajar' : 'lomba'),
      arabic: extra?.ar,
      latin: extra?.lt,
      meaning: extra?.mn,
      source: 'builtin',
    } as Question;
  });
}
