import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Scale } from 'lucide-react-native';
import {
  Button,
  DateTimeField,
  Field,
  NumberField,
  TextField,
} from '@/components/ui';
import { createWeight } from '@/db/weights';
import { parseWeightToGrams } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { error as hapticError, success } from '@/utils/haptics';
import type { LogFormProps } from './diaper-form';

export function WeightLogForm({ babyId, onDone }: LogFormProps) {
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const [timestamp, setTimestamp] = useState(new Date());
  const [value, setValue] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (value === undefined) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      await createWeight({
        id: `wgt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        timestamp: timestamp.toISOString(),
        weightGrams: parseWeightToGrams(value, weightUnit),
        note: note.trim() || undefined,
      });
      void success();
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[weight] save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <Field label={`Weight (${weightUnit})`} hint="Stored precisely; displayed in your chosen unit.">
        <NumberField
          value={value}
          onChangeValue={setValue}
          suffix={weightUnit}
          placeholder="e.g. 5.4"
        />
      </Field>

      <DateTimeField label="Measured" value={timestamp} onChange={setTimestamp} />

      <Field label="Note (optional)" hint='e.g. "at pediatrician", "after feeding"'>
        <TextField value={note} onChangeText={setNote} placeholder="Optional" multiline />
      </Field>

      <Button label="Save weight" icon={Scale} onPress={() => void save()} loading={saving} size="lg" />
    </ScrollView>
  );
}
