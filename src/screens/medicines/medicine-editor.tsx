import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { X } from 'lucide-react-native';
import {
  Button,
  Field,
  NumberField,
  Screen,
  SegmentedControl,
  TextField,
  Chip,
} from '@/components/ui';
import type { Medicine } from '@/db/types';
import { createMedicine, updateMedicine } from '@/db/medicines';
import { saveMedicineSchedule } from '@/notifications';
import { useSettingsStore } from '@/stores/settings';
import { error as hapticError, success } from '@/utils/haptics';

type Form = 'drops' | 'syrup' | 'tablet';

const PRESETS = [
  { value: 'none', label: 'No reminders' },
  { value: 'every_6h', label: 'Every 6h' },
  { value: 'every_8h', label: 'Every 8h' },
  { value: 'custom', label: 'Custom times' },
] as const;

type Preset = (typeof PRESETS)[number]['value'];

const PRESET_TIMES: Record<'every_6h' | 'every_8h', string[]> = {
  every_6h: ['06:00', '12:00', '18:00', '00:00'],
  every_8h: ['08:00', '16:00', '00:00'],
};

interface Props {
  babyId: string;
  /** null → creating a new medicine */
  medicine: Medicine | null;
  onClose: () => void;
}

export function MedicineEditor({ babyId, medicine, onClose }: Props) {
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);

  const [name, setName] = useState(medicine?.name ?? '');
  const [dosage, setDosage] = useState<number | undefined>(medicine?.dosage);
  const [unit, setUnit] = useState(medicine?.unit ?? 'ml');
  const [form, setForm] = useState<Form>(medicine?.form ?? 'syrup');
  const [preset, setPreset] = useState<Preset>(
    !medicine?.reminderTimes?.length
      ? 'none'
      : isPresetTimes(medicine.reminderTimes) ?? 'custom',
  );
  const [customTimes, setCustomTimes] = useState<string[]>(medicine?.reminderTimes ?? []);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const times: string[] =
    preset === 'every_6h' || preset === 'every_8h'
      ? PRESET_TIMES[preset]
      : preset === 'none'
        ? []
        : customTimes;

  const addTime = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const value = `${hh}:${mm}`;
    if (!customTimes.includes(value)) {
      setCustomTimes([...customTimes, value].sort());
    }
  };

  const removeTime = (t: string) => {
    if (preset !== 'custom') {
      setPreset('custom');
      setCustomTimes(times.filter((x) => x !== t));
      return;
    }
    setCustomTimes(customTimes.filter((x) => x !== t));
  };

  const save = async () => {
    if (!name.trim() || dosage === undefined || dosage <= 0 || !unit.trim()) {
      void hapticError();
      Alert.alert('Missing details', 'Name, dose amount and unit are required.');
      return;
    }
    setSaving(true);
    try {
      const record = {
        id: medicine?.id ?? `med-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        babyId,
        name: name.trim(),
        dosage,
        unit: unit.trim(),
        form,
        reminderTimes: remindersEnabled && preset !== 'none' ? times : [],
      };
      if (medicine) {
        await updateMedicine(medicine.id, record);
      } else {
        await createMedicine(record);
      }
      if (remindersEnabled && times.length > 0) {
        const ok = await saveMedicineSchedule(record, times);
        if (!ok && !medicine) {
          Alert.alert(
            'Reminders',
            'Notification permission was denied, so the medicine was saved without reminders.',
          );
        }
      }
      void success();
      onClose();
    } catch (e) {
      void hapticError();
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Screen>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-ink dark:text-[#EFEAE0]">
            {medicine ? 'Edit medicine' : 'Add medicine'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/5 active:opacity-60 dark:bg-white/10"
          >
            <X size={18} color="#8A8699" />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
          <Field label="Name">
            <TextField value={name} onChangeText={setName} placeholder="e.g. Vitamin D drops" />
          </Field>

          <Field label="Dose">
            <View className="flex-row gap-2">
              <View className="flex-[2]">
                <NumberField value={dosage} onChangeValue={setDosage} placeholder="e.g. 0.5" />
              </View>
              <View className="flex-1">
                <TextField value={unit} onChangeText={(text) => setUnit(text)} placeholder="ml / mg / drop" />
              </View>
            </View>
          </Field>

          <Field label="Form">
            <SegmentedControl<Form>
              value={form}
              onChange={setForm}
              options={[
                { value: 'drops' as Form, label: '💧 Drops' },
                { value: 'syrup' as Form, label: '🥄 Syrup' },
                { value: 'tablet' as Form, label: '💊 Tablet' },
              ]}
            />
          </Field>

          <Field
            label="Reminders"
            hint={
              remindersEnabled
                ? 'Daily local notifications. Tap a time chip to remove it.'
                : 'Reminders are off in Settings.'
            }
          >
            <SegmentedControl<Preset>
              value={preset}
              onChange={setPreset}
              options={PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Field>

          {(preset === 'custom' || preset.startsWith('every')) && times.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {times.map((t) => (
                <Chip key={t} label={`⏰ ${t}`} selected onSelect={() => removeTime(t)} color="blush" />
              ))}
            </View>
          ) : null}

          {preset === 'custom' ? (
            <Button
              variant="ghost"
              size="sm"
              label="+ Add time"
              onPress={() => setTimePickerOpen(true)}
            />
          ) : null}

          {timePickerOpen && Platform.OS !== 'web' ? (
            <>
              <ExpoDateTimePicker
                value={new Date()}
                mode="time"
                accentColor="#F2A7B3"
                presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
                onValueChange={(_event, date) => {
                  if (Platform.OS === 'android') setTimePickerOpen(false);
                  if (date) addTime(date);
                }}
                onDismiss={() => setTimePickerOpen(false)}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done adding times"
                  onPress={() => setTimePickerOpen(false)}
                  className="mt-1 self-end rounded-full bg-black/5 px-4 py-2 active:opacity-60 dark:bg-white/10"
                >
                  <Text className="text-sm font-semibold text-ink-soft dark:text-[#9C937F]">Done</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          <Button
            label={medicine ? 'Save changes' : 'Add medicine'}
            size="lg"
            loading={saving}
            onPress={() => void save()}
          />
        </ScrollView>
      </Screen>
    </Modal>
  );
}

function isPresetTimes(times: string[]): Preset | null {
  for (const key of ['every_6h', 'every_8h'] as const) {
    const presetSet = [...PRESET_TIMES[key]].sort().join(',');
    if ([...times].sort().join(',') === presetSet) return key;
  }
  return null;
}
