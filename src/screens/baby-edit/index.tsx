import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import {
  Avatar,
  Button,
  DateTimeField,
  Field,
  NumberField,
  Screen,
  SectionTitle,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { createBaby, deleteBaby, getBaby, updateBaby } from '@/db/babies';
import type { Sex } from '@/db/types';
import { parseWeightToGrams, weightToDisplay } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { useBabyStore } from '@/stores/babies';
import { error as hapticError, success } from '@/utils/haptics';

type Mode = { kind: 'create' } | { kind: 'edit'; id: string };

interface Draft {
  name: string;
  dob: Date;
  sex: Sex;
  photoUri?: string;
  birthWeightDisplay?: number;
}

const EMPTY_DRAFT: Draft = { name: '', dob: new Date(), sex: 'unspecified' };

export function BabyEditScreen() {
  const router = useRouter();
  const rawId = useLocalSearchParams<{ id?: string }>().id;
  const mode: Mode =
    !rawId || rawId === 'new' ? { kind: 'create' } : { kind: 'edit', id: String(rawId) };

  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const refreshBabies = useBabyStore((s) => s.refresh);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (mode.kind !== 'edit') return;
    let alive = true;
    void getBaby(mode.id)
      .then((baby) => {
        if (!alive) return;
        if (!baby) {
          setLoadError('Baby not found');
          return;
        }
        setDraft({
          name: baby.name,
          dob: new Date(baby.dateOfBirth),
          sex: baby.sex ?? 'unspecified',
          photoUri: baby.photoUri,
          birthWeightDisplay:
            baby.birthWeightGrams === undefined
              ? undefined
              : weightToDisplay(baby.birthWeightGrams, weightUnit),
        });
      })
      .catch(() => alive && setLoadError('Could not load profile'));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind === 'edit' ? mode.id : null]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library', 'Permission denied — cannot choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      patch({ photoUri: result.assets[0].uri });
    }
  };

  const save = async () => {
    if (!draft.name.trim()) {
      void hapticError();
      Alert.alert('Name required', 'Give your little one a name first.');
      return;
    }
    setSaving(true);
    try {
      const grams =
        draft.birthWeightDisplay === undefined
          ? undefined
          : parseWeightToGrams(draft.birthWeightDisplay, weightUnit);
      if (mode.kind === 'create') {
        await createBaby({
          id: `baby-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name: draft.name.trim(),
          photoUri: draft.photoUri,
          dateOfBirth: draft.dob.toISOString(),
          sex: draft.sex,
          birthWeightGrams: grams,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateBaby(mode.id, {
          name: draft.name.trim(),
          photoUri: draft.photoUri,
          dateOfBirth: draft.dob.toISOString(),
          sex: draft.sex,
          birthWeightGrams: grams,
        });
      }
      await refreshBabies();
      void success();
      router.back();
    } catch (e) {
      void hapticError();
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (mode.kind !== 'edit') return;
    Alert.alert(
      'Delete profile',
      `Delete ${draft.name.trim()}'s profile and all of their logs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteBaby(mode.id);
              await refreshBabies();
              router.back();
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 20, paddingBottom: 48 }}
      >
        <SectionTitle>
          {loadError ?? (mode.kind === 'create' ? 'Add baby' : 'Edit profile')}
        </SectionTitle>

        <View className="items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose profile photo"
            onPress={() => void pickPhoto()}
            className="active:opacity-70"
          >
            <Avatar uri={draft.photoUri} name={draft.name || 'New'} size={88} />
          </Pressable>
          <Button
            variant="ghost"
            size="sm"
            label={draft.photoUri ? 'Change photo' : 'Add photo'}
            onPress={() => void pickPhoto()}
          />
        </View>

        <Field label="Name">
          <TextField
            value={draft.name}
            onChangeText={(name) => patch({ name })}
            placeholder="e.g. Aanya"
          />
        </Field>

        <DateTimeField label="Date of birth" value={draft.dob} onChange={(dob) => patch({ dob })} />

        <Field label="Sex (optional)">
          <SegmentedControl<Sex>
            value={draft.sex}
            onChange={(sex) => patch({ sex })}
            options={[
              { value: 'female' as Sex, label: 'Girl' },
              { value: 'male' as Sex, label: 'Boy' },
              { value: 'unspecified' as Sex, label: 'Prefer not' },
            ]}
          />
        </Field>

        <Field
          label={`Birth weight (${weightUnit}, optional)`}
          hint="Shown as the first point on the growth chart."
        >
          <NumberField
            value={draft.birthWeightDisplay}
            onChangeValue={(birthWeightDisplay) => patch({ birthWeightDisplay })}
            suffix={weightUnit}
            placeholder="e.g. 3.2"
          />
        </Field>

        <View style={{ rowGap: 12 }}>
          <Button
            label={mode.kind === 'create' ? 'Add baby' : 'Save changes'}
            onPress={() => void save()}
            loading={saving}
            size="lg"
          />
          {mode.kind === 'edit' ? (
            <Button variant="danger" label="Delete profile" icon={Trash2} onPress={confirmDelete} />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
