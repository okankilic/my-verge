import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { BucketItem, CategoryDefinition } from '../types';
import { blobToBase64, isNative } from './platform';
import { notify } from './dialogs';

// The words that go with a shared wish: what it is, its note, and for finished ones how it went
function shareText(item: BucketItem, category?: CategoryDefinition): { title: string; text: string } {
  const title = category ? `${category.verb} ${item.title}` : item.title;
  const lines: string[] = [];
  if (item.status === 'completed') {
    const stars = (item.completionRating ?? 0) > 0 ? ` ${'★'.repeat(item.completionRating!)}` : '';
    lines.push(`I made it real: ${title}${stars}`);
    if (item.completionReflection) lines.push(`“${item.completionReflection}”`);
  } else {
    lines.push(title);
    if (item.description) lines.push(item.description);
  }
  return { title, text: lines.join('\n\n') };
}

// Decode a data URL synchronously, so the web share still runs inside the tap's user activation
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const body = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// The cover photo as a Blob: inline data URLs directly, preset and other URLs through fetch
async function coverBlob(item: BucketItem): Promise<Blob | null> {
  const cover = item.photos?.[0];
  if (!cover) return null;
  if (cover.startsWith('data:')) return dataUrlToBlob(cover);
  try {
    const res = await fetch(cover);
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

function coverFileName(blob: Blob): string {
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  return `make-it-real-wish.${ext}`;
}

const isCancel = (err: unknown) =>
  /cancel|abort/i.test(String((err as Error)?.name ?? '') + String((err as Error)?.message ?? err));

async function shareNative(item: BucketItem, title: string, text: string): Promise<void> {
  const blob = await coverBlob(item);
  let files: string[] | undefined;
  if (blob) {
    const { uri } = await Filesystem.writeFile({
      path: coverFileName(blob),
      data: await blobToBase64(blob),
      directory: Directory.Cache,
    });
    files = [uri];
  }
  await Share.share({ title, text, url: item.linkUrl, files });
}

async function shareWeb(item: BucketItem, title: string, text: string): Promise<void> {
  const base: ShareData = { title, text, url: item.linkUrl };
  if (!navigator.share) {
    await navigator.clipboard.writeText([text, item.linkUrl].filter(Boolean).join('\n\n'));
    notify('Copied, ready to paste.', 'success');
    return;
  }
  const blob = await coverBlob(item);
  const files = blob ? [new File([blob], coverFileName(blob), { type: blob.type })] : [];
  if (files.length > 0 && navigator.canShare?.({ ...base, files })) {
    try {
      await navigator.share({ ...base, files });
      return;
    } catch (err) {
      // Safari drops the tap's activation after an await; try again without the photo
      if ((err as Error)?.name !== 'NotAllowedError') throw err;
    }
  }
  await navigator.share(base);
}

// Open the system share sheet for a wish (copies its text where the browser has no share sheet)
export async function shareItem(item: BucketItem, category?: CategoryDefinition): Promise<void> {
  const { title, text } = shareText(item, category);
  try {
    if (isNative) await shareNative(item, title, text);
    else await shareWeb(item, title, text);
  } catch (err) {
    // Dismissing the share sheet rejects; that's not an error worth showing
    if (isCancel(err)) return;
    console.error('Share failed:', err);
    notify('Could not share this wish.', 'error');
  }
}
