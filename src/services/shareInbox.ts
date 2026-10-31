import { registerPlugin } from '@capacitor/core';
import { BucketItem } from '../types';
import { fileToResizedDataUrl } from '../utils/imageResize';
import { isNative } from './platform';

// What another app handed over through the share sheet (any field may be missing)
export interface SharedPayload {
  text?: string;
  subject?: string;
  url?: string;
  imageBase64?: string;
  imageMime?: string;
}

// Local native plugin: android/.../ShareInboxPlugin.java and ios/App/App/ShareInboxPlugin.swift.
// Shares wait natively until getPending takes them; shareReceived only says that one has arrived.
interface ShareInboxPlugin {
  getPending(): Promise<{ items: SharedPayload[] }>;
  addListener(event: 'shareReceived', cb: () => void): Promise<{ remove: () => Promise<void> }>;
}

const ShareInbox = registerPlugin<ShareInboxPlugin>('ShareInbox');

const TITLE_MAX = 80;
const URL_PATTERN = /https?:\/\/[^\s<>"]+/i;

function base64ToFile(base64: string, mime: string): File {
  const body = atob(base64);
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i);
  return new File([bytes], 'shared-image', { type: mime });
}

// Turn a share into a New wish draft: the link, a title from the subject or first line, the rest as a note
export async function toDraft(payload: SharedPayload): Promise<Partial<BucketItem>> {
  const rawText = (payload.text ?? '').trim();
  const linkUrl = payload.url || URL_PATTERN.exec(rawText)?.[0];
  const text = linkUrl ? rawText.replace(linkUrl, '').trim() : rawText;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let title = (payload.subject ?? '').trim();
  if (!title && lines.length > 0) title = lines.shift()!;
  if (!title && linkUrl) {
    try {
      title = new URL(linkUrl).hostname.replace(/^www\./, '');
    } catch {
      // keep it empty; the user types one
    }
  }
  let description = lines.join('\n');
  if (title.length > TITLE_MAX) {
    description = [title, description].filter(Boolean).join('\n');
    title = `${title.slice(0, TITLE_MAX - 1).trimEnd()}…`;
  }

  const draft: Partial<BucketItem> = { title, description, linkUrl };
  if (payload.imageBase64) {
    try {
      const file = base64ToFile(payload.imageBase64, payload.imageMime || 'image/jpeg');
      draft.photos = [await fileToResizedDataUrl(file)];
    } catch (err) {
      console.error('Could not read the shared image:', err);
    }
  }
  return draft;
}

// Call back for every share waiting now and for each one that arrives later. Native only; returns a cleanup.
export function onSharedContent(cb: (payload: SharedPayload) => void): () => void {
  if (!isNative) return () => {};
  // getPending removes the shares natively, so always deliver what it returns, even after cleanup
  const drain = () =>
    ShareInbox.getPending()
      .then(({ items }) => items.forEach(cb))
      .catch((err) => console.error('Could not read shared content:', err));

  const handle = ShareInbox.addListener('shareReceived', drain);
  drain();
  return () => {
    handle.then((h) => h.remove()).catch(() => {});
  };
}
