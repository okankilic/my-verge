import React, { useRef, useState } from 'react';
import { Camera, Check, Paperclip, Play, Square, Trash2 } from 'lucide-react';
import { BucketItem } from '../types';
import { fileToResizedDataUrl } from '../utils/imageResize';
import { MAX_ATTACHMENT_BYTES } from '../services/attachments';
import { notify } from '../services/dialogs';
import { WebcamCaptureSheet } from './WebcamCaptureSheet';
import { MediaNoteSheet, MediaNotePreview } from './MediaNoteSheet';

// Phones/tablets get the native camera via <input capture>; desktops use the webcam dialog
const canUseWebcamDialog = () =>
  typeof window !== 'undefined' &&
  !window.matchMedia('(pointer: coarse)').matches &&
  Boolean(navigator.mediaDevices?.getUserMedia);

// A captured/picked file waiting for its optional note
type PendingMedia =
  | { kind: 'image'; dataUrl: string }
  | { kind: 'video'; file: File; previewUrl: string }
  | { kind: 'pdf'; file: File };

interface ItemActionsProps {
  item: BucketItem;
  onToggleStarted: (item: BucketItem) => void;
  onToggleComplete: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  // When provided, show Camera + Attach buttons (images -> photos, videos/PDFs -> attachments)
  onAddPhoto?: (item: BucketItem, photoDataUrl: string, note?: string) => void;
  onAddAttachment?: (item: BucketItem, file: File, note?: string) => void;
}

// Icon-only card action row: Start/Stop | Accomplish (| Camera Attach) on the left, Delete on the far right
export const ItemActions: React.FC<ItemActionsProps> = ({
  item,
  onToggleStarted,
  onToggleComplete,
  onDelete,
  onAddPhoto,
  onAddAttachment,
}) => {
  const isCompleted = item.status === 'completed';
  const isStarted = !isCompleted && Boolean(item.startedAt);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [pending, setPending] = useState<PendingMedia[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);

  const enqueue = (media: PendingMedia[]) => {
    if (media.length === 0) return;
    setBatchTotal((t) => t + media.length);
    setPending((prev) => [...prev, ...media]);
  };

  const enqueueFiles = async (files: File[]) => {
    const media: PendingMedia[] = [];
    for (const file of files) {
      try {
        if (file.type.startsWith('image/')) {
          media.push({ kind: 'image', dataUrl: await fileToResizedDataUrl(file) });
        } else if (file.type.startsWith('video/') || file.type === 'application/pdf') {
          if (file.size > MAX_ATTACHMENT_BYTES) {
            notify(`"${file.name}" is larger than 100 MB.`, 'error');
          } else if (file.type === 'application/pdf') {
            media.push({ kind: 'pdf', file });
          } else {
            media.push({ kind: 'video', file, previewUrl: URL.createObjectURL(file) });
          }
        } else {
          notify(`"${file.name}" isn't an image, video or PDF.`, 'error');
        }
      } catch (err) {
        console.error('Failed to read file:', err);
        notify(`Could not read "${file.name}".`, 'error');
      }
    }
    enqueue(media);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    enqueueFiles(files);
  };

  const finishCurrent = (note?: string) => {
    const current = pending[0];
    if (!current) return;
    if (current.kind === 'image') {
      onAddPhoto?.(item, current.dataUrl, note || undefined);
    } else {
      onAddAttachment?.(item, current.file, note || undefined);
      if (current.kind === 'video') URL.revokeObjectURL(current.previewUrl);
    }
    if (pending.length === 1) setBatchTotal(0);
    setPending((prev) => prev.slice(1));
  };

  const current = pending[0];
  const preview: MediaNotePreview | null = !current
    ? null
    : current.kind === 'image'
      ? { kind: 'image', src: current.dataUrl }
      : current.kind === 'video'
        ? { kind: 'video', src: current.previewUrl }
        : { kind: 'pdf', name: current.file.name };

  const canAddMedia = Boolean(onAddPhoto && onAddAttachment);

  return (
    <div className="pt-1 -mx-3 -mb-1.5 flex items-center gap-0.5">
      {!isCompleted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStarted(item);
          }}
          title={isStarted ? 'Stop — move back to Journal' : 'Start — mark as in progress'}
          aria-label={isStarted ? 'Stop' : 'Start'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-paper transition-colors"
        >
          {isStarted ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      )}
      {!isCompleted && <span aria-hidden className="w-px h-4 bg-ink/15" />}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(item);
        }}
        aria-pressed={isCompleted}
        title={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
        aria-label={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
          isCompleted
            ? 'text-[#4A6B56] hover:bg-paper'
            : 'text-ink/60 hover:text-[#4A6B56] hover:bg-paper'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
      {canAddMedia && (
        <>
          <span aria-hidden className="w-px h-4 bg-ink/15" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canUseWebcamDialog()) {
                setIsWebcamOpen(true);
              } else {
                cameraInputRef.current?.click();
              }
            }}
            title="Take a photo or video"
            aria-label="Take a photo or video"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-[#B45309] hover:bg-paper transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onClick={(e) => e.stopPropagation()}
            onChange={handleInputChange}
            className="hidden"
          />
          <WebcamCaptureSheet
            isOpen={isWebcamOpen}
            onClose={() => setIsWebcamOpen(false)}
            onCapture={(photoDataUrl) => enqueue([{ kind: 'image', dataUrl: photoDataUrl }])}
            onChooseFile={() => attachInputRef.current?.click()}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              attachInputRef.current?.click();
            }}
            title="Add image, video or PDF"
            aria-label="Add image, video or PDF"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-[#B45309] hover:bg-paper transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input
            ref={attachInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            multiple
            onClick={(e) => e.stopPropagation()}
            onChange={handleInputChange}
            className="hidden"
          />

          {preview && (
            <MediaNoteSheet
              preview={preview}
              position={{ index: batchTotal - pending.length + 1, total: batchTotal }}
              onSave={(note) => finishCurrent(note)}
              onSkip={() => finishCurrent()}
            />
          )}
        </>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        title="Delete wish"
        aria-label="Delete wish"
        className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/40 hover:text-red-600 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
