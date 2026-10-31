# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nowish (formerly My Verge; the repo, app ID `com.okankilic.myverge` and the `my_verge_*` storage keys keep the old name on purpose, since renaming them would lose user data or the store identity) is a client-only React 19 + Vite + Tailwind CSS v4 single-page app, also shipped as iOS and Android apps through Capacitor 8: a mobile-first "bucket list and reminder journal" with a fixed set of verb categories (Go, Do, Buy, Remember, Read, Watch, Cook, Learn and so on; users can't create their own). It was scaffolded in Google AI Studio (`metadata.json`, `.aistudio/`), and the package manager is Bun (`bun.lock`).

## Commands

```bash
bun install
bun run dev      # Vite dev server on port 3000, bound to 0.0.0.0
bun run build    # production build to dist/
bun run preview
bun run lint     # type-check only (tsc --noEmit); there is no ESLint
bun run cap:sync # build, then copy dist/ + plugins into android/ and ios/
bun run cap:android  # open the Android project in Android Studio
```

There's no test framework, so `lint` (type-checking) is the only automated check.

## Architecture

- **Single state owner:** `src/App.tsx` holds all application state: items, categories, the current tab, theme, filters/sort/search, and the open/closed flags for every modal and drawer. It also defines every mutation handler (save, complete, start/stop, add photo/attachment, snooze, delete, create category). Components in `src/components/` are presentational and receive data and callbacks as props. They have no context, store, or router. Tabs are switched through the `ViewTab` state (`feed | reminders | inprogress | vault | milestones | settings`, labelled Journal, Radar, Now, Vault, Memories, Settings). The default tab is `inprogress`. The feed is rendered inline in `App.tsx`; the other tabs are `ReminderRadarView`, `InProgressView`, `VaultView`, `MilestonesArchiveView`, and `SettingsView`.
- **Item lifecycle:** `status` is `active | completed | archived`. An active item with `startedAt` set is "in progress": it appears on the Now tab and is excluded from the Journal feed and its category counts. `handleToggleStarted` sets or clears `startedAt`, and completing an item clears it and opens `MilestoneSheet` for a reflection. Completing, re-activating, stopping and deleting run at once and show an Undo toast. Deleting holds off on removing attachment blobs until the Undo window (`UNDO_MS`) has passed.
- **Journal order:** the Journal shows items in the order of the persisted `items` array, which the user sets in `JournalList` (`motion` `Reorder`) by pressing and holding an item for 2 seconds, then dragging it. Moving the finger before the press fires cancels it, so scrolling still works. `handleReorderJournal` in `App.tsx` reorders only the visible subset among the slots it already occupies, so items hidden by filters or search keep their places. New items are prepended, so they land at the top.
- **Search:** search is global. `searchedItems` in `App.tsx` feeds every tab except Settings. `SearchBar` is toggled from `TopNav` and `BottomTabBar`, and closing it clears the query. The category filter is global too: `CategoryRibbon` is rendered above every tab except Settings, and `filteredItems` (search plus category) feeds those tabs. The ribbon counts follow the current tab through `inTabScope`, and the ribbon only shows categories whose count is above zero, plus the selected one. Badges, notifications and Serendipity use the unfiltered `items`.
- **Navigation:** `BottomTabBar` is phone-only (`md:hidden`). It has New, a current-section button that fans out the tab switcher, and Search. `TopNav` holds the desktop tab links and a phone-frame preview toggle (`isMobileFrame`). A spacer at the end of `<main>` keeps content clear of the bottom bar.
- **Persistence:** never use `localStorage`/`sessionStorage`. `src/services/storage.ts` stores the versioned keys `my_verge_bucket_items_v1`, `my_verge_categories_v1`, and `my_verge_theme_v1`. On the web they go in IndexedDB (DB `my_verge_data_v1`, store `kv`). On native each key is a `<key>.json` file in `Directory.Data` through `@capacitor/filesystem`, which the OS doesn't evict. The IndexedDB plumbing is shared with attachments in `src/services/idb.ts`. Loads are async: `App.tsx` starts empty, hydrates on mount, and renders a blank page until that finishes. Saving, `syncNativeReminders`, and the reminder poll are all gated on `isHydrated`, so the empty initial state never overwrites stored data or cancels OS notifications. After hydration, `App.tsx` saves on every state change through `useEffect`. Saves are fire-and-forget and run in a queue per key. If storage is empty or holds an empty array, it is re-seeded from `src/data/initialData.ts` / `src/data/categories.ts`. As a result, deleting every item brings the sample data back on the next load. `loadCategories` and backup import run categories through `normalizeCategories`, which folds the legacy `name` field (and "Want to X" labels) into `verb`. `loadBucketItems` and backup import run items through `normalizeItems`, which drops the removed `subCategory` field (`normalizeCategories` likewise drops `defaultSubCategories`). If you change the shape of `BucketItem` or `CategoryDefinition` (`src/types/index.ts`), add a migration there or bump the key. JSON backup export lives in `storage.ts`; import, reset-to-sample, theme picker, and chime test live in `SettingsView`. Video/PDF attachments are stored separately (`src/services/attachments.ts`). On native they are files at `attachments/<id>/<name>` in `Directory.Data`, written in 3 MiB base64 chunks. On the web they go in IndexedDB (DB `my_verge_attachments_v1`). Items keep only `AttachmentMeta`, so the JSON backup does not include those files.
- **Photos and attachments:** `src/components/ItemActions.tsx` owns the Camera and Attach buttons. Images are downscaled to JPEG data URLs (`src/utils/imageResize.ts`) and stored in `BucketItem.photos`. Their optional captions are stored in `photoNotes`, keyed by `photoKey()` (`src/utils/photoKey.ts`). Videos and PDFs up to `MAX_ATTACHMENT_BYTES` (100 MB) are saved through `saveAttachment` (filesystem on native, IndexedDB on web). `MediaNoteSheet` asks for a caption of up to `MEDIA_NOTE_MAX_LENGTH` (100) characters. Phones use the native `<input capture>`, while desktops (non-coarse pointer) use `WebcamCaptureSheet`. Deleting an item also deletes its attachment blobs.
- **Reminders:** `src/services/notifications.ts` checks for due items (`getDueReminderItems`, which honors `reminder.snoozedUntil`). It also plays a chime synthesized with the Web Audio API (no audio assets) and sends browser `Notification`s on the web. `App.tsx` polls every 30 seconds and shows an in-app toast for the first due item. Each occurrence alerts only once: the poll stamps `reminder.lastNotifiedAt` (`getUnnotifiedDueItems`). All reminder timing goes through `reminderTime` / `reminderDueAt` / `reminderNextAt` / `isReminderDue` in `notifications.ts`. A one-off reminder stays due until it is snoozed or completed. A recurring one is due only on the day of its latest occurrence and then rolls forward to its next one. On native, `src/services/reminderScheduler.ts` (`syncNativeReminders`) re-schedules OS notifications through `@capacitor/local-notifications` every time `items` changes. That lets reminders fire while the app is closed. Date-only reminders fire at 9:00 local time, and tapping a notification opens its item.
- **Native (Capacitor):**
  - `capacitor.config.ts` sets the app ID `com.okankilic.myverge` (permanent), and `webDir` is `dist`.
  - `android/` and `ios/` are committed. Edit their manifests and plists directly. After any web change, run `cap:sync`.
  - `src/services/platform.ts` exports `isNative`. Web-only APIs must branch on it:
    - `<a download>`: `exportBackup` writes to the cache and opens the share sheet on native.
    - Blob URLs and `window.open`: on native, `openAttachment` hands the stored file to the system viewer in place.
    - `target="_blank"` links: use `externalLinkProps(url)` / `openExternal(url)`.
    - `new Notification`: replaced by the scheduler above on native.
  - `applyNativeTheme` keeps the status bar in sync with the theme.
  - Icons and splash screens are generated from `assets/*.png` by `@capacitor/assets`. Those PNGs, `public/favicon.svg` and `public/apple-touch-icon.png` are rendered from the brand mark in `assets/brand/render.mjs`. To regenerate everything, run `node assets/brand/render.mjs`, then `node node_modules/@capacitor/assets/bin/capacitor-assets generate --android --ios`. Afterwards, revert the generator's line-ending-only changes to XML/JSON files. The TopNav mark is an inline copy of the same SVG.
  - iOS builds run on Codemagic (`codemagic.yaml`), since there is no local Mac. Android is built locally in Android Studio.
