import React from 'react';
import { FileText, Video } from 'lucide-react';
import { AttachmentMeta } from '../types';
import { openAttachment } from '../services/attachments';
import { photoKey } from '../utils/photoKey';

interface ItemMediaStripProps {
  photos: string[];
  photoNotes?: Record<string, string>;
  attachments?: AttachmentMeta[];
}

// Captioned photos (newest first) and video/PDF attachments, shown on the Now card and in the detail sheet
export const ItemMediaStrip: React.FC<ItemMediaStripProps> = ({ photos, photoNotes, attachments }) => (
  <>
    {photos.length > 0 && (
      <div className="pt-1.5 flex items-start gap-1.5 overflow-x-auto">
        {[...photos].reverse().map((src, i) => {
          const note = photoNotes?.[photoKey(src)];
          return (
            <figure key={`${i}-${src.slice(-16)}`} className="w-16 shrink-0" title={note}>
              <img
                src={src}
                alt={note || ''}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-lg object-cover border border-ink/10 bg-paper-deep"
              />
              {note && (
                <figcaption className="mt-0.5 text-[10px] leading-tight text-ink/60 line-clamp-2 break-words">
                  {note}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    )}

    {attachments && attachments.length > 0 && (
      <div className="pt-1.5 flex flex-wrap gap-1.5">
        {attachments.map((att) => (
          <button
            key={att.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openAttachment(att);
            }}
            title={att.note ? `${att.name} — ${att.note}` : `Open ${att.name}`}
            className="max-w-[14rem] min-h-[44px] px-2.5 py-1.5 flex items-center gap-1.5 text-left text-[11px] text-ink/75 bg-paper border border-ink/10 rounded-md hover:border-ink/25 hover:text-ink transition-colors"
          >
            {att.mimeType === 'application/pdf' ? (
              <FileText className="w-3 h-3 mt-px shrink-0 text-[#B45309]" />
            ) : (
              <Video className="w-3 h-3 mt-px shrink-0 text-[#B45309]" />
            )}
            <span className="min-w-0">
              <span className="block truncate">{att.name}</span>
              {att.note && (
                <span className="block text-[10px] leading-tight text-ink/55 line-clamp-2 break-words">
                  {att.note}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    )}
  </>
);
