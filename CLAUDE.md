# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

My Verge is a client-only React 19 + Vite + Tailwind CSS v4 single-page app, also shipped as iOS and Android apps through Capacitor 8: a mobile-first "bucket list and reminder journal" with categories Go, Do, Buy, Remember, Read, Watch (plus user-created custom categories). It was scaffolded in Google AI Studio (`metadata.json`, `.aistudio/`), and the package manager is Bun (`bun.lock`).

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
- **Item lifecycle:** `status` is `active | completed | archived`. An active item with `startedAt` set is "in progress": it appears on the Now tab and is excluded from the Journal feed and its category counts. `handleToggleStarted` sets or clears `startedAt`, and completing an item clears it and opens `MilestoneModal` for a reflection.
- **Search:** search is global. `searchedItems` in `App.tsx` feeds every tab except Settings. `SearchBar` is toggled from `TopNav` and `BottomTabBar`, and closing it clears the query.
- **Navigation:** `BottomTabBar` is phone-only (`md:hidden`). It has New, a current-section button that fans out the tab switcher, and Search. `TopNav` holds the desktop tab links and a phone-frame preview toggle (`isMobileFrame`). A spacer at the end of `<main>` keeps content clear of the bottom bar.
- **Persistence:** `src/services/storage.ts` reads and writes `localStorage` under the versioned keys `my_verge_bucket_items_v1`, `my_verge_categories_v1`, and `my_verge_theme_v1`. `App.tsx` saves on every state change through `useEffect`. If storage is empty or holds an empty array, it is re-seeded from `src/data/initialData.ts` / `src/data/categories.ts`. As a result, deleting every item brings the sample data back on the next load. `loadCategories` also contains a migration that renames legacy "Want to X" categories. If you change the shape of `BucketItem` or `CategoryDefinition` (`src/types/index.ts`), add a migration there or bump the key. JSON backup export lives in `storage.ts`; import, reset-to-sample, theme picker, and chime test live in `SettingsView`. Video/PDF attachments are the exception: their bytes live in IndexedDB (`src/services/attachments.ts`, DB `my_verge_attachments_v1`), and items keep only `AttachmentMeta` in localStorage, so the JSON backup does not include those files.
- **Photos and attachments:** `src/components/ItemActions.tsx` owns the Camera and Attach buttons. Images are downscaled to JPEG data URLs (`src/utils/imageResize.ts`) and stored in `BucketItem.photos`. Their optional captions are stored in `photoNotes`, keyed by `photoKey()` (`src/utils/photoKey.ts`). Videos and PDFs up to `MAX_ATTACHMENT_BYTES` (100 MB) go to IndexedDB. `MediaNoteModal` asks for a caption of up to `MEDIA_NOTE_MAX_LENGTH` (100) characters. Phones use the native `<input capture>`, while desktops (non-coarse pointer) use `WebcamCaptureModal`. Deleting an item also deletes its attachment blobs.
- **Reminders:** `src/services/notifications.ts` checks for due items (`getDueReminderItems`, which honors `reminder.snoozedUntil`). It also plays a chime synthesized with the Web Audio API (no audio assets) and sends browser `Notification`s on the web. `App.tsx` polls every 30 seconds and shows an in-app toast for the first due item. Each occurrence alerts only once: the poll stamps `reminder.lastNotifiedAt` (`getUnnotifiedDueItems`). All reminder timing goes through `reminderTime` / `reminderDueAt` / `reminderNextAt` / `isReminderDue` in `notifications.ts`. A one-off reminder stays due until it is snoozed or completed. A recurring one is due only on the day of its latest occurrence and then rolls forward to its next one. On native, `src/services/reminderScheduler.ts` (`syncNativeReminders`) re-schedules OS notifications through `@capacitor/local-notifications` every time `items` changes. That lets reminders fire while the app is closed. Date-only reminders fire at 9:00 local time, and tapping a notification opens its item.
- **Native (Capacitor):**
  - `capacitor.config.ts` sets the app ID `com.okankilic.myverge` (permanent), and `webDir` is `dist`.
  - `android/` and `ios/` are committed. Edit their manifests and plists directly. After any web change, run `cap:sync`.
  - `src/services/platform.ts` exports `isNative`. Web-only APIs must branch on it:
    - `<a download>`: `exportBackup` writes to the cache and opens the share sheet on native.
    - Blob URLs and `window.open`: `openAttachment` copies the file to the cache and opens the system viewer on native.
    - `target="_blank"` links: use `externalLinkProps(url)` / `openExternal(url)`.
    - `new Notification`: replaced by the scheduler above on native.
  - `applyNativeTheme` keeps the status bar in sync with the theme.
  - Icons and splash screens are generated from `assets/*.png` by `@capacitor/assets`.
  - iOS builds run on Codemagic (`codemagic.yaml`), since there is no local Mac. Android is built locally in Android Studio.
