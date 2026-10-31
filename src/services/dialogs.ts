// In-app replacement for window.alert. DialogHost (mounted once in App) renders the toasts.
// There is deliberately no confirm: reversible actions run at once and offer Undo through a toast action,
// and irreversible ones confirm inline in the page.

export type NoticeTone = 'info' | 'success' | 'error';

export interface NoticeOptions {
  action?: { label: string; onAction: () => void };
  durationMs?: number;
}

interface DialogHandlers {
  notify: (message: string, tone: NoticeTone, options: NoticeOptions) => void;
}

let handlers: DialogHandlers | null = null;

export function registerDialogHost(next: DialogHandlers | null): void {
  handlers = next;
}

export function notify(message: string, tone: NoticeTone = 'info', options: NoticeOptions = {}): void {
  if (!handlers) {
    console.warn('notify called without a mounted DialogHost:', message);
    return;
  }
  handlers.notify(message, tone, options);
}

// Shows "message · Undo"; the toast stays up for UNDO_MS
export const UNDO_MS = 6000;

export function notifyUndo(message: string, onUndo: () => void): void {
  notify(message, 'info', { action: { label: 'Undo', onAction: onUndo }, durationMs: UNDO_MS });
}
