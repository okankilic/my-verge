import React, { useEffect, useRef, useSyncExternalStore } from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  width?: 'md' | 'lg' | 'xl';
  // Raise a sheet that opens on top of another one (e.g. a caption sheet over the item detail)
  stacked?: boolean;
  children: React.ReactNode;
}

const widths = { md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl' };

// Open sheets, oldest first: only the top one answers Escape, and toasts move clear while any is open
const openSheets: symbol[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useAnySheetOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => openSheets.length > 0
  );
}

// The app's only overlay pattern: a bottom sheet on phones, a right-side drawer from sm:. No centered modals.
export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  labelledBy,
  width = 'lg',
  stacked = false,
  children,
}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol('sheet');
    openSheets.push(token);
    emit();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openSheets[openSheets.length - 1] !== token) return;
      // Escape inside a field shouldn't throw away what's being typed
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openSheets.splice(openSheets.indexOf(token), 1);
      emit();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${stacked ? 'z-[55]' : 'z-50'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" />

      <div
        role="dialog"
        aria-labelledby={labelledBy}
        className={`absolute inset-x-0 bottom-0 max-h-[92vh] sm:max-h-full sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full ${widths[width]} bg-paper border-t sm:border-l border-ink/15 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="sm:hidden w-12 h-1.5 bg-ink/20 rounded-full mx-auto my-3 shrink-0" />
        {children}
      </div>
    </div>
  );
};
