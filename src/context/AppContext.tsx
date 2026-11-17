import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AnswerLog, CategoryId, ModeId, Profile, Question, Settings } from '../types';
import { BUILTIN_QUESTIONS } from '../data';
import { KEYS, load, save, storageAvailable, todayKey, uid } from '../lib/storage';
import { emptyStats, sanitizeProfile, validateQuestion } from '../lib/validate';
import { DEFAULT_MODEL } from '../lib/gemini';
import { setSoundEnabled } from '../lib/sound';

export const DEFAULT_SETTINGS: Settings = {
  timerSec: 20, sound: true, offlineNotice: true, tolerance: 'normal', aiCheck: true, geminiKey: '', geminiModel: DEFAULT_MODEL, pin: '2580',
};

export interface SessionResultInput { mode: ModeId; category: CategoryId | 'campur'; logs: AnswerLog[]; durationMs: number }

interface Ctx {
  profiles: Profile[];
  active: Profile | null;
  settings: Settings;
  bank: Question[];
  custom: Question[];
  overrides: Record<string, Question>;
  hidden: string[];
  storageError: string | null;
  online: boolean;
  selectProfile: (id: string | null) => void;
  addProfile: (name: string, color: string, icon: string) => Profile;
  deleteProfile: (id: string) => void;
  recordSession: (r: SessionResultInput) => void;
  updateSettings: (p: Partial<Settings>) => void;
  saveQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
  restoreBuiltins: () => void;
  exportData: (includeKey: boolean) => string;
  importData: (json: string) => { ok: boolean; msg: string };
  dismissStorageError: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppCtx) as Ctx;
