import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { ConfirmOptions, NoticeTone, registerDialogHost } from '../services/dialogs';

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

const NOTICE_MS = 4000;

const noticeStyles: Record<NoticeTone, { box: string; icon: React.ReactNode }> = {
  info: { box: 'bg-card border-ink/15', icon: <Info className="w-4 h-4 text-ink/60 shrink-0" /> },
  success: {
    box: 'bg-card border-[#4A6B56]/40',
    icon: <CheckCircle2 className="w-4 h-4 text-[#4A6B56] shrink-0" />,
  },
  error: { box: 'bg-warm border-[#C05621]/30', icon: <AlertCircle className="w-4 h-4 text-[#C05621] shrink-0" /> },
};

// Renders confirmAction() as a bottom action sheet (centered card from sm:) and notify() as toasts
export const DialogHost: React.FC = () => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextNoticeId = useRef(1);

  useEffect(() => {
    registerDialogHost({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          // A newer request replaces an unanswered one, which counts as cancelled
          setPending((prev) => {
            prev?.resolve(false);
            return { ...options, resolve };
          });
        }),
      notify: (message, tone) => {
        const id = nextNoticeId.current++;
        setNotices((prev) => [...prev, { id, message, tone }]);
        setTimeout(() => setNotices((prev) => prev.filter((n) => n.id !== id)), NOTICE_MS);
      },
    });
    return () => registerDialogHost(null);
  }, []);

  const answer = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div onClick={() => answer(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full sm:max-w-sm bg-paper border-t sm:border border-ink/15 rounded-t-3xl sm:rounded-2xl shadow-2xl px-5 pt-3 sm:pt-5 animate-in slide-in-from-bottom sm:fade-in duration-200"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="sm:hidden w-12 h-1.5 bg-ink/20 rounded-full mx-auto mb-4" />

            <h2 id="confirm-title" className="font-serif-journal text-xl text-ink leading-snug">
              {pending.title}
            </h2>
            {pending.message && (
              <p className="mt-1.5 text-sm text-ink/70 leading-relaxed break-words">{pending.message}</p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => answer(true)}
                className={`min-h-[48px] w-full rounded-xl text-sm font-semibold transition-colors ${
                  pending.tone === 'danger'
                    ? 'bg-red-600 text-white active:bg-red-700'
                    : 'bg-ink text-paper active:bg-ink/85'
                }`}
              >
                {pending.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="min-h-[48px] w-full rounded-xl text-sm font-medium text-ink bg-card border border-ink/15 active:bg-paper-deep transition-colors"
              >
                {pending.cancelLabel || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notices.length > 0 && (
        // Mobile: above the bottom tab bar; desktop: bottom of the page
        <div
          aria-live="polite"
          className="fixed inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 bottom-20 md:bottom-6 z-[70] flex flex-col gap-2"
        >
          {notices.map((n) => (
            <div
              key={n.id}
              role={n.tone === 'error' ? 'alert' : 'status'}
              className={`pl-3.5 pr-1 py-1 border rounded-2xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 ${noticeStyles[n.tone].box}`}
            >
              {noticeStyles[n.tone].icon}
              <span className="flex-1 text-sm text-ink leading-snug py-2">{n.message}</span>
              <button
                type="button"
                onClick={() => setNotices((prev) => prev.filter((x) => x.id !== n.id))}
                aria-label="Dismiss"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/50 active:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
