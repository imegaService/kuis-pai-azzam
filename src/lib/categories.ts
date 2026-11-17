import { BookOpen, Sparkles, Landmark, Sun, BookMarked } from 'lucide-react';
import type { CategoryId } from '../types';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  desc: string;
  icon: typeof BookOpen;
  bg: string;
  text: string;
  bar: string;
  ring: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'aqidah', name: 'Aqidah', desc: 'Rukun iman, malaikat, Asmaul Husna', icon: BookOpen, bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-500', ring: 'border-emerald-200' },
  { id: 'ibadah', name: 'Ibadah', desc: 'Thaharah, shalat, puasa, zakat, haji', icon: Sparkles, bg: 'bg-sky-50', text: 'text-sky-800', bar: 'bg-sky-500', ring: 'border-sky-200' },
  { id: 'tarikh', name: 'Tarikh', desc: 'Sirah Nabi, sahabat, kisah para nabi', icon: Landmark, bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500', ring: 'border-amber-200' },
  { id: 'kemuhammadiyahan', name: 'Kemuhammadiyahan', desc: 'K.H. Ahmad Dahlan, lambang, ortom', icon: Sun, bg: 'bg-teal-50', text: 'text-teal-800', bar: 'bg-teal-500', ring: 'border-teal-200' },
  { id: 'juzamma', name: 'Hafalan Juz Amma', desc: 'Surah pendek, ayat, arti', icon: BookMarked, bg: 'bg-indigo-50', text: 'text-indigo-800', bar: 'bg-indigo-500', ring: 'border-indigo-200' },
];

export const CAT_IDS = CATEGORIES.map((c) => c.id);
export const catMeta = (id: string) => CATEGORIES.find((c) => c.id === id);
export const catName = (id: string) => (id === 'campur' ? 'Campuran' : catMeta(id)?.name ?? id);
export const DIFF_LABEL: Record<number, string> = { 0: 'Semua', 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' };
export const MODE_LABEL: Record<string, string> = { latihan: 'Latihan Topik', kuis: 'Kuis Timer', simulasi: 'Simulasi Lomba', ulangi: 'Ulangi Soal Salah' };