- **Category labels:** a category has no `name`; its `verb` is the label. Every verb in `CATEGORY_VERB_ICONS` (`src/data/categories.ts`) is a built-in category in `DEFAULT_CATEGORIES`, with the lowercase verb as its id. There is no way to create a category. `normalizeCategories` adds any missing verb on load and on backup import and sorts the list into the default order, keeping categories that older builds let users create (ids `custom-*`) so their items still resolve.
- **Category icons:** each verb has a fixed Lucide icon in `CATEGORY_VERB_ICONS` (`src/data/categories.ts`), so users don't pick one. A category stores the icon as a string name (`CategoryDefinition.icon`), and `normalizeCategories` resets it to its verb's icon on load and on backup import. `src/utils/categoryIcons.tsx` maps those names to components, so adding a verb means adding its icon to that map and an entry to `DEFAULT_CATEGORIES`.
- **Styling:** Tailwind v4 is loaded through `@tailwindcss/vite` with `@import "tailwindcss"` in `src/index.css`, so there is no `tailwind.config`. Colors are `@theme` tokens in `src/index.css` (`ink`, `page`, `paper`, `card`, `paper-deep`, `warm`, `sage-tint`, `sage-deep`, `link`), used as `bg-card`, `text-ink`, `border-ink/15`, and so on. Dark mode overrides those tokens: it follows `prefers-color-scheme` unless `data-theme="light"` is set on `<html>`, and `data-theme="dark"` forces it. Use the tokens for surfaces and text. Keep raw hex for fixed accents only (category colors, alert orange `#C05621`), and check those in dark mode. The saved theme is applied when hydration finishes, before the app first renders. There is no pre-paint script, because storage can't be read synchronously. Fonts are bundled through `@fontsource` imports in `src/main.tsx` (no Google Fonts, so the app works offline): Marcellus for display serif (`.font-serif-journal`), Plus Jakarta Sans, and JetBrains Mono (`.font-mono-journal`). Animation uses `motion`, and completions trigger `canvas-confetti`.
- **Sheets and toasts:** every overlay is `src/components/Sheet.tsx`, a bottom sheet on phones and a right-side drawer from `sm:` (backdrop tap and Escape close it, and `stacked` raises one that opens over another). `src/services/dialogs.ts` exposes `notify(message, tone, { action, durationMs })` and `notifyUndo(message, onUndo)`. There is no confirm API. These are rendered as toasts by `src/components/DialogHost.tsx`, which is mounted once in `App.tsx`. This is the one deliberate exception to the single-state-owner rule, so services and deep components can report without prop drilling. Settings' restore and reset can't be undone, so they confirm inline in the page.
- **Path alias:** `@/*` resolves to the repo root, not `src/`.

