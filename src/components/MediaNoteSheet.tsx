import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { MEDIA_NOTE_MAX_LENGTH } from '../types';
import { Sheet } from './Sheet';

export type MediaNotePreview =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string }
  | { kind: 'pdf'; name: string };

interface MediaNoteSheetProps {
  preview: MediaNotePreview;
  position?: { index: number; total: number };
  onSave: (note: string) => void;
  onSkip: () => void;
}

// Shown right after a photo/video/PDF is picked: optional short note before it's added to the item
export const MediaNoteSheet: React.FC<MediaNoteSheetProps> = ({
  preview,
  position,
  onSave,
  onSkip,
}) => {
  const [note, setNote] = useState('');

  // Fresh textarea for each queued file
  useEffect(() => {
    setNote('');
  }, [preview]);

  return (
    // Stacked: it can open over the item detail sheet. Dismissing it skips the note.
    <Sheet isOpen onClose={onSkip} width="md" stacked labelledBy="media-note-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(note.trim());
        }}
        className="flex-1 overflow-y-auto"
      >
        <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
          <span id="media-note-title" className="font-serif-journal text-base text-ink">Add a note</span>
          {position && position.total > 1 && (
            <span className="font-mono-journal text-[11px] text-ink/50">
              {position.index} of {position.total}
            </span>
          )}
        </div>

        <div className="bg-black/90 max-h-64 flex items-center justify-center">
          {preview.kind === 'image' && (
            <img src={preview.src} alt="" className="max-h-64 w-full object-contain" />
          )}
          {preview.kind === 'video' && (
            <video src={preview.src} controls playsInline className="max-h-64 w-full" />
          )}
          {preview.kind === 'pdf' && (
            <div className="py-8 px-4 flex items-center gap-2 text-sm text-white/85 min-w-0">
              <FileText className="w-5 h-5 shrink-0" />
              <span className="truncate">{preview.name}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MEDIA_NOTE_MAX_LENGTH))}
            maxLength={MEDIA_NOTE_MAX_LENGTH}
            rows={2}
            placeholder="Optional note…"
            className="w-full px-3 py-2 text-sm bg-card border border-ink/15 rounded-lg text-ink resize-none focus:outline-none focus:border-ink"
          />
          <div className="text-right font-mono-journal text-[11px] text-ink/45">
            {note.length}/{MEDIA_NOTE_MAX_LENGTH}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] px-4 text-xs font-medium text-ink/70 hover:text-ink rounded-lg hover:bg-ink/5 transition-colors"
          >
            Skip
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-4 text-xs font-semibold bg-ink text-paper rounded-lg hover:bg-ink/85 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
};
