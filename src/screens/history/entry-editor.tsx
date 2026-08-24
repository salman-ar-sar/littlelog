import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import {
  Button,
  Chip,
  DateTimeField,
  Field,
  NumberField,
  SectionTitle,
  TextField,
} from '@/components/ui';
import { listBaths, updateBath } from '@/db/baths';
import { listDiapers, updateDiaper } from '@/db/diapers';
import { listDoses, updateDose } from '@/db/doses';
import { listFeedings, updateFeeding } from '@/db/feedings';
import { listSleep, updateSleep } from '@/db/sleep';
import { listWeights, updateWeight } from '@/db/weights';
import type {
  BathEntry,
  DiaperEntry,
  FeedingEntry,
  MedicineDoseEntry,
  SleepEntry,
  WeightEntry,
} from '@/db/types';
import { parseWeightToGrams, weightToDisplay } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { error as hapticError, success } from '@/utils/haptics';
import type { TimelineItem } from '@/db/queries';

interface EntryEditorProps {
  babyId: string;
  entry: TimelineItem;
  onClose: () => void;
}

type Loaded =
  | { kind: 'feed'; feed: FeedingEntry }
  | { kind: 'sleep'; sleep: SleepEntry }
  | { kind: 'diaper'; diaper: DiaperEntry }
  | { kind: 'bath'; bath: BathEntry }
  | { kind: 'weight'; weight: WeightEntry }
  | { kind: 'dose'; dose: MedicineDoseEntry };

async function loadRaw(babyId: string, entry: TimelineItem): Promise<Loaded | null> {
  switch (entry.kind) {
    case 'feed': {
      const found = (await listFeedings(babyId)).find((f) => f.id === entry.id);
      return found ? { kind: 'feed', feed: found } : null;
    }
    case 'sleep': {
      const found = (await listSleep(babyId)).find((s) => s.id === entry.id);
      return found ? { kind: 'sleep', sleep: found } : null;
    }
    case 'diaper': {
      const found = (await listDiapers(babyId)).find((d) => d.id === entry.id);
      return found ? { kind: 'diaper', diaper: found } : null;
    }
    case 'bath': {
      const found = (await listBaths(babyId)).find((b) => b.id === entry.id);
      return found ? { kind: 'bath', bath: found } : null;
    }
    case 'weight': {
      const found = (await listWeights(babyId)).find((w) => w.id === entry.id);
      return found ? { kind: 'weight', weight: found } : null;
    }
    case 'dose': {
      const found = (await listDoses(babyId)).find((d) => d.id === entry.id);
      return found ? { kind: 'dose', dose: found } : null;
    }
  }
}

interface Draft {
  at?: Date;
  start?: Date;
  end?: Date;
  minutes?: number | undefined;
  amountMl?: number | undefined;
  amountDose?: number | undefined;
  weightDisplay?: number | undefined;
  wet?: boolean;
  dirty?: boolean;
  consistency?: string;
  sleepType?: 'nap' | 'night';
  note?: string;
}

function toDraft(loaded: Loaded, weightUnit: 'kg' | 'lb'): Draft {
  switch (loaded.kind) {
    case 'feed':
      return {
        at: new Date(loaded.feed.timestamp),
        minutes:
          loaded.feed.durationSeconds !== undefined
            ? loaded.feed.durationSeconds / 60
            : undefined,
        amountMl: loaded.feed.amountMl,
        note: loaded.feed.note ?? '',
      };
    case 'sleep':
      return {
        start: new Date(loaded.sleep.startTime),
        end: loaded.sleep.endTime ? new Date(loaded.sleep.endTime) : undefined,
        sleepType: loaded.sleep.type,
        note: loaded.sleep.note ?? '',
      };
    case 'diaper':
      return {
        at: new Date(loaded.diaper.timestamp),
        wet: loaded.diaper.wet,
        dirty: loaded.diaper.dirty,
        consistency: loaded.diaper.consistency ?? '',
        note: loaded.diaper.note ?? '',
      };
    case 'bath':
      return { at: new Date(loaded.bath.timestamp), note: loaded.bath.note ?? '' };
    case 'weight':
      return {
        at: new Date(loaded.weight.timestamp),
        weightDisplay: Math.round(weightToDisplay(loaded.weight.weightGrams, weightUnit) * 100) / 100,
        note: loaded.weight.note ?? '',
      };
    case 'dose':
      return {
        at: new Date(loaded.dose.timestamp),
        amountDose: loaded.dose.amount,
        note: loaded.dose.note ?? '',
      };
  }
}

