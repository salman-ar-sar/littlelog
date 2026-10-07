import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {
  Check,
  Minus,
  Milk,
  Pencil,
  Plus,
  Repeat,
  PauseCircle,
  PlayCircle,
  Star,
} from 'lucide-react-native';
import {
  Button,
  Chip,
  DateTimeField,
  Field,
  NumberField,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { createFeeding, deleteFeeding, listFeedings } from '@/db/feedings';
import { useToastStore } from '@/stores/toast';
import { useDbQuery } from '@/db/queries';
import type { BottleType, FeedingSide } from '@/db/types';
import { formatTime } from '@/utils/datetime';
import { formatVolumeMl, parseVolumeToMl } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { useTimersStore } from '@/stores/timers';
import { error as hapticError, success, tap } from '@/utils/haptics';
import { LiveTimer } from './live-timer';
import type { LogFormProps } from './diaper-form';

type Mode = 'breast' | 'bottle' | 'solids';

const BOTTLE_TYPES: { value: BottleType; label: string }[] = [
  { value: 'breast_milk', label: 'Breast milk' },
  { value: 'formula', label: 'Formula' },
  { value: 'mixed', label: 'Mixed' },
];

export function FeedingLogForm({ babyId, onDone }: LogFormProps) {
  const feedSession = useTimersStore((s) => s.feedSession);
  const [mode, setMode] = useState<Mode>('breast');

  if (feedSession) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
        <BreastTimerActive />
      </ScrollView>
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <SegmentedControl<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'breast', label: 'Breast' },
          { value: 'bottle', label: 'Bottle' },
          { value: 'solids', label: 'Solids' },
        ]}
      />
      {mode === 'breast' ? <BreastSection babyId={babyId} onDone={onDone} /> : null}
      {mode === 'bottle' ? <BottleSection babyId={babyId} onDone={onDone} /> : null}
      {mode === 'solids' ? <SolidsSection babyId={babyId} onDone={onDone} /> : null}
    </ScrollView>
  );
}

/* --------------------------------- BREAST --------------------------------- */

function useLastSideFeed(babyId: string) {
  const feeds = useDbQuery(`feeds:${babyId}`, () => listFeedings(babyId));
  return useMemo(() => {
    const last = (side: FeedingSide) =>
      (feeds ?? []).find((f) => f.mode === 'breast' && (f.side === side || f.side === 'both'));
    return { left: last('left'), right: last('right') };
  }, [feeds]);
}

function BreastSection({ babyId, onDone }: LogFormProps) {
  const feedSession = useTimersStore((s) => s.feedSession);
  const last = useLastSideFeed(babyId);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [input, setInput] = useState<'timer' | 'manual'>('manual');

  if (feedSession) return <BreastTimerActive />;

  return (
    <View style={{ rowGap: 16 }}>
      <View className="flex-row gap-3">
        <SideCard label="Left" lastAt={last.left?.timestamp} selected={side === 'left'} onPress={() => setSide('left')} />
        <SideCard label="Right" lastAt={last.right?.timestamp} selected={side === 'right'} onPress={() => setSide('right')} />
      </View>

      <SegmentedControl<'timer' | 'manual'>
        value={input}
        onChange={setInput}
        options={[
          { value: 'timer', label: 'Start a timer' },
          { value: 'manual', label: 'Enter manually' },
        ]}
      />
      {input === 'timer' ? <BreastTimerStart side={side} /> : <BreastManual babyId={babyId} side={side} onDone={onDone} />}
    </View>
  );
}

function SideCard({
  label,
  lastAt,
  selected,
  onPress,
}: {
  label: string;
  lastAt?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        void tap();
        onPress();
      }}
      className={`min-h-[72px] flex-1 items-center justify-center rounded-xl border py-3 active:opacity-80 ${
        selected
          ? 'border-peach bg-peach-soft'
          : 'border-line bg-card dark:border-[#38332B] dark:bg-[#26221D]'
      }`}
    >
      <Text
        className={`text-base font-sans-semibold ${
          selected ? 'text-peach' : 'text-ink dark:text-[#EFEAE0]'
        }`}
      >
        {label}
      </Text>
      <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]">
        {lastAt ? `last: ${formatTime(lastAt)}` : 'no logs yet'}
      </Text>
    </Pressable>
  );
}

