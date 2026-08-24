# LittleLog — Architecture Contracts

**READ THIS FIRST.** Every module below is owned by exactly one feature. Do not modify files you do not own. Code against these contracts exactly — names, signatures, and paths are fixed so parallel work integrates cleanly. If something here blocks you, note it in your final report instead of inventing a different API.

## Ground rules (all agents)

- **TypeScript strict. No `any`, no `@ts-ignore`/`@ts-expect-error`.** Zod-validate everything crossing the DB boundary.
- **Styling: NativeWind classNames only** (`className` on RN core components works via the babel preset). Colors ONLY from `tailwind.config.js` tokens: `paper, card, ink, ink-soft, line, blush, peach, mint, sky, butter, lavender` (+ `-soft` variants). Dark mode via `dark:` variants (e.g. `bg-paper dark:bg-[#17161D]` is NOT allowed — add a token to tailwind.config.js instead if you need one; tailwind.config.js is owned by the integrator).
- Min tap target 48px. Icon-only buttons need `accessibilityLabel`. Haptic feedback on every save/complete action (`@/utils/haptics`).
- File names kebab-case. Routes live in `src/app/` and contain NOTHING but route wiring (render screen components from `src/screens/<feature>`).
- **Expo SDK 57** — before using any expo/community native API, check the versioned docs at https://docs.expo.dev/versions/v57.0.0/ (AGENTS.md requirement). Notably `expo-sqlite` uses the modern promise API (`openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `withTransactionAsync`), `expo-notifications` scheduling changed in recent SDKs — verify `SchedulableTriggerInputTypes`.
- Timestamps stored as ISO 8601 UTC strings. IDs via `crypto.randomUUID()`.
- All dates/times displayed to users use helpers from `@/utils/datetime`.

## Folder ownership map

| Path | Owner |
|---|---|
| `src/db/**` | DATA agent |
| `src/stores/**` | DATA agent |
| `src/utils/**` | DATA agent (age, units, datetime) / UI agent (haptics.ts) |
| `src/components/ui/**` | UI-KIT agent |
| `src/app/_layout.tsx`, `src/app/(tabs)/**` | INTEGRATION |
| `src/screens/dashboard/**` | DASHBOARD agent |
| `src/screens/history/**` | HISTORY agent |
| `src/screens/medicines/**`, `src/app/(tabs)/medicines.tsx` | MEDICINES agent |
| `src/screens/settings/**`, `src/app/(tabs)/settings.tsx` | SETTINGS agent |
| `src/screens/baby-edit/**`, `src/app/baby/[id]/edit.tsx` | PROFILE agent |
| `src/screens/log/**`, `src/app/log/[type].tsx` | Forms: per-tracker agents; route file: INTEGRATION |
| `tailwind.config.js`, `metro.config.js`, `babel.config.js`, `app.json` | INTEGRATOR only |

## Data layer (`src/db/`) — DATA agent owns, everyone imports

```
src/db/
  index.ts          // openDatabase(), with openDatabaseAsync('littlelog.db'); runs migrations; exports getDb()
  schema.ts         // CREATE TABLE statements + PRAGMA user_version migrations
  schemas.ts        // zod schemas: babySchema, weightEntrySchema, feedingEntrySchema, sleepEntrySchema,
                    //   diaperEntrySchema, bathEntrySchema, medicineSchema, medicineDoseEntrySchema
  change-bus.ts     // tiny emitter: notifyDbChanged(), onDbChanged(cb) => unsubscribe
  babies.ts         // repo
  weights.ts  feedings.ts  sleep.ts  diapers.ts  baths.ts  medicines.ts  doses.ts
  queries.ts        // cross-entity read hooks (below)
```

Repo function naming convention (each async, each zod-parses rows on read, calls `notifyDbChanged()` after writes):

```ts
// e.g. weights.ts — same pattern for all entities, singular entity name X:
listXs(babyId: string): Promise<X[]>                 // ordered by timestamp DESC
getX(id: string): Promise<X | null>
createX(data: X): Promise<void>
updateX(id: string, patch: Partial<Omit<X,'id'|'babyId'>>): Promise<void>
deleteX(id: string): Promise<void>
```

