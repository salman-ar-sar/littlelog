import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Bath } from 'lucide-react-native';
import {
  Button,
  DateTimeField,
  Field,
  TextField,
} from '@/components/ui';
import { createBath, deleteBath } from '@/db/baths';
import { useToastStore } from '@/stores/toast';
import { error as hapticError, success } from '@/utils/haptics';
import type { LogFormProps } from './diaper-form';

export function BathLogForm({ babyId, onDone }: LogFormProps) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const record = {
        id: `bth-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        note: note.trim() || undefined,
      } satisfies Parameters<typeof createBath>[0];
      await createBath(record);
      void success();
      useToastStore.getState().show('Bath logged', async () => {
        await deleteBath(record.id);
      });
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[bath] save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <DateTimeField label="When" value={timestamp} onChange={setTimestamp} />

      <Field label="Note (optional)" hint='e.g. "sponge bath", "full bath, lavender wash"'>
        <TextField value={note} onChangeText={setNote} placeholder="Product used, how it went…" multiline />
      </Field>

      <Button label="Log bath" icon={Bath} onPress={() => void save()} loading={saving} size="lg" />
    </ScrollView>
  );
}
