# LittleLog — Agent Guide

Offline-first baby routine tracker. Expo SDK 57 · React Native 0.86 · TypeScript strict · Bun.

## Docs — read before writing code

Expo APIs change between SDKs. Always check the **version-pinned** pages:

- Root reference: https://docs.expo.dev/versions/v57.0.0/
- SQLite (promise API: `openDatabaseAsync`, `runAsync`, `getAllAsync`, `withTransactionAsync`):
  https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/
- Notifications (`SchedulableTriggerInputTypes.CALENDAR` for daily reminders):
  https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- FileSystem (new `File`/`Paths` API only; legacy lives at `expo-file-system/legacy`):
  https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
- Image Picker: https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/
- Sharing: https://docs.expo.dev/versions/v57.0.0/sdk/sharing/
- `@expo/ui` DateTimePicker drop-in (`onValueChange`/`onDismiss`, no imperative
  Android API, no Android spinner): 
  https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/datetimepicker/
- Expo Router (Stack/Tabs/modals): https://docs.expo.dev/router/introduction/

## Toolchain — Bun only

This repo uses **Bun** (lockfile: `bun.lock`). Never run `npm install` / `npx`.

```bash
bun install                 # install
bunx expo start             # dev server (dev client)
bunx expo run:ios           # build & run dev client on iOS sim
bunx expo run:android       # build & run dev client on Android emu
bunx tsc --noEmit           # typecheck  <- must pass before any hand-off
bunx eslint src             # lint      <- must pass (0 problems)
bunx vitest run             # unit tests <- must pass (30 tests)
CI=1 bunx expo export --platform web   # bundler smoke test
```

Development build: `expo-dev-client` is installed; EAS profiles in `eas.json`
(`development`, `development-simulator`, `preview`, `production`). Local dev =
`bunx expo start --dev-client` after building once with `expo run:*`.

Release (Android): `bun run android:release` builds split APKs
(arm64 / arm32 / x86_64 / universal) into `android/app/build/outputs/apk/release/`.
`bun run android:release:install` installs them. Distribution = GitHub Releases:
pushing a tag `v*` triggers `.github/workflows/android-release.yml`, which stamps
versionCode from the run number, builds the splits, and attaches
`littlelog-v<version>-<abi>.apk` files to the release. JDK 17 is pinned per-machine
in `~/.gradle/gradle.properties` (NOT in the repo - CI uses setup-java 17).
Release APKs are signed with the committed debug keystore - fine for sideloading;
rotate to a private keystore before any public distribution.

## Architecture

- `src/app/` is **routes only** (Expo Router). Screen bodies live in `src/screens/<feature>/`.
- Data layer: `src/db/` — SQLite via promise API, versioned migrations (`PRAGMA user_version`),
  zod validation at every read boundary (`parseOrThrow`), writes emit `notifyDbChanged()`;
  hooks `useDbQuery(key, fn)` / `useTodaySnapshot` / `useTimeline*` re-run on that signal.
- State: Zustand stores in `src/stores/` persisted to AsyncStorage
  (`activeBabyId`, units, running feed/sleep timers). Timers write entries through repos.
- Canonical units: weights in **grams**, volumes in **ml**, timestamps ISO-UTC.
  Convert at the UI edge with `src/utils/units.ts`. Age display rules live in
  `src/utils/age.ts` (boundary-tested).
- NativeWind v4 styling. Colors ONLY from tokens in `tailwind.config.js`
  (`paper card ink ink-soft line blush peach mint sky butter lavender` + `-soft`).
  Dark mode via `dark:` variants. No `StyleSheet.create` unless NativeWind can't reach.
- Design-system primitives live in `src/components/ui/` (Button/Card/Chip/
  SegmentedControl/StatCard/EmptyState/DateTimeField/...). Reuse them; don't restyle RN cores ad hoc.
- File names kebab-case. No `any`, no `@ts-ignore`, no `eslint-disable` except the two
  sanctioned spots (`queries.ts` dynamic-key effect, `baby-edit` load effect).

## Conventions

- Every save action fires haptics (`src/utils/haptics`) then closes/dismisses.
- Min tap target 48px; icon-only buttons need `accessibilityLabel`.
- Quick-log forms default timestamp = now so a tired parent can log in one tap;
  optional details collapse behind a "details" expander.
- Lists use `FlatList` with stable keys; ticking timers are isolated components
  (`live-timer.tsx`) so parents don't re-render each second.

## Module ownership map

See `CONTRACTS.md` for the original build contract (repo/store/util signatures)
and `README.md` for the data-model diagram + setup instructions.

## Known machine/environment issue (2026-08-24)

Xcode 26.6 on this Mac lacks the **iOS 26.5 platform component**, so `xcodebuild`
reports zero eligible destinations ("iOS 26.5 is not installed") and `bun run ios`
fails before compiling. The CLI downloader (`xcodebuild -downloadPlatform iOS`)
stalls indefinitely at "Preparing to download" on this network; `xcodes runtimes
install "iOS 26.5"` stalls identically. Fix outside the repo (pick one):

1. Xcode → Settings → Components → iOS 26.5 → Get (GUI), or
2. retry `xcodebuild -downloadPlatform iOS` on a different network/VPN off, or
3. `brew install xcodes && xcodes runtimes install "iOS 26.5"` later.

Android is unaffected: `bun run android` builds, installs, and runs clean.
