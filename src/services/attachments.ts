import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { notify } from './dialogs';
import { blobToBase64, isNative } from './platform';

// Binary attachments (videos, PDFs) live in IndexedDB; items only keep AttachmentMeta in localStorage
const DB_NAME = 'my_verge_attachments_v1';
const STORE = 'files';

export const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveAttachmentBlob(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id));
}

export async function loadAttachmentBlob(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>('readonly', (store) => store.get(id));
}

export async function deleteAttachmentBlobs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      ids.forEach((id) => tx.objectStore(STORE).delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// Open the stored file. Web: a new tab, opened synchronously so popup blockers allow it.
// Native: copy it to the cache and hand it to the system viewer (Quick Look / Android intent).
export async function openAttachment(id: string, name = id): Promise<void> {
  if (isNative) {
    try {
      const blob = await loadAttachmentBlob(id);
      if (!blob) throw new Error('Attachment not found');
      const { uri } = await Filesystem.writeFile({
        path: `${id}-${name.replace(/[\\/:]/g, '_')}`,
        data: await blobToBase64(blob),
        directory: Directory.Cache,
      });
      await FileOpener.openFile({ path: uri, mimeType: blob.type || undefined });
    } catch (err) {
      console.error('Failed to open attachment:', err);
      notify('This file is no longer available on this device.', 'error');
    }
    return;
  }

  const win = window.open('', '_blank');
  try {
    const blob = await loadAttachmentBlob(id);
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