function BreastTimerStart({ side }: { side: 'left' | 'right' }) {
  const startFeed = useTimersStore((s) => s.startFeed);
  return (
    <Button
      size="lg"
      icon={Milk}
      label={`Start nursing (${side})`}
      onPress={() => {
        void tap();
        startFeed(side);
      }}
    />
  );
}

function BreastTimerActive() {
  const feedSession = useTimersStore((s) => s.feedSession);
  const switchFeedSide = useTimersStore((s) => s.switchFeedSide);
  const togglePauseFeed = useTimersStore((s) => s.togglePauseFeed);
  const finishFeed = useTimersStore((s) => s.finishFeed);
  const [finishing, setFinishing] = useState(false);

  if (!feedSession) return null;
  const paused = feedSession.pausedAt !== null;

  const finish = async () => {
    setFinishing(true);
    try {
      await finishFeed();
      void success();
    } catch (e) {
      void hapticError();
      console.warn('[feed] finish failed:', e);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <View style={{ rowGap: 12 }}>
      <View className="items-center gap-4 rounded-2xl border border-peach bg-peach-soft p-6">
        <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-peach">
          Nursing · {feedSession.currentSide} side{paused ? ' · paused' : ''}
        </Text>
        <LiveTimer sideStartedAt={feedSession.sideStartedAt} pausedAt={feedSession.pausedAt} />
      </View>

      <View className="flex-row gap-2">
        <Button
          variant="ghost"
          label="Switch side"
          icon={Repeat}
          onPress={() => {
            void tap();
            switchFeedSide();
          }}
          className="flex-1"
        />
        <Button
          variant="ghost"
          label={paused ? 'Resume' : 'Pause'}
          icon={paused ? PlayCircle : PauseCircle}
          onPress={() => {
            void tap();
            togglePauseFeed();
          }}
          className="flex-1"
        />
      </View>
      <Button label="Finish & save" onPress={() => void finish()} loading={finishing} size="lg" />
    </View>
  );
}

interface StepperRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  defaultValue?: number;
  onSetDefault?: (v: number) => void;
}

