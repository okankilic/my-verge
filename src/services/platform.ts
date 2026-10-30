import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { ThemePreference } from './storage';

// True inside the iOS/Android shells; false in the browser. Native-only code paths branch on this.
export const isNative = Capacitor.isNativePlatform();

// Match the status bar text color to the app theme ('system' follows the OS setting)
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let followSystem: (() => void) | null = null;
export function applyNativeTheme(theme: ThemePreference): void {
  if (!isNative) return;
  const apply = () => {
    const dark = theme === 'dark' || (theme === 'system' && systemDarkQuery.matches);
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  };
  if (followSystem) systemDarkQuery.removeEventListener('change', followSystem);
  followSystem = theme === 'system' ? apply : null;
  if (followSystem) systemDarkQuery.addEventListener('change', followSystem);
  apply();
}

// Open a URL outside the app: in-app browser sheet on native, new tab on the web
export function openExternal(url: string): void {
  if (isNative) {
    Browser.open({ url }).catch((err) => console.error('Failed to open link:', err));
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// Short stable positive int for a string ID (notification IDs must be 32-bit ints)
export function stableIntId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return (hash >>> 1) || 1;
}

// Props for an <a> that leaves the app: a normal new-tab link on the web, the in-app browser on native
export function externalLinkProps(url: string) {
  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: (e: { preventDefault: () => void }) => {
      if (!isNative) return;
      e.preventDefault();
      openExternal(url);
    },
  };
}

// Base64 body of a Blob, as @capacitor/filesystem expects for binary writes
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
