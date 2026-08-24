import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Milk, PauseCircle, PlayCircle, Repeat } from 'lucide-react-native';
import {
  Button,
  Chip,
  DateTimeField,
  Field,
  NumberField,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { createFeeding } from '@/db/feedings';
import type { BottleType, FeedingSide } from '@/db/types';
import { formatVolumeMl, parseVolumeToMl } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { useTimersStore } from '@/stores/timers';
import { error as hapticError, success, tap } from '@/utils/haptics';
import { LiveTimer } from './live-timer';
import type { LogFormProps } from './diaper-form';

type Mode = 'breast' | 'bottle';
type BreastInput = 'timer' | 'manual';

const BOTTLE_TYPES: { value: BottleType; label: string }[] = [
  { value: 'breast_milk', label: 'Breast milk' },
  { value: 'formula', label: 'Formula' },
  { value: 'mixed', label: 'Mixed' },
];

export function FeedingLogForm({ babyId, onDone }: LogFormProps) {
  const [mode, setMode] = useState<Mode>('breast');
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <SegmentedControl<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'breast', label: '🤱 Breast' },
          { value: 'bottle', label: '🍼 Bottle' },
        ]}
      />
      {mode === 'breast' ? <BreastSection babyId={babyId} onDone={onDone} /> : null}
      {mode === 'bottle' ? <BottleSection babyId={babyId} onDone={onDone} /> : null}
    </ScrollView>
  );
}

/* ------------------------------- BREAST ------------------------------- */

function BreastSection({ babyId, onDone }: LogFormProps) {
  const feedSession = useTimersStore((s) => s.feedSession);
  const [input, setInput] = useState<BreastInput>('timer');

  if (feedSession) {
    return <BreastTimerActive />;
  }

  return (
    <View style={{ rowGap: 16 }}>
      <SegmentedControl<BreastInput>
        value={input}
        onChange={setInput}
        options={[
          { value: 'timer', label: 'Start timer' },
          { value: 'manual', label: 'Enter manually' },
        ]}
      />
      {input === 'timer' ? <BreastTimerStart /> : <BreastManual babyId={babyId} onDone={onDone} />}
    </View>
  );
}

function BreastTimerStart() {
  const startFeed = useTimersStore((s) => s.startFeed);
  const [side, setSide] = useState<'left' | 'right'>('left');
  return (
    <View style={{ rowGap: 16 }}>
      <Field label="Which side first?" hint="You can switch sides while the timer runs.">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Chip label="Left" selected={side === 'left'} onSelect={() => setSide('left')} color="peach" />
          </View>
          <View className="flex-1">
            <Chip label="Right" selected={side === 'right'} onSelect={() => setSide('right')} color="peach" />
          </View>
        </View>
      </Field>
      <Button
        size="lg"
        icon={Milk}
        label={`Start nursing (${side})`}
        onPress={() => {
          void tap();
          startFeed(side);
        }}
      />
    </View>
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
        <Text className="text-sm font-semibold uppercase tracking-wide text-peach">
          Nursing · {feedSession.currentSide} side{paused ? ' · paused' : ''}
        </Text>
        <LiveTimer sideStartedAt={feedSession.sideStartedAt} pausedAt={feedSession.pausedAt} />
        <Text className="text-center text-xs text-ink-soft">
          Session total across sides is saved when you finish.
        </Text>
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

function BreastManual({ babyId, onDone }: LogFormProps) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [side, setSide] = useState<FeedingSide>('left');
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (minutes === undefined || minutes <= 0) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      await createFeeding({
        id: `fed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        mode: 'breast',
        side,
        durationSeconds: Math.round(minutes * 60),
        note: note.trim() || undefined,
      });
      void success();
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
      <Field label="Side">
        <View className="flex-row gap-2">
          {(['left', 'right', 'both'] as const).map((s) => (
            <View key={s} className="flex-1">
              <Chip label={s[0].toUpperCase() + s.slice(1)} selected={side === s} onSelect={() => setSide(s)} color="peach" />
            </View>
          ))}
        </View>
      </Field>
      <Field label="Duration (minutes)">
        <NumberField value={minutes} onChangeValue={setMinutes} suffix="min" placeholder="e.g. 15" />
      </Field>
      <DateTimeField label="Started" value={timestamp} onChange={setTimestamp} />
      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <Button label="Save feed" icon={Milk} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}

/* ------------------------------- BOTTLE ------------------------------- */

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
      await createFeeding({
        id: `fed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        mode: 'bottle',
        amountMl: parseVolumeToMl(amountDisplay, volumeUnit),
        bottleType,
        note: note.trim() || undefined,
      });
      void success();
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
        hint={amountDisplay !== undefined ? formatVolumeMl(parseVolumeToMl(amountDisplay, volumeUnit), volumeUnit) : undefined}
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
              <Chip label={t.label} selected={bottleType === t.value} onSelect={() => setBottleType(t.value)} color="peach" />
            </View>
          ))}
        </View>
      </Field>
      <DateTimeField label="When" value={timestamp} onChange={setTimestamp} />
      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <Button label="Save feed" icon={Milk} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}