function StepperRow({
  label,
  value,
  onChange,
  suffix = 'min',
  defaultValue,
  onSetDefault,
}: StepperRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#EFEAE0' : '#262019';

  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(String(value));

  const isDifferentFromDefault =
    defaultValue !== undefined && onSetDefault !== undefined && defaultValue !== value;

  const handleOpenEdit = () => {
    void tap();
    setDraftText(String(value));
    setEditing(true);
  };

  return (
    <View className="rounded-xl border border-line bg-card px-4 py-3 dark:border-[#38332B] dark:bg-[#26221D]">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
            {label}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}: ${value} ${suffix}`}
            onPress={handleOpenEdit}
            className="mt-0.5 flex-row items-center gap-1.5 active:opacity-60"
          >
            <Text className="font-display-semibold text-2xl text-ink dark:text-[#EFEAE0]">
              {value} {suffix}
            </Text>
            <View className="rounded bg-black/5 p-1 dark:bg-white/10">
              <Pencil size={12} color={isDark ? '#9C937F' : '#8A8699'} />
            </View>
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
            onPress={() => {
              void tap();
              onChange(Math.max(1, value - 1));
            }}
            className="h-12 w-12 items-center justify-center rounded-full border border-line bg-black/5 active:opacity-70 dark:border-[#38332B] dark:bg-white/10"
          >
            <Minus size={18} color={iconColor} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
            onPress={() => {
              void tap();
              onChange(value + 1);
            }}
            className="h-12 w-12 items-center justify-center rounded-full border border-line bg-black/5 active:opacity-70 dark:border-[#38332B] dark:bg-white/10"
          >
            <Plus size={18} color={iconColor} />
          </Pressable>
        </View>
      </View>

      {/* Quick option to save as default if altered via +/- on card */}
      {isDifferentFromDefault && (
        <View className="mt-2.5 flex-row items-center border-t border-line/60 pt-2 dark:border-[#38332B]/60">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Set ${value} ${suffix} as default`}
            onPress={() => {
              void success();
              onSetDefault(value);
            }}
            className="flex-row items-center gap-1.5 rounded-full bg-peach/10 px-2.5 py-1 active:opacity-70 dark:bg-peach/20"
          >
            <Star size={12} color="#F0A47E" fill="#F0A47E" />
            <Text className="font-sans-medium text-xs text-peach">
              Set {value} {suffix} as default
            </Text>
          </Pressable>
        </View>
      )}

      {/* Editable count modal */}
      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            accessibilityLabel="Dismiss modal"
            onPress={() => setEditing(false)}
          />

          <View className="rounded-t-3xl border-t border-line bg-[#FAF7F2] p-5 pb-9 dark:border-[#38332B] dark:bg-[#1E1B16]">
            <View className="mb-4 flex-row items-center justify-between border-b border-line pb-3 dark:border-[#38332B]">
              <Text className="text-base font-semibold text-ink dark:text-[#EFEAE0]">
                Edit {label.toLowerCase()}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={() => setEditing(false)}
                className="rounded-full bg-peach/15 px-4 py-1.5 active:opacity-60 dark:bg-peach/25"
              >
                <Text className="font-sans-bold text-sm text-peach dark:text-[#F5B495]">Done</Text>
              </Pressable>
            </View>

            <View className="my-2 items-center">
              <View className="flex-row items-center gap-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${label}`}
                  onPress={() => {
                    void tap();
                    const next = Math.max(1, value - 1);
                    onChange(next);
                    setDraftText(String(next));
                  }}
                  className="h-12 w-12 items-center justify-center rounded-full border border-line bg-black/5 active:opacity-70 dark:border-[#38332B] dark:bg-white/10"
                >
                  <Minus size={20} color={iconColor} />
                </Pressable>

                <View className="flex-row items-baseline rounded-2xl border border-line bg-card px-5 py-2.5 dark:border-[#38332B] dark:bg-[#26221D]">
                  <TextInput
                    value={draftText}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    onChangeText={(text) => {
                      const digits = text.replace(/[^0-9]/g, '');
                      setDraftText(digits);
                      const num = parseInt(digits, 10);
                      if (!isNaN(num) && num > 0) {
                        onChange(num);
                      }
                    }}
                    onBlur={() => {
                      if (!draftText || parseInt(draftText, 10) < 1) {
                        setDraftText(String(value));
                      }
                    }}
                    className="min-w-[64px] text-center font-display-bold text-3xl text-ink dark:text-[#EFEAE0]"
                  />
                  <Text className="ml-1 text-base font-medium text-ink-soft dark:text-[#9C937F]">
                    {suffix}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${label}`}
                  onPress={() => {
                    void tap();
                    const next = value + 1;
                    onChange(next);
                    setDraftText(String(next));
                  }}
                  className="h-12 w-12 items-center justify-center rounded-full border border-line bg-black/5 active:opacity-70 dark:border-[#38332B] dark:bg-white/10"
                >
                  <Plus size={20} color={iconColor} />
                </Pressable>
              </View>

              {/* Common presets */}
              <View className="mt-5 flex-row gap-2">
                {[10, 15, 18, 20, 25, 30].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      void tap();
                      onChange(preset);
                      setDraftText(String(preset));
                    }}
                    className={`rounded-lg px-3 py-1.5 active:opacity-70 ${
                      value === preset
                        ? 'bg-peach'
                        : 'border border-line bg-black/5 dark:border-[#38332B] dark:bg-white/10'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        value === preset ? 'text-white' : 'text-ink-soft dark:text-[#9C937F]'
                      }`}
                    >
                      {preset}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Set as default section */}
            {onSetDefault && (
              <View className="mt-6 border-t border-line pt-4 dark:border-[#38332B]">
                {defaultValue === value ? (
                  <View className="flex-row items-center justify-center gap-1.5 py-1">
                    <Check size={16} color="#34C759" />
                    <Text className="text-sm font-medium text-ink-soft dark:text-[#9C937F]">
                      {value} {suffix} is currently your default
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${value} ${suffix} as default`}
                    onPress={() => {
                      void success();
                      onSetDefault(value);
                    }}
                    className="flex-row items-center justify-center gap-2 rounded-xl border border-peach/40 bg-peach/10 py-3 active:opacity-70 dark:border-peach/30 dark:bg-peach/15"
                  >
                    <Star size={16} color="#F0A47E" fill="#F0A47E" />
                    <Text className="font-sans-semibold text-sm text-peach">
                      Set {value} {suffix} as default
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimeRow({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return (
    <View style={{ rowGap: 8 }}>
      <DateTimeField label="Time" value={value} onChange={onChange} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Set time to now"
        onPress={() => {
          void tap();
          onChange(new Date());
        }}
        className="self-start"
      >
        <Text className="font-sans-semibold text-sm text-peach">Set to now</Text>
      </Pressable>
    </View>
  );
}

function BreastManual({
  babyId,
  side,
  onDone,
}: LogFormProps & { side: 'left' | 'right' }) {
  const defaultDuration = useSettingsStore((s) => s.defaultFeedDurationMinutes ?? 18);
  const setDefaultDuration = useSettingsStore((s) => s.setDefaultFeedDurationMinutes);

  const [timestamp, setTimestamp] = useState(new Date());
  const [minutes, setMinutes] = useState(defaultDuration);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const record = {
        id: `fed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        mode: 'breast',
        side,
        durationSeconds: Math.round(minutes * 60),
        note: note.trim() || undefined,
      } as const;
      await createFeeding(record);
      void success();
      useToastStore.getState().show('Feed logged', async () => {
        await deleteFeeding(record.id);
      });
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[feed] manual save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ rowGap: 16 }}>
      <StepperRow
        label="Duration"
        value={minutes}
        onChange={setMinutes}
        defaultValue={defaultDuration}
        onSetDefault={(val) => {
          setDefaultDuration(val);
          useToastStore.getState().show(`Default duration set to ${val} min`);
        }}
      />
      <TimeRow value={timestamp} onChange={setTimestamp} />
      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <Button label="Log feed" icon={Milk} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}

/* --------------------------------- BOTTLE --------------------------------- */

function BottleSection({ babyId, onDone }: LogFormProps) {
  const volumeUnit = useSettingsStore((s) => s.volumeUnit);
  const [timestamp, setTimestamp] = useState(new Date());
  const [amountDisplay, setAmountDisplay] = useState<number | undefined>(undefined);
  const [bottleType, setBottleType] = useState<BottleType>('formula');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (amountDisplay === undefined) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      const record = {
        id: `fed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        mode: 'bottle',
        amountMl: parseVolumeToMl(amountDisplay, volumeUnit),
        bottleType,
        note: note.trim() || undefined,
      } as const;
      await createFeeding(record);
      void success();
      useToastStore.getState().show('Feed logged', async () => {
        await deleteFeeding(record.id);
      });
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[feed] bottle save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ rowGap: 16 }}>
      <Field
        label={`Amount (${volumeUnit})`}
        hint={
          amountDisplay !== undefined
            ? formatVolumeMl(parseVolumeToMl(amountDisplay, volumeUnit), volumeUnit)
            : undefined
        }
      >
        <NumberField
          value={amountDisplay}
          onChangeValue={setAmountDisplay}
          suffix={volumeUnit}
          placeholder="e.g. 120"
        />
      </Field>
      <Field label="Type">
        <View className="flex-row gap-2">
          {BOTTLE_TYPES.map((t) => (
            <View key={t.value} className="flex-1">
              <Chip
                label={t.label}
                selected={bottleType === t.value}
                onSelect={() => setBottleType(t.value)}
                color="peach"
              />
            </View>
          ))}
        </View>
      </Field>
      <TimeRow value={timestamp} onChange={setTimestamp} />
      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <Button label="Log feed" icon={Milk} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}

/* --------------------------------- SOLIDS --------------------------------- */

function SolidsSection({ babyId, onDone }: LogFormProps) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [minutes, setMinutes] = useState(10);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const record = {
        id: `fed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        mode: 'solids',
        durationSeconds: Math.round(minutes * 60),
        note: note.trim() || undefined,
      } as const;
      await createFeeding(record);
      void success();
      useToastStore.getState().show('Solids logged', async () => {
        await deleteFeeding(record.id);
      });
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[feed] solids save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ rowGap: 16 }}>
      <StepperRow label="Duration" value={minutes} onChange={setMinutes} />
      <TimeRow value={timestamp} onChange={setTimestamp} />
      <Field label="What did they eat?" hint="Optional — for the record.">
        <TextField value={note} onChangeText={setNote} placeholder="e.g. carrot purée" multiline />
      </Field>
      <Button label="Log solids" icon={Milk} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}
