import React from 'react';

export function Gauge({ value, label }: { value: number; label: string }) {
  const r = 80, c = Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 85 ? '#047857' : pct >= 65 ? '#0284C7' : pct >= 40 ? '#D97706' : '#78716C';
  return (
    <div className="relative w-full max-w-[260px] mx-auto" data-testid="readiness-gauge">
      <svg viewBox="0 0 200 115" className="w-full">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#E7E5E4" strokeWidth="16" strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p data-testid="readiness-score" className="font-heading text-5xl font-extrabold text-stone-900 leading-none">{pct}<span className="text-2xl">%</span></p>
        <p className="text-xs text-stone-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
