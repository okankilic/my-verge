import React, { useRef, useState } from 'react';
import { Check, ClipboardList, ListChecks, X } from 'lucide-react';
import { STEP_TITLE_MAX_LENGTH, WishStep } from '../types';
import { stepProgress } from '../utils/steps';

// 'step': the steps toward a wish. 'prep': what to get ready before starting it.
type StepKind = 'step' | 'prep';

const KIND_TEXT: Record<StepKind, { heading: string; placeholder: string; noun: string }> = {
  step: { heading: 'Steps', placeholder: 'Add a step', noun: 'step' },
  prep: { heading: 'Before you start', placeholder: 'Add something to prep', noun: 'prep item' },
};

interface StepListProps {
  steps: WishStep[];
  kind?: StepKind;
  onToggle: (stepId: string) => void;
  onAdd?: (title: string) => void;
  onRemove?: (stepId: string) => void;
  // Rows only, for cards that open on tap: no header, adding or removing
  compact?: boolean;
  // Lets the parent own the "Add a step" text, e.g. so the form's Save can add it
  draft?: string;
  onDraftChange?: (draft: string) => void;
}

// The checklist of smaller steps toward a wish, or of prep before starting it
export const StepList: React.FC<StepListProps> = ({
  steps,
  kind = 'step',
  onToggle,
  onAdd,
  onRemove,
  compact,
  draft: controlledDraft,
  onDraftChange,
}) => {
  const [localDraft, setLocalDraft] = useState('');
  const draft = controlledDraft ?? localDraft;
  const setDraft = onDraftChange ?? setLocalDraft;
  const inputRef = useRef<HTMLInputElement>(null);
  const { done, total } = stepProgress(steps);
  const text = KIND_TEXT[kind];
  const HeadingIcon = kind === 'prep' ? ClipboardList : ListChecks;

  const submit = () => {
    const title = draft.trim();
    if (!title || !onAdd) return;
    onAdd(title);
    setDraft('');
    inputRef.current?.focus();
  };

  return (
    <div className={compact ? '' : 'space-y-1.5'} onClick={compact ? (e) => e.stopPropagation() : undefined}>
      {!compact && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink/60">
            <HeadingIcon className="w-3.5 h-3.5" />
            <span>{text.heading}</span>
          </span>
          {total > 0 && (
            <span className="font-mono-journal text-[11px] text-ink/55">
              {done}/{total}
            </span>
          )}
        </div>
      )}

      {total > 0 && (
        <ul className={compact ? '' : 'bg-card border border-ink/10 rounded-xl divide-y divide-ink/8'}>
          {steps.map((step) => (
            <li key={step.id} className={`flex items-center ${compact ? '-ml-2.5' : 'pr-1'}`}>
              <button
                type="button"
                role="checkbox"
                aria-checked={Boolean(step.doneAt)}
                onClick={() => onToggle(step.id)}
                className={`flex-1 min-w-0 flex items-center gap-2.5 text-left ${
                  compact ? 'min-h-[40px] px-2.5' : 'min-h-[44px] px-3'
                }`}
              >
                <span
                  aria-hidden
                  className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                    step.doneAt ? 'bg-[#4A6B56] border-[#4A6B56] text-white' : 'border-ink/30'
                  }`}
                >
                  {step.doneAt && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span
                  className={`min-w-0 text-sm leading-snug break-words ${
                    step.doneAt ? 'line-through text-ink/40' : 'text-ink/85'
                  }`}
                >
                  {step.title}
                </span>
              </button>
              {!compact && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(step.id)}
                  aria-label={`Remove ${text.noun} "${step.title}"`}
                  title={`Remove ${text.noun}`}
                  className="min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-lg text-ink/35 hover:text-ink/70"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!compact && onAdd && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={STEP_TITLE_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds the step instead of submitting a surrounding form
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={text.placeholder}
            aria-label={`New ${text.noun}`}
            className="flex-1 min-w-0 min-h-[44px] px-3 py-2 text-sm bg-card border border-ink/15 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            aria-label={`Add ${text.noun}`}
            className="min-h-[44px] px-4 text-xs font-semibold rounded-xl border border-ink/15 bg-card text-ink/80 hover:text-ink disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

// Compact "2/4" step count for list rows and cards; renders nothing without steps.
// The prep count also hides once everything is ready, since there's nothing left to nudge.
export const StepCount: React.FC<{ steps?: WishStep[]; kind?: StepKind }> = ({ steps, kind = 'step' }) => {
  const { done, total } = stepProgress(steps);
  if (total === 0 || (kind === 'prep' && done === total)) return null;
  const Icon = kind === 'prep' ? ClipboardList : ListChecks;
  return (
    <span
      className="shrink-0 flex items-center gap-1 font-mono-journal text-[11px] text-ink/55"
      aria-label={kind === 'prep' ? `${done} of ${total} ready before you start` : `${done} of ${total} steps done`}
    >
      <Icon aria-hidden className="w-3 h-3" />
      <span aria-hidden>
        {done}/{total}
      </span>
    </span>
  );
};
