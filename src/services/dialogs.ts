// In-app replacements for window.confirm / window.alert. DialogHost (mounted once in App) renders them.

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

export type NoticeTone = 'info' | 'success' | 'error';

interface DialogHandlers {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, tone: NoticeTone) => void;
}

let handlers: DialogHandlers | null = null;

export function registerDialogHost(next: DialogHandlers | null): void {
  handlers = next;
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (!handlers) {
    console.warn('confirmAction called without a mounted DialogHost:', options.title);
    return Promise.resolve(false);
  }
  return handlers.confirm(options);
}

export function notify(message: string, tone: NoticeTone = 'info'): void {
  if (!handlers) {
    console.warn('notify called without a mounted DialogHost:', message);
    return;
  }
  handlers.notify(message, tone);
}
