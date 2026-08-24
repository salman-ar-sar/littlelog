import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Baby } from 'lucide-react-native';
import {
  Button,
  Chip,
  DateTimeField,
  Field,
  TextField,
} from '@/components/ui';
import { createDiaper, deleteDiaper } from '@/db/diapers';
import { useToastStore } from '@/stores/toast';
import { error as hapticError, success, tap } from '@/utils/haptics';

export interface LogFormProps {
  babyId: string;
  onDone: () => void;
}

export function DiaperLogForm({ babyId, onDone }: LogFormProps) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [wet, setWet] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [consistency, setConsistency] = useState('');
  const [note, setNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const pick = (which: 'wet' | 'dirty') => {
    void tap();
    if (which === 'wet') {
      setWet(!wet);
      if (!wet) setDirty(false);
    } else {
      setDirty(!dirty);
    }
  };

  const save = async () => {
    if (!wet && !dirty) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      const record = {
        id: `dia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        wet,
        dirty,
        consistency: dirty && consistency.trim() ? consistency.trim() : undefined,
        note: note.trim() || undefined,
      } satisfies Parameters<typeof createDiaper>[0];
      await createDiaper(record);
      void success();
      useToastStore.getState().show('Nappy logged', async () => {
        await deleteDiaper(record.id);
      });
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[diaper] save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  void router; // reserved for deep-link context

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <Field label="What was in it?" hint="Defaults to wet — tap save to log instantly.">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Chip label="💧 Wet" selected={wet} onSelect={() => pick('wet')} color="mint" />
          </View>
          <View className="flex-1">
            <Chip label="💩 Dirty" selected={dirty} onSelect={() => pick('dirty')} color="butter" />
          </View>
        </View>
      </Field>

      <DateTimeField label="When" value={timestamp} onChange={setTimestamp} />

      <Button
        variant="ghost"
        size="sm"
        label={showDetails ? 'Hide details' : 'Add details (optional)'}
        onPress={() => setShowDetails((v) => !v)}
      />

      {showDetails ? (
        <View style={{ rowGap: 16 }}>
          {dirty ? (
            <Field label="Color / consistency" hint='e.g. "seedy", "green", "formed"'>
              <TextField
                value={consistency}
                onChangeText={setConsistency}
                placeholder="Optional"
              />
            </Field>
          ) : null}
          <Field label="Note">
            <TextField
              value={note}
              onChangeText={setNote}
              placeholder="e.g. rash cream applied"
              multiline
            />
          </Field>
        </View>
      ) : null}

      <Button label="Save change" icon={Baby} onPress={() => void save()} loading={saving} size="lg" />
    </ScrollView>
  );
}
