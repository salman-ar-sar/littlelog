import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Pill, PlusCircle } from 'lucide-react-native';
import {
  Button,
  Chip,
  DateTimeField,
  EmptyState,
  Field,
  NumberField,
  TextField,
} from '@/components/ui';
import { listMedicines } from '@/db/medicines';
import { createDose } from '@/db/doses';
import type { Medicine } from '@/db/types';
import { error as hapticError, success } from '@/utils/haptics';
import type { LogFormProps } from './diaper-form';

export function DoseForm({ babyId, onDone }: LogFormProps) {
  const params = useLocalSearchParams<{ medicineId?: string }>();
  const preselect = typeof params.medicineId === 'string' ? params.medicineId : undefined;

  const [medicines, setMedicines] = useState<Medicine[] | null>(null);
  const [medicineId, setMedicineId] = useState<string | undefined>(preselect);
  const [timestamp, setTimestamp] = useState(new Date());
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void listMedicines(babyId)
      .then((list) => {
        if (!alive) return;
        setMedicines(list);
        const fallback = preselect ?? list[0]?.id;
        if (fallback && !list.some((m) => m.id === fallback)) {
          return;
        }
        setMedicineId(fallback);
        const med = list.find((m) => m.id === fallback);
        if (med) setAmount((a) => a ?? med.dosage);
      })
      .catch((e) => alive && console.warn('[dose] load failed:', e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const selectMedicine = (med: Medicine) => {
    setMedicineId(med.id);
    setAmount(med.dosage);
  };

  const save = async () => {
    const med = medicines?.find((m) => m.id === medicineId);
    if (!med || amount === undefined) {
      void hapticError();
      return;
    }
    setSaving(true);
    try {
      await createDose({
        id: `dos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        medicineId: med.id,
        timestamp: timestamp.toISOString(),
        amount,
        note: note.trim() || undefined,
      });
      void success();
      onDone();
    } catch (e) {
      void hapticError();
      console.warn('[dose] save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  if (medicines !== null && medicines.length === 0) {
    return (
      <View style={{ rowGap: 16 }}>
          <EmptyState
          icon={Pill}
          title="No medicines yet"
          message="Add a medicine with its dosage and schedule first — then logging a dose takes one tap."
          actionLabel="Open Medicines tab"
          onAction={onDone}
        />
      </View>
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
      <Field label="Medicine">
        <View className="flex-row flex-wrap gap-2">
          {(medicines ?? []).map((med) => (
            <Chip
              key={med.id}
              label={`${med.name} · ${med.dosage} ${med.unit}`}
              selected={med.id === medicineId}
              onSelect={() => selectMedicine(med)}
              color="blush"
            />
          ))}
        </View>
      </Field>

      <Field label="Amount given">
        <NumberField value={amount} onChangeValue={setAmount} placeholder="e.g. 0.6" />
      </Field>

      <DateTimeField label="Given at" value={timestamp} onChange={setTimestamp} />

      <Field label="Note (optional)">
        <TextField value={note} onChangeText={setNote} placeholder="e.g. with feed" multiline />
      </Field>

      <Button label="Mark as given" icon={PlusCircle} onPress={() => void save()} loading={saving} size="lg" />
    </ScrollView>
  );
}

