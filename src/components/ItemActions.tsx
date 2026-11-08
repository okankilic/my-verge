import React, { useRef, useState } from 'react';
import { Camera, Check, DollarSign, Paperclip, Pencil, Play, Trash2 } from 'lucide-react';
import { BucketItem } from '../types';
import { fileToResizedDataUrl } from '../utils/imageResize';
import { MAX_ATTACHMENT_BYTES } from '../services/attachments';
import { notify } from '../services/dialogs';
import { WebcamCaptureSheet } from './WebcamCaptureSheet';
import { MediaNoteSheet, MediaNotePreview } from './MediaNoteSheet';
import { ExpenseSheet } from './ExpenseSheet';
import { wishCurrency } from '../utils/expenses';
import { PlanConfirm, PlanConfirmKind } from './InlineConfirm';

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
  // When provided, unstarted plans show Start (there is no Stop)
  onStart?: (item: BucketItem) => void;
  onToggleComplete: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  // When provided, show Camera + Attach buttons (images -> photos, videos/PDFs -> attachments)
  onAddPhoto?: (item: BucketItem, photoDataUrl: string, note?: string) => void;
  onAddAttachment?: (item: BucketItem, file: File, note?: string) => void;
  // When provided, show an Expense button that logs money spent on the wish
  onAddExpense?: (item: BucketItem, amount: number, note?: string) => void;
  // When provided, show an Edit button before Delete
  onEdit?: (item: BucketItem) => void;
  // Label for the ✓ button ("Mark accomplished" by default)
  doneLabel?: string;
  // Replaces the default edge offsets, for cards with other padding
  className?: string;
}

// Icon-only card action row: Start (unstarted only) | Accomplish (| Camera Attach) on the left, Delete on the far right
export const ItemActions: React.FC<ItemActionsProps> = ({
  item,
  onStart,
  onToggleComplete,
  onDelete,
  onAddPhoto,
  onAddAttachment,
  onAddExpense,
  onEdit,
  doneLabel = 'Mark as done',
  className = '-mx-3 -mb-1.5',
}) => {
  const isCompleted = item.status === 'completed';
  const isStarted = !isCompleted && Boolean(item.startedAt);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [pending, setPending] = useState<PendingMedia[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  // Start, Done and Delete each confirm inline under the row first
  const [confirming, setConfirming] = useState<PlanConfirmKind | null>(null);
  const canStart = Boolean(onStart) && !isCompleted && !isStarted;
  const toggleConfirm = (kind: PlanConfirmKind) => setConfirming((prev) => (prev === kind ? null : kind));

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
            notify(`"${file.name}" is over 100 MB. Try a smaller file.`, 'error');
          } else if (file.type === 'application/pdf') {
            media.push({ kind: 'pdf', file });
          } else {
            media.push({ kind: 'video', file, previewUrl: URL.createObjectURL(file) });
          }
        } else {
          notify('Pick a photo, video or PDF instead.', 'error');
        }
      } catch (err) {
        console.error('Failed to read file:', err);
        notify(`Couldn't open "${file.name}". Try again?`, 'error');
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
    <>
    <div className={`pt-1 ${className} flex items-center gap-0.5`}>
      {canStart && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleConfirm('start');
            }}
            aria-expanded={confirming === 'start'}
            title="Start — move to Now"
            aria-label="Start"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
              confirming === 'start' ? 'text-ink bg-paper' : 'text-ink/60 hover:text-ink hover:bg-paper'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <span aria-hidden className="w-px h-4 bg-ink/15" />
        </>
      )}
      {!isCompleted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleConfirm('done');
          }}
          aria-expanded={confirming === 'done'}
          title={doneLabel}
          aria-label={doneLabel}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
            confirming === 'done' ? 'text-positive bg-paper' : 'text-ink/60 hover:text-positive hover:bg-paper'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}
      {canAddMedia && (
        <>
          {/* Separates ✓ from the media buttons; finished plans have no ✓ */}
          {!isCompleted && <span aria-hidden className="w-px h-4 bg-ink/15" />}
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-accent hover:bg-paper transition-colors"
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
            title="Add photo, video or PDF"
            aria-label="Add photo, video or PDF"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-accent hover:bg-paper transition-colors"
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
      {onAddExpense && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingExpense(true);
            }}
            title="Add expense"
            aria-label="Add expense"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-positive hover:bg-paper transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
          </button>
          <ExpenseSheet
            isOpen={isAddingExpense}
            title={item.title}
            currency={wishCurrency(item)}
            onSave={(amount, note) => onAddExpense(item, amount, note)}
            onClose={() => setIsAddingExpense(false)}
          />
        </>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          title="Edit plan"
          aria-label="Edit plan"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-paper transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleConfirm('delete');
        }}
        aria-expanded={confirming === 'delete'}
        title="Delete plan"
        aria-label="Delete plan"
        className={`ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
          confirming === 'delete' ? 'text-danger bg-red-500/10' : 'text-ink/40 hover:text-danger hover:bg-red-500/10'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
    <PlanConfirm
      kind={confirming}
      item={item}
      onCancel={() => setConfirming(null)}
      onConfirm={(kind) => {
        setConfirming(null);
        if (kind === 'done') onToggleComplete(item);
        else if (kind === 'delete') onDelete(item.id);
        else onStart?.(item);
      }}
    />
    </>
  );
};