const STORAGE_MSG = 'Penyimpanan perangkat penuh atau diblokir. Progres terbaru mungkin tidak tersimpan — segera ekspor data.';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(() => load<any[]>(KEYS.profiles, []).map(sanitizeProfile).filter(Boolean) as Profile[]);
  const [activeId, setActiveId] = useState<string | null>(() => load<string | null>(KEYS.active, null));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(KEYS.settings, {}) }));
  const [custom, setCustom] = useState<Question[]>(() => load<Question[]>(KEYS.custom, []).filter((q) => validateQuestion(q).length === 0));
  const [overrides, setOverrides] = useState<Record<string, Question>>(() => load(KEYS.overrides, {}));
  const [hidden, setHidden] = useState<string[]>(() => load(KEYS.hidden, []));
  const [storageError, setStorageError] = useState<string | null>(() => (storageAvailable() ? null : STORAGE_MSG));
  const [online, setOnline] = useState(navigator.onLine);

  const persist = (key: string, v: unknown) => { if (!save(key, v)) setStorageError(STORAGE_MSG); };
  useEffect(() => persist(KEYS.profiles, profiles), [profiles]);
  useEffect(() => persist(KEYS.active, activeId), [activeId]);
  useEffect(() => { persist(KEYS.settings, settings); setSoundEnabled(settings.sound); }, [settings]);
  useEffect(() => persist(KEYS.custom, custom), [custom]);
  useEffect(() => persist(KEYS.overrides, overrides), [overrides]);
  useEffect(() => persist(KEYS.hidden, hidden), [hidden]);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const bank = useMemo(() => [
    ...BUILTIN_QUESTIONS.filter((q) => !hidden.includes(q.id)).map((q) => overrides[q.id] ?? q),
    ...custom,
  ], [custom, overrides, hidden]);

  const active = profiles.find((p) => p.id === activeId) ?? null;

  const addProfile = useCallback((name: string, color: string, icon: string) => {
    const p = sanitizeProfile({ id: uid(), name: name.trim(), color, icon, stats: emptyStats() }) as Profile;
    setProfiles((ps) => [...ps, p]);
    return p;
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((ps) => ps.filter((p) => p.id !== id));
    setActiveId((a) => (a === id ? null : a));
  }, []);

  const recordSession = useCallback((r: SessionResultInput) => {
    if (!activeId || !r.logs.length) return;
    setProfiles((ps) => ps.map((p) => {
      if (p.id !== activeId) return p;
      const n: Profile = { ...p, stats: { ...p.stats }, wrong: { ...p.wrong } };
      let points = 0, correct = 0, time = 0;
      for (const l of r.logs) {
        const s = { ...n.stats[l.q.category] };
        s.answered += 1; s.timeMs += Math.min(l.timeMs, 60000); if (l.correct) s.correct += 1;
        n.stats[l.q.category] = s;
        points += l.points; time += l.timeMs;
        if (l.correct) { correct++; n.streak += 1; n.bestStreak = Math.max(n.bestStreak, n.streak); delete n.wrong[l.q.id]; }
        else { n.streak = 0; n.wrong[l.q.id] = { count: (n.wrong[l.q.id]?.count ?? 0) + 1, last: new Date().toISOString() }; }
      }
      const today = todayKey();
      const y = new Date(); y.setDate(y.getDate() - 1);
      if (n.lastDay !== today) n.dayStreak = n.lastDay === todayKey(y) ? n.dayStreak + 1 : 1;
      n.lastDay = today;
      n.totalScore = Math.max(0, n.totalScore + points);
      n.history = [{ id: uid(), date: new Date().toISOString(), mode: r.mode, category: r.category, total: r.logs.length, correct, points, durationMs: r.durationMs, avgMs: Math.round(time / r.logs.length) }, ...n.history].slice(0, 200);
      return n;
    }));
  }, [activeId]);

  const updateSettings = useCallback((p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p })), []);

  const saveQuestion = useCallback((q: Question) => {
    if (q.source === 'builtin') setOverrides((o) => ({ ...o, [q.id]: q }));
    else setCustom((c) => (c.some((x) => x.id === q.id) ? c.map((x) => (x.id === q.id ? q : x)) : [...c, q]));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    if (BUILTIN_QUESTIONS.some((q) => q.id === id)) setHidden((h) => Array.from(new Set([...h, id])));
    else setCustom((c) => c.filter((q) => q.id !== id));
  }, []);

  const restoreBuiltins = useCallback(() => { setHidden([]); setOverrides({}); }, []);

  const exportData = useCallback((includeKey: boolean) => JSON.stringify({
    app: 'cepat-tepat-pai', version: 1, exportedAt: new Date().toISOString(),
    profiles, settings: includeKey ? settings : { ...settings, geminiKey: '' }, customQuestions: custom, overrides, hidden,
  }, null, 2), [profiles, settings, custom, overrides, hidden]);

  const importData = useCallback((json: string) => {
    let d: any;
    try { d = JSON.parse(json); } catch { return { ok: false, msg: 'File bukan JSON yang valid.' }; }
    if (d?.app !== 'cepat-tepat-pai' || !Array.isArray(d.profiles)) return { ok: false, msg: 'File ini bukan cadangan dari aplikasi ini.' };
    const ps = d.profiles.map(sanitizeProfile).filter(Boolean) as Profile[];
    const qs = (Array.isArray(d.customQuestions) ? d.customQuestions : []).filter((q: Question) => validateQuestion(q).length === 0);
    setProfiles(ps);
    setCustom(qs);
    setOverrides(d.overrides && typeof d.overrides === 'object' ? Object.fromEntries(Object.entries(d.overrides).filter(([, q]) => validateQuestion(q as Question).length === 0)) as Record<string, Question> : {});
    setHidden(Array.isArray(d.hidden) ? d.hidden.filter((h: unknown) => typeof h === 'string') : []);
    if (d.settings && typeof d.settings === 'object') {
      const x = d.settings;
      setSettings((s) => ({
        ...s,
        timerSec: [10, 15, 20, 30, 45].includes(x.timerSec) ? x.timerSec : s.timerSec,
        sound: typeof x.sound === 'boolean' ? x.sound : s.sound,
        offlineNotice: typeof x.offlineNotice === 'boolean' ? x.offlineNotice : s.offlineNotice,
        tolerance: ['ketat', 'normal', 'longgar'].includes(x.tolerance) ? x.tolerance : s.tolerance,
        aiCheck: typeof x.aiCheck === 'boolean' ? x.aiCheck : s.aiCheck,
        geminiKey: typeof x.geminiKey === 'string' && x.geminiKey ? x.geminiKey : s.geminiKey,
        geminiModel: typeof x.geminiModel === 'string' && x.geminiModel ? x.geminiModel : s.geminiModel,
        pin: typeof x.pin === 'string' && /^\d{4}$/.test(x.pin) ? x.pin : s.pin,
      }));
    }
    setActiveId(null);
    return { ok: true, msg: `Berhasil memulihkan ${ps.length} profil dan ${qs.length} soal tambahan.` };
  }, []);

  const value: Ctx = {
    profiles, active, settings, bank, custom, overrides, hidden, storageError, online,
    selectProfile: setActiveId, addProfile, deleteProfile, recordSession, updateSettings, saveQuestion, deleteQuestion,
    restoreBuiltins, exportData, importData, dismissStorageError: () => setStorageError(null),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
