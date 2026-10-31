import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { AttachmentMeta } from '../types';
import { notify } from './dialogs';
import { withStore } from './idb';
import { blobToBase64, isNative } from './platform';

// Binary attachments (videos, PDFs); items only keep AttachmentMeta.
// Native: attachments/<id>/<name> in the app's data directory, which the OS doesn't evict.
// Web: IndexedDB.
const DB_NAME = 'my_verge_attachments_v1';
const STORE = 'files';

export const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;

// A multiple of 3, so each chunk's base64 can be appended to the previous one cleanly
const CHUNK_BYTES = 3 * 1024 * 1024;

// IDs can arrive from an imported backup, so only accept the format App.tsx generates;
// anything else (e.g. "..") could point the recursive rmdir outside attachments/
const ATTACHMENT_ID = /^att-\d+-[a-z0-9]+$/;

const attachmentDir = (id: string) => {
  if (!ATTACHMENT_ID.test(id)) throw new Error(`Invalid attachment id: ${id}`);
  return `attachments/${id}`;
};
const attachmentPath = (id: string, name: string) => {
  const safeName = name.replace(/[\\/:]/g, '_');
  return `${attachmentDir(id)}/${safeName && !/^\.+$/.test(safeName) ? safeName : id}`;
};

async function removeAttachmentDir(id: string): Promise<void> {
  try {
    await Filesystem.rmdir({ path: attachmentDir(id), directory: Directory.Data, recursive: true });
  } catch {
    // Already gone
  }
}

export async function saveAttachment(id: string, file: File): Promise<void> {
  if (!isNative) {
    await withStore(DB_NAME, STORE, 'readwrite', (store) => store.put(file, id));
    return;
  }

  // Write in chunks so a large video never becomes one huge base64 string
  const path = attachmentPath(id, file.name);
  try {
    for (let offset = 0; offset === 0 || offset < file.size; offset += CHUNK_BYTES) {
      const data = await blobToBase64(file.slice(offset, offset + CHUNK_BYTES));
      if (offset === 0) {
        await Filesystem.writeFile({ path, data, directory: Directory.Data, recursive: true });
      } else {
        await Filesystem.appendFile({ path, data, directory: Directory.Data });
      }
    }
  } catch (err) {
    await removeAttachmentDir(id);
    throw err;
  }
}

async function loadAttachmentBlob(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>(DB_NAME, STORE, 'readonly', (store) => store.get(id));
}

export async function deleteAttachmentBlobs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  if (isNative) {
    await Promise.all(ids.map(removeAttachmentDir));
    return;
  }
  await withStore(DB_NAME, STORE, 'readwrite', (store) => {
    ids.forEach((id) => store.delete(id));
  });
}

// Open the stored file. Web: a new tab, opened synchronously so popup blockers allow it.
// Native: hand the stored file to the system viewer (Quick Look / Android intent).
export async function openAttachment(att: AttachmentMeta): Promise<void> {
  if (isNative) {
    try {
      const { uri } = await Filesystem.stat({
        path: attachmentPath(att.id, att.name),
        directory: Directory.Data,
      });
      await FileOpener.openFile({ path: uri, mimeType: att.mimeType || undefined });
    } catch (err) {
      console.error('Failed to open attachment:', err);
      notify('This file is no longer available on this device.', 'error');
    }
    return;
  }

  const win = window.open('', '_blank');
  try {
    const blob = await loadAttachmentBlob(att.id);
    if (!blob) throw new Error('Attachment not found');
    const url = URL.createObjectURL(blob);
    if (win) {
      win.location.href = url;
    } else {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    win?.close();
    console.error('Failed to open attachment:', err);
    notify('This file is no longer available on this device.', 'error');
  }
}
