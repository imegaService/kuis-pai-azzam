import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Sun, Moon, BookOpen, Heart, Leaf, X } from 'lucide-react';
import { catMeta } from '../lib/categories';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';
const VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-900/10',
  secondary: 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200',
  ghost: 'bg-transparent hover:bg-stone-100 text-stone-700',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
};

export function Btn({ variant = 'primary', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...p}
      className={`min-h-[52px] px-5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-[background-color,transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${VARIANT[variant]} ${className}`}
    />
  );
}

export function Card({ className = '', ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`bg-white border border-stone-200 rounded-3xl ${className}`} />;
}

export function TopBar({ title, back, right }: { title: string; back?: string | number; right?: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/70">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-2">
        {back !== undefined && (
          <button data-testid="topbar-back-btn" aria-label="Kembali" onClick={() => (typeof back === 'number' ? nav(back) : nav(back))} className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center hover:bg-stone-200/60">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="font-heading text-lg font-bold truncate flex-1">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export const AVATAR_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-600', sky: 'bg-sky-600', amber: 'bg-amber-500', rose: 'bg-rose-500', indigo: 'bg-indigo-600', teal: 'bg-teal-600',
};
export const AVATAR_ICONS: Record<string, typeof Star> = { star: Star, sun: Sun, moon: Moon, book: BookOpen, heart: Heart, leaf: Leaf };

export function Avatar({ color, icon, size = 'md' }: { color: string; icon: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = AVATAR_ICONS[icon] ?? Star;
  const dim = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  const idim = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return <div className={`${dim} ${AVATAR_COLORS[color] ?? 'bg-emerald-600'} rounded-2xl flex items-center justify-center text-white shrink-0`}><Icon className={idim} /></div>;
}

export function CatBadge({ id }: { id: string }) {
  const m = catMeta(id);
  if (!m) return null;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}><m.icon className="w-3.5 h-3.5" />{m.name}</span>;
}

export function Segmented<T extends string | number>({ value, options, onChange, testid }: { value: T; options: { value: T; label: string }[]; onChange: (v: any) => void; testid: string }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid={testid}>
      {options.map((o) => (
        <button key={String(o.value)} data-testid={`${testid}-${o.value}`} onClick={() => onChange(o.value)}
          className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold border transition-colors ${value === o.value ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/50 p-0 sm:p-4" onClick={onClose}>
      <div data-testid="modal" className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 anim-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-heading text-xl font-bold">{title}</h2>
          <button data-testid="modal-close-btn" aria-label="Tutup" onClick={onClose} className="w-10 h-10 -mr-2 -mt-1 rounded-full hover:bg-stone-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, requireText, danger = true, onConfirm, onClose }: {
  open: boolean; title: string; message: React.ReactNode; confirmLabel: string; requireText?: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  const [typed, setTyped] = React.useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const ok = !requireText || typed.trim() === requireText.trim();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-stone-600 leading-relaxed mb-4">{message}</div>
      {requireText && (
        <label className="block mb-4">
          <span className="text-sm text-stone-600">Ketik <b className="text-stone-900">{requireText}</b> untuk konfirmasi</span>
          <input data-testid="confirm-type-input" value={typed} onChange={(e) => setTyped(e.target.value)} className="field mt-2" autoComplete="off" />
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Btn variant="secondary" data-testid="confirm-cancel-btn" onClick={onClose}>Batal</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} data-testid="confirm-ok-btn" disabled={!ok} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <main className={`max-w-2xl mx-auto px-4 pt-5 pb-16 ${className}`}>{children}</main>;
}
