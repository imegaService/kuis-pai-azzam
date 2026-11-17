import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { AnswerLog, Question } from '../types';
import { CatBadge } from './kit';
import { DIFF_LABEL } from '../lib/categories';

export function QuestionCard({ q }: { q: Question }) {
  return (
    <div data-testid="question-card" className="anim-up">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <CatBadge id={q.category} />
        <span className="text-xs font-medium text-stone-500">
          {q.subtopic} · {DIFF_LABEL[q.difficulty]}
        </span>
      </div>
      {q.arabic && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 mb-4">
          <p
            data-testid="question-arabic"
            dir="rtl"
            lang="ar"
            className="font-arabic text-3xl sm:text-4xl leading-[2.1] text-right text-stone-900"
          >
            {q.arabic}
          </p>
          {q.latin && (
            <p data-testid="question-latin" className="mt-3 text-base italic text-indigo-800">
              {q.latin}
            </p>
          )}
          {q.meaning && (
            <p data-testid="question-meaning" className="mt-1 text-sm text-stone-600">
              Artinya: “{q.meaning}”
            </p>
          )}
        </div>
      )}
      <p data-testid="question-text" className="font-heading text-xl sm:text-2xl font-semibold leading-snug text-stone-900">
        {q.question}
      </p>
    </div>
  );
}

export function OptionList({
  q,
  selected,
  revealed,
  onPick,
}: {
  q: Question;
  selected: string | null;
  revealed: boolean;
  onPick: (o: string) => void;
}) {
  return (
    <div className="grid gap-3 mt-6" data-testid="options-list">
      {(q.options ?? []).map((o, i) => {
        const isAns = o === q.answer,
          isSel = o === selected;
        let cls = 'bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/40';
        if (revealed && isAns) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900';
        else if (revealed && isSel) cls = 'bg-rose-50 border-rose-400 text-rose-900';
        else if (revealed) cls = 'bg-white border-stone-200 opacity-60';
        return (
          <button
            key={o}
            data-testid={`option-${i}`}
            disabled={revealed}
            onClick={() => onPick(o)}
            className={`w-full min-h-[60px] p-4 rounded-2xl border-2 text-left text-base sm:text-lg font-medium flex items-center gap-3 transition-[background-color,border-color,transform] duration-150 active:scale-[0.99] ${cls}`}
          >
            <span className="w-8 h-8 shrink-0 rounded-xl bg-stone-100 text-stone-600 text-sm font-bold flex items-center justify-center">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{o}</span>
            {revealed && isAns && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            {revealed && isSel && !isAns && <XCircle className="w-6 h-6 text-rose-500" />}
          </button>
        );
      })}
    </div>
  );
}

export function ShortAnswer({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <form
      className="mt-6 grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        enterKeyHint="done"
        data-testid="short-answer-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => inputRef.current?.focus()}
        disabled={disabled}
        placeholder="Ketik jawabanmu..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        className="field text-lg relative z-10"
      />
      {!disabled && (
        <button
          data-testid="short-answer-submit-btn"
          type="submit"
          disabled={!value.trim()}
          className="min-h-[52px] rounded-2xl bg-emerald-700 text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          Jawab
        </button>
      )}
    </form>
  );
}

export function Feedback({ log }: { log: AnswerLog }) {
  const ok = log.correct;
  return (
    <div
      data-testid="answer-feedback"
      className={`mt-6 rounded-3xl border-2 p-5 anim-up ${
        ok ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <XCircle className="w-7 h-7 text-rose-500" />}
        <p data-testid="feedback-status" className={`font-heading text-xl font-bold ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>
          {ok ? 'Benar!' : log.timedOut ? 'Waktu habis' : log.passed ? 'Dilewati' : 'Belum tepat'}
        </p>
        <span data-testid="feedback-points" className="ml-auto text-sm font-bold text-stone-600">
          {log.points > 0 ? `+${log.points}` : log.points}
        </span>
      </div>
      {!ok && (
        <p className="mt-3 text-stone-800">
          Jawaban benar: <b data-testid="feedback-correct-answer">{log.q.answer}</b>
        </p>
      )}
      {log.q.type === 'short' && log.given && log.given !== '__pass__' && (
        <p className="mt-1 text-sm text-stone-600">Jawabanmu: “{log.given}”</p>
      )}
      {log.aiJudged && <p className="mt-1 text-xs font-semibold text-sky-700">Dinilai benar dengan bantuan AI.</p>}
      {log.aiNote && !log.aiJudged && <p className="mt-1 text-xs text-stone-500">Catatan AI: {log.aiNote}</p>}
      <p data-testid="feedback-explanation" className="mt-3 text-stone-700 leading-relaxed">
        <span className="font-semibold">Pembahasan: </span>
        {log.q.explanation}
      </p>
    </div>
  );
}
