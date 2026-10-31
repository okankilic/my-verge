import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { NoticeOptions, NoticeTone, registerDialogHost } from '../services/dialogs';
import { useAnySheetOpen } from './Sheet';

interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
  action?: NoticeOptions['action'];
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

// Renders notify() as toasts, optionally with an action button (e.g. Undo). There are no confirm dialogs.
export const DialogHost: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextNoticeId = useRef(1);
  const isSheetOpen = useAnySheetOpen();

  const dismiss = (id: number) => setNotices((prev) => prev.filter((n) => n.id !== id));

  useEffect(() => {
    registerDialogHost({
      notify: (message, tone, { action, durationMs = NOTICE_MS }) => {
        const id = nextNoticeId.current++;
        setNotices((prev) => [...prev, { id, message, tone, action }]);
        setTimeout(() => dismiss(id), durationMs);
      },
    });
    return () => registerDialogHost(null);
  }, []);

  if (notices.length === 0) return null;

  return (
    // Mobile: above the bottom tab bar; desktop: bottom right. While a sheet is open they move clear of its
    // footer buttons: to the top on phones, to the left of the side drawer from sm:
    <div
      aria-live="polite"
      className={`fixed inset-x-3 sm:inset-x-auto sm:w-96 z-[70] flex flex-col gap-2 ${
        isSheetOpen
          ? 'top-[calc(env(safe-area-inset-top)+0.75rem)] sm:top-auto sm:bottom-6 sm:left-6'
          : 'bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 sm:right-6'
      }`}
    >
      {notices.map((n) => (
        <div
          key={n.id}
          role={n.tone === 'error' ? 'alert' : 'status'}
          className={`pl-3.5 pr-1 py-1 border rounded-2xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 ${noticeStyles[n.tone].box}`}
        >
          {noticeStyles[n.tone].icon}
          <span className="flex-1 min-w-0 text-sm text-ink leading-snug py-2 break-words">{n.message}</span>
          {n.action && (
            <button
              type="button"
              onClick={() => {
                n.action!.onAction();
                dismiss(n.id);
              }}
              className="min-h-[44px] px-3 shrink-0 text-sm font-semibold text-link active:opacity-70"
            >
              {n.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss"
            className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center text-ink/50 active:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