## Conventions

- **This is a mobile application.**
  - Design and verify at phone width (~390px) first; desktop is a secondary layout.
  - Touch targets are at least 44px.
  - Never rely on hover for meaning or actions.
  - Keep content clear of the fixed bottom tab bar and safe-area insets (`viewport-fit=cover` is set; `TopNav` pads by `safe-area-inset-top`).
- **No modals.** Never build a centered or blocking modal dialog. Overlays go through `Sheet` (bottom sheet on phones, side drawer from `sm:`). There are no blocking confirmations either: run reversible actions immediately and offer Undo via `notifyUndo`, and give irreversible ones an inline two-step confirm in the page.
- **One-word buttons.** A button's visible label is a single word (icons and compact tokens like `+1d` are fine). Put any longer description in `aria-label`/`title`, or in nearby text.
- **No native browser dialogs.** Never use `window.alert`, `window.confirm`, or `window.prompt`. Use `notify` / `notifyUndo` from `src/services/dialogs.ts` instead.

## Environment notes

- `.env.example` declares `GEMINI_API_KEY` and `APP_URL`, which AI Studio injects. Nothing reads them yet, and the app makes no server or AI calls. The unused `@google/genai`, `express`, and `dotenv` dependencies were removed.
- `vite.config.ts` turns off HMR and file watching when `DISABLE_HMR=true`; AI Studio sets this. The comment there says not to modify it.

## Known gaps

- `bun` may not be on the PATH. `npx bun@1.2.23 <cmd>` works without installing anything globally. In the Windows bash shell, run the Capacitor CLI as `node node_modules/@capacitor/cli/bin/capacitor`.
- On the web, all data (including attachments) lives in IndexedDB, and the browser can evict it.
- Data saved in localStorage by older builds is not migrated. Those installs start over from the sample data.

## Future plans

- **Suggest a new item using AI.** Not built yet. `GEMINI_API_KEY` is declared but unused. Calling Gemini from a client app would expose the key, so this needs a backend.
- **Read text from photos with OCR.** Not built yet. The goal is to read the line items on an invoice and sentences from a book page.