async function persist(
  entry: TimelineItem,
  draft: Draft,
  weightUnit: 'kg' | 'lb',
): Promise<void> {
  const at = draft.at ?? new Date();
  const note = draft.note?.trim() ? draft.note.trim() : undefined;
  switch (entry.kind) {
    case 'feed':
      await updateFeeding(entry.id, {
        timestamp: at.toISOString(),
        durationSeconds: draft.minutes !== undefined ? Math.round(draft.minutes * 60) : undefined,
        amountMl: draft.amountMl,
        note,
      });
      break;
    case 'sleep':
      if (!draft.start || !draft.end) throw new Error('Start and end times are required');
      await updateSleep(entry.id, {
        startTime: draft.start.toISOString(),
        endTime: draft.end.toISOString(),
        type: draft.sleepType ?? 'nap',
        note,
      });
      break;
    case 'diaper':
      if (!draft.wet && !draft.dirty) throw new Error('Mark the diaper as wet or dirty');
      await updateDiaper(entry.id, {
        timestamp: at.toISOString(),
        wet: Boolean(draft.wet),
        dirty: Boolean(draft.dirty),
        consistency: draft.consistency?.trim() ? draft.consistency.trim() : undefined,
        note,
      });
      break;
    case 'bath':
      await updateBath(entry.id, { timestamp: at.toISOString(), note });
      break;
    case 'weight':
      if (draft.weightDisplay === undefined) throw new Error('Weight value is required');
      await updateWeight(entry.id, {
        timestamp: at.toISOString(),
        weightGrams: parseWeightToGrams(draft.weightDisplay, weightUnit),
        note,
      });
      break;
    case 'dose':
      if (draft.amountDose === undefined) throw new Error('Amount is required');
      await updateDose(entry.id, {
        timestamp: at.toISOString(),
        amount: draft.amountDose,
        note,
      });
      break;
  }
}

export function EntryEditor({ babyId, entry, onClose }: EntryEditorProps) {
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let alive = true;
    void loadRaw(babyId, entry)
      .then((loaded) => {
        if (!alive) return;
        setDraft(loaded ? toDraft(loaded, weightUnit) : null);
      })
      .catch(() => alive && setDraft(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId, entry.kind, entry.id]);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = async () => {
    if (!draft) return;
    try {
      await persist(entry, draft, weightUnit);
      void success();
      onClose();
    } catch (e) {
      void hapticError();
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-paper px-4 pt-14 dark:bg-[#1C1B22]">
        <SectionTitle>Edit entry</SectionTitle>
        {!draft ? (
          <Text className="text-sm text-ink-soft dark:text-[#9B97AB]">Loading…</Text>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
          >
            {entry.kind === 'sleep' && draft.start && draft.end ? (
              <>
                <DateTimeField label="Fell asleep at" value={draft.start} onChange={(start) => patch({ start })} />
                <DateTimeField label="Woke up at" value={draft.end} onChange={(end) => patch({ end })} />
                <Field label="Type">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Chip label="☀️ Nap" selected={draft.sleepType === 'nap'} onSelect={() => patch({ sleepType: 'nap' })} color="lavender" />
                    </View>
                    <View className="flex-1">
                      <Chip label="🌙 Night" selected={draft.sleepType === 'night'} onSelect={() => patch({ sleepType: 'night' })} color="lavender" />
                    </View>
                  </View>
                </Field>
              </>
            ) : null}

            {entry.kind === 'diaper' ? (
              <>
                <DateTimeField label="When" value={draft.at ?? new Date()} onChange={(at) => patch({ at })} />
                <Field label="Contents">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Chip label="💧 Wet" selected={Boolean(draft.wet)} onSelect={() => patch({ wet: !draft.wet })} color="mint" />
                    </View>
                    <View className="flex-1">
                      <Chip label="💩 Dirty" selected={Boolean(draft.dirty)} onSelect={() => patch({ dirty: !draft.dirty })} color="butter" />
                    </View>
                  </View>
                </Field>
                <Field label="Consistency">
                  <TextField value={draft.consistency ?? ''} onChangeText={(consistency) => patch({ consistency })} placeholder="Optional" />
                </Field>
              </>
            ) : null}

            {entry.kind === 'feed' ? (
              <>
                <DateTimeField label="When" value={draft.at ?? new Date()} onChange={(at) => patch({ at })} />
                {draft.minutes !== undefined ? (
                  <Field label="Duration (minutes)">
                    <NumberField value={draft.minutes} onChangeValue={(minutes) => patch({ minutes })} suffix="min" />
                  </Field>
                ) : (
                  <Field label="Amount (ml)">
                    <NumberField value={draft.amountMl} onChangeValue={(amountMl) => patch({ amountMl })} suffix="ml" />
                  </Field>
                )}
              </>
            ) : null}

            {entry.kind === 'weight' ? (
              <>
                <DateTimeField label="Measured" value={draft.at ?? new Date()} onChange={(at) => patch({ at })} />
                <Field label={`Weight (${weightUnit})`}>
                  <NumberField value={draft.weightDisplay} onChangeValue={(weightDisplay) => patch({ weightDisplay })} suffix={weightUnit} />
                </Field>
              </>
            ) : null}

            {entry.kind === 'dose' ? (
              <>
                <DateTimeField label="Given at" value={draft.at ?? new Date()} onChange={(at) => patch({ at })} />
                <Field label="Amount">
                  <NumberField value={draft.amountDose} onChangeValue={(amountDose) => patch({ amountDose })} />
                </Field>
              </>
            ) : null}

            {entry.kind === 'bath' ? (
              <DateTimeField label="When" value={draft.at ?? new Date()} onChange={(at) => patch({ at })} />
            ) : null}

            <Field label="Note">
              <TextField value={draft.note ?? ''} onChangeText={(note) => patch({ note })} placeholder="Optional" multiline />
            </Field>

            <View style={{ rowGap: 12 }}>
              <Button label="Save changes" onPress={() => void save()} size="lg" />
              <Button variant="ghost" label="Cancel" onPress={onClose} />
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
