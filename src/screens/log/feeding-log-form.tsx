import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { Minus, Milk, Plus, Repeat, PauseCircle, PlayCircle } from 'lucide-react-native';
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

function StepperRow({
  label,
  value,
  onChange,
  suffix = 'min',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#EFEAE0' : '#262019';

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-line bg-card px-4 py-3 dark:border-[#38332B] dark:bg-[#26221D]">
      <View>
        <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
          {label}
        </Text>
        <Text className="mt-0.5 font-display-semibold text-2xl text-ink dark:text-[#EFEAE0]">
          {value} {suffix}
        </Text>
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
  const [timestamp, setTimestamp] = useState(new Date());
  const [minutes, setMinutes] = useState(18);
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
      <StepperRow label="Duration" value={minutes} onChange={setMinutes} />
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