Sleep specifics: `endSleep(id: string, endTime: string)` sets `end_time`; `getActiveSleep(babyId)` returns in-progress entry or null.
Medicine specifics: `listMedicines(babyId)`, `listDoses(babyId, medicineId?)`, plus `deleteMedicine(id)` cascades dose deletion.

### Reactive query hooks (in `queries.ts`) — dashboards/timelines consume these

```ts
export function useDbQuery<T>(fn: () => Promise<T>, deps: unknown[]): T | undefined
// subscribes to change-bus; refetches after every write. Returns undefined until first load.

export type TodaySnapshot = {
  feeds: { count: number; totalMl: number; totalBreastSeconds: number };
  diapers: { wet: number; dirty: number; lastChangeAt: string | null };
  lastBathAt: string | null;
  lastFeedAt: string | null;
  lastWeightGrams: number | null;
  prevWeightGrams: number | null;      // reading before the last one (for delta)
  sleepTodaySeconds: number;           // completed sleep intersecting today
  napCount: number;
  dosesGivenToday: number;             // medicine doses today
};
export function useTodaySnapshot(babyId: string): TodaySnapshot | undefined

export function useTimelineDay(babyId: string, dayStartISO: string): TimelineItem[]
// TimelineItem = { id, kind: 'feed'|'sleep'|'diaper'|'bath'|'weight'|'dose', at: string,
//                    title: string, subtitle?: string }  // title/subtitle preformatted for display
export function useTimelineRange(babyId: string, days: number): TimelineItem[]  // for History list
```

## Stores (`src/stores/`) — DATA agent owns

```ts
// src/stores/babies.ts — zustand + persist (AsyncStorage)
useBabyStore: {
  babies: Baby[]; loaded: boolean;
  activeBabyId: string | null;
  setActiveBaby(id: string): void;
  refresh(): Promise<void>;            // re-reads babies table into store
}

// src/stores/settings.ts — zustand + persist
useSettingsStore: {
  weightUnit: 'kg' | 'lb'; volumeUnit: 'ml' | 'oz';
  remindersEnabled: boolean;
  setWeightUnit(u): void; setVolumeUnit(u): void; setRemindersEnabled(b): void;
}

// src/stores/timers.ts — zustand + persist (survives app restart)
useTimersStore: {
  activeSleep: { startedAt: string } | null;                  // current baby implied by activeBabyId
  feedSession: {
    startedAt: string;
    segments: { side: 'left' | 'right'; seconds: number }[];  // completed sides
    currentSide: 'left' | 'right';
    sideStartedAt: string;                                    // epoch ms of current side start
    pausedAt: number | null;                                  // epoch ms when paused, null = running
  } | null;
  startSleep(): void; stopSleep(): Promise<void>;             // stopSleep creates SleepEntry via repo
  startFeed(side): void; switchFeedSide(): void; togglePauseFeed(): void;
  finishFeed(opts?: { manualDurationSeconds?: number }): Promise<void>;  // creates FeedingEntry
}
```

## Utils (`src/utils/`) — pinned behavior, unit-tested

```ts
// age.ts
formatAge(dobISO: string, now?: Date): string
// < 28 days      -> "3 days old" / "1 day old"
// 28d – <70d     -> whole weeks: "6 weeks old" / "4 weeks old" (floor)
// 70d – <12mo    -> whole months: "4 months old"
// 12mo – <24mo   -> "1 yr 2 mo old" (mo = remaining months; omit if 0 -> "1 yr old")
// >= 24mo        -> "3 yr 1 mo old"

// units.ts
weightToDisplay(grams: number, unit: 'kg'|'lb'): number   // kg: g/1000 rounded 2dp; lb: rounded 1dp
formatWeight(grams: number, unit): string                  // "4.25 kg" | "9.4 lb"
volumeToDisplay(ml: number, unit: 'ml'|'oz'): number       // oz: ml/29.5735 rounded 1dp
formatVolumeMl(ml: number, unit): string                   // "150 ml" | "5.1 oz"
parseWeightToGrams(value: number, unit): number
parseVolumeToMl(value: number, unit): number

// datetime.ts
formatTime(iso): string            // "7:42 AM"
formatDayLabel(iso): string        // "Today" | "Yesterday" | "Aug 24"
formatRelative(iso): string        // "2h ago", "15m ago", "3d ago"
startOfLocalDay(date?): Date       // local-time day boundary
durationText(seconds: number): string // "1h 24m", "45m", "30s"
```

