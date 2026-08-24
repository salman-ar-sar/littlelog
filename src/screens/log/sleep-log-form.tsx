import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Moon, Sunrise } from 'lucide-react-native';
import {
  Button,
  Chip,
  DateTimeField,
  Field,
  TextField,
} from '@/components/ui';
import { createSleep } from '@/db/sleep';
import type { SleepType } from '@/db/types';
import { useTimersStore } from '@/stores/timers';
import { error as hapticError, success, tap } from '@/utils/haptics';
import { LiveTimer } from './live-timer';
import type { LogFormProps } from './diaper-form';

type Input = 'timer' | 'manual';

export function classifySleep(startISO: string): SleepType {
  return new Date(startISO).getHours() < 19 ? 'nap' : 'night';
}

export function SleepLogForm({ babyId, onDone }: LogFormProps) {
  const activeSleep = useTimersStore((s) => s.activeSleep);
  const [input, setInput] = useState<Input>('timer');

  if (activeSleep) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
          <SleepRunning startedAt={activeSleep.startedAt} />
      </ScrollView>
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Chip
            label="⏱ Start timer"
            selected={input === 'timer'}
            onSelect={() => setInput('timer')}
            color="lavender"
          />
        </View>
        <View className="flex-1">
          <Chip
            label="📝 Past sleep"
            selected={input === 'manual'}
            onSelect={() => setInput('manual')}
            color="lavender"
          />
        </View>
      </View>

      {input === 'timer' ? <StartSleepCard /> : <ManualSleep babyId={babyId} onDone={onDone} />}
    </ScrollView>
  );
}

function StartSleepCard() {
  const startSleep = useTimersStore((s) => s.startSleep);
  const nowType = classifySleep(new Date().toISOString());
  return (
    <View className="items-center gap-4 rounded-2xl border border-lavender bg-lavender-soft p-8">
      <Text className="text-4xl">😴</Text>
      <Button
        size="lg"
        icon={Moon}
        label={`Start ${nowType === 'nap' ? 'nap' : 'night sleep'} timer`}
        onPress={() => {
          void tap();
          startSleep();
        }}
      />
      <Text className="text-center text-xs text-ink-soft dark:text-[#9C937F]">
        The timer keeps running even if you close the app.
      </Text>
    </View>
  );
}

function SleepRunning({ startedAt }: { startedAt: string }) {
  const stopSleep = useTimersStore((s) => s.stopSleep);
  const [stopping, setStopping] = useState(false);
  const startedEpoch = new Date(startedAt).getTime();

  return (
    <View className="items-center gap-5 rounded-2xl border border-lavender bg-lavender-soft p-8">
      <Text className="text-sm font-semibold uppercase tracking-wide text-lavender">
        Sleeping since{' '}
        {new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date(startedAt))}
      </Text>
      <LiveTimer sideStartedAt={startedEpoch} />
      <Button
        size="lg"
        icon={Sunrise}
        label="Wake up — save sleep"
        loading={stopping}
        onPress={() => {
          setStopping(true);
          void stopSleep()
            .then(() => success())
            .catch((e) => {
              void hapticError();
              console.warn('[sleep] stop failed:', e);
            })
            .finally(() => setStopping(false));
        }}
      />
    </View>
  );
}

function ManualSleep({ babyId, onDone }: LogFormProps) {
  const [start, setStart] = useState(() => new Date(Date.now() - 3_600_000));
  const [end, setEnd] = useState(() => new Date());
  const [type, setType] = useState<SleepType>(() =>
    classifySleep(new Date(Date.now() - 3_600_000).toISOString()),
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const reclassify = (nextStart: Date) => {
    setStart(nextStart);
    setType(classifySleep(nextStart.toISOString()));
  };

  const save = async () => {
    if (end.getTime() <= start.getTime()) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      await createSleep({
        id: `slp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type,
        note: note.trim() || undefined,
      });
      void success();
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[sleep] manual save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ rowGap: 16 }}>
      <DateTimeField label="Fell asleep at" value={start} onChange={reclassify} />
      <DateTimeField label="Woke up at" value={end} onChange={setEnd} />
      <Field label="Type" hint="Guessed from the time of day — tap to correct.">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Chip label="☀️ Nap" selected={type === 'nap'} onSelect={() => setType('nap')} color="lavender" />
          </View>
          <View className="flex-1">
            <Chip label="🌙 Night" selected={type === 'night'} onSelect={() => setType('night')} color="lavender" />
          </View>
        </View>
      </Field>
      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>
      <Button label="Save sleep" icon={Moon} onPress={() => void save()} loading={saving} size="lg" />
    </View>
  );
}