- **Category icons:** a category stores its Lucide icon as a string name (`CategoryDefinition.icon`). `src/utils/categoryIcons.tsx` maps those names to components, so a new icon must be added to that map.
- **Styling:** Tailwind v4 is loaded through `@tailwindcss/vite` with `@import "tailwindcss"` in `src/index.css`, so there is no `tailwind.config`. Colors are `@theme` tokens in `src/index.css` (`ink`, `page`, `paper`, `card`, `paper-deep`, `warm`, `sage-tint`, `sage-deep`, `link`), used as `bg-card`, `text-ink`, `border-ink/15`, and so on. Dark mode overrides those tokens: it follows `prefers-color-scheme` unless `data-theme="light"` is set on `<html>`, and `data-theme="dark"` forces it. Use the tokens for surfaces and text. Keep raw hex for fixed accents only (category colors, alert orange `#C05621`), and check those in dark mode. An inline script in `index.html` applies the saved theme before first paint and reads `my_verge_theme_v1` directly, so keep it in sync with `storage.ts`. Fonts are bundled through `@fontsource` imports in `src/main.tsx` (no Google Fonts, so the app works offline): Marcellus for display serif (`.font-serif-journal`), Plus Jakarta Sans, and JetBrains Mono (`.font-mono-journal`). Animation uses `motion`, and completions trigger `canvas-confetti`.
- **Dialogs:** `src/services/dialogs.ts` exposes `confirmAction(...)` (returns a `Promise<boolean>`) and `notify(message, tone)`. They are rendered by `src/components/DialogHost.tsx`, which is mounted once in `App.tsx`. This is the one deliberate exception to the single-state-owner rule, so services and deep components can confirm or report without prop drilling.
- **Path alias:** `@/*` resolves to the repo root, not `src/`.

## Conventions

- **This is a mobile application.**
  - Design and verify at phone width (~390px) first; desktop is a secondary layout.
  - Touch targets are at least 44px.
  - Never rely on hover for meaning or actions.
  - Overlays use bottom-sheet patterns on phones.
  - Keep content clear of the fixed bottom tab bar and safe-area insets (`viewport-fit=cover` is set; `TopNav` pads by `safe-area-inset-top`).
- **No native browser dialogs.** Never use `window.alert`, `window.confirm`, or `window.prompt`. Use `confirmAction` / `notify` from `src/services/dialogs.ts` instead.

## Environment notes

- `.env.example` declares `GEMINI_API_KEY` and `APP_URL`, which AI Studio injects. Nothing reads them yet, and the app makes no server or AI calls. The unused `@google/genai`, `express`, and `dotenv` dependencies were removed.
- `vite.config.ts` turns off HMR and file watching when `DISABLE_HMR=true`; AI Studio sets this. The comment there says not to modify it.

## Known gaps

- `src/components/ItemCard.tsx` is not imported anywhere.
- `bun` may not be on the PATH. `npx bun@1.2.23 <cmd>` works without installing anything globally. In the Windows bash shell, run the Capacitor CLI as `node node_modules/@capacitor/cli/bin/capacitor`.
- iOS WebView storage can be cleared under storage pressure, and photos as data URLs count against the roughly 5 MB localStorage quota. Moving items to `@capacitor/filesystem` would make native storage durable.

## Future plans

- **Suggest a new item using AI.** Not built yet. `GEMINI_API_KEY` is declared but unused. Calling Gemini from a client app would expose the key, so this needs a backend.