Tests: `src/utils/*.test.ts` runnable with `npx vitest run` (pure functions only — no RN imports in tested modules).

## UI kit (`src/components/ui/index.ts` barrel) — UI-KIT agent owns

Exports (props kept minimal, all accept `className` + `style`):

```tsx
Button({ variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'|'lg'; loading?; disabled?; label: string; icon?: LucideIcon; onPress }) 
Card({ children, className?, onPress? })                       // bg-card rounded-2xl p-4 border border-line, pressed feedback
Chip({ label, selected?, onSelect?, color?: 'blush'|'peach'|'mint'|'sky'|'butter'|'lavender' })
SegmentedControl<T extends string>({ options: {value:T,label:string}[], value: T, onChange })
StatCard({ label, value, sublabel?, accent?: AccentColor })
EmptyState({ icon: LucideIcon, title, message, actionLabel?, onAction? })
Field({ label, hint?, children })                              // labeled form row wrapper
TextField(props: TextInputProps & { className? })              // consistent rounded input
NumberField({ value, onChangeValue, suffix?, placeholder? })   // numeric keyboard input
DateTimeField({ value: Date, onChange })                       // pressable row -> @react-native-community/datetimepicker (mode="datetime", inline on iOS)
Screen({ children, className? })                               // SafeArea + bg-paper px-4 wrapper for tab screens
SectionTitle({ children })                                     // text-base font-semibold text-ink
Avatar({ uri?, name, size })                                   // initials fallback circle
```

Accent mapping used across features: Feeding=peach, Sleep=lavender, Diaper=mint, Bath=sky, Weight=butter, Medicine=blush.

Also `src/utils/haptics.ts`: `tap()` (light), `success()` (notification success), `error()`.

## Quick-log forms contract (`src/screens/log/`)

Each tracker agent creates ONE file exporting its form:

```tsx
export type LogFormProps = { babyId: string; onDone: () => void };
// Diaper:  src/screens/log/diaper-form.tsx       export function DiaperLogForm(props)
// Bath:    src/screens/log/bath-form.tsx         export function BathLogForm(props)
// Weight:  src/screens/log/weight-log-form.tsx   export function WeightLogForm(props)
// Feeding: src/screens/log/feeding-log-form.tsx  export function FeedingLogForm(props)
// Sleep:   src/screens/log/sleep-log-form.tsx    export function SleepLogForm(props)
// Dose:    src/screens/log/dose-form.tsx         export function DoseForm(props)
```

Form UX requirements (all forms): default timestamp = now, one-tap save with sensible defaults, "Details" expandable section for optional fields, haptic + `onDone()` after successful write. Feeding form: segmented Breast/Bottle; breast mode binds to `useTimersStore.feedSession` if active (shows live timer + Finish button) else manual duration entry; bottle mode amount + type chips. Sleep form: if `activeSleep` show running timer + "Wake up" button; else Start timer OR manual start/end entry; type auto nap/night by start hour (<19:00 → nap), editable chip.

The modal route `log/[type]` maps: feeding→FeedingLogForm, sleep→SleepLogForm, diaper→DiaperLogForm, bath→BathLogForm, weight→WeightLogForm, medicine→DoseForm.

## Notifications contract (MEDICINES agent)

`src/notifications/index.ts`: requestPermissionGracefully() → boolean; scheduleMedicineReminder(medicine, times[]) cancels existing id `med-${medicineId}` then schedules daily calendar triggers; cancelMedicineReminder(id). Deep link: notification response listener navigates to `/log/medicine?medicineId=...` where DoseForm preselects that medicine and marks given. Respect `remindersEnabled` setting; disable toggles gracefully when permission denied.
