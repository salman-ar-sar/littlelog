import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlarmClock, Pencil, Pill, PlusCircle, Trash2 } from 'lucide-react-native';
import { Button, Card, EmptyState, Screen, SectionTitle, Chip } from '@/components/ui';
import { useDbQuery } from '@/db/queries';
import { listMedicines, deleteMedicine } from '@/db/medicines';
import { listDoses } from '@/db/doses';
import type { Medicine } from '@/db/types';
import { formatDayLabel, formatTime } from '@/utils/datetime';
import { tap } from '@/utils/haptics';
import { cancelMedicineReminder } from '@/notifications';
import { MedicineEditor } from './medicine-editor';

export function MedicinesScreen({ babyId }: { babyId: string }) {
  const router = useRouter();
  const medicines = useDbQuery(`medicines:${babyId}`, () => listMedicines(babyId));
  const doses = useDbQuery(`doses:${babyId}`, () => listDoses(babyId));
  const [editingMed, setEditingMed] = useState<Medicine | 'new' | null>(null);

  const dosesTodayCount = (medicineId: string) =>
    (doses ?? []).filter((d) => sameLocalDay(d.timestamp) && d.medicineId === medicineId).length;

  const confirmDelete = (med: Medicine) => {
    void tap();
    Alert.alert(
      'Delete medicine',
      `Delete ${med.name} and its dose history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await cancelMedicineReminder(med.id);
              await deleteMedicine(med.id);
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <FlatList
        data={doses ?? []}
        keyExtractor={(dose) => dose.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ rowGap: 16 }}>
            <View style={{ height: 12 }} />
            <View className="flex-row items-center justify-between">
              <SectionTitle>Medicines</SectionTitle>
              <Button
                size="sm"
                label="Add medicine"
                icon={PlusCircle}
                onPress={() => setEditingMed('new')}
              />
            </View>

            {!medicines ? (
              <Text className="text-sm text-ink-soft dark:text-[#9B97AB]">Loading…</Text>
            ) : medicines.length === 0 ? (
              <EmptyState
                icon={AlarmClock}
                title="No medicines yet"
                message='Add a medicine with its dosage — then "Log a dose" is one tap from the dashboard.'
              />
            ) : (
              <View style={{ rowGap: 10 }}>
                {medicines.map((med) => {
                  const todayCount = dosesTodayCount(med.id);
                  return (
                    <Card key={med.id} className="p-4">
                      <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-ink dark:text-[#EDEBF4]">
                            {med.name}
                          </Text>
                          <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9B97AB]">
                            {med.dosage} {med.unit} · {med.form}
                            {todayCount > 0 ? ` · ${todayCount} given today` : ''}
                          </Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${med.name}`}
                          onPress={() => setEditingMed(med)}
                          className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
                        >
                          <Pencil size={16} color="#8A8699" />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${med.name}`}
                          onPress={() => confirmDelete(med)}
                          className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
                        >
                          <Trash2 size={16} color="#F2A7B3" />
                        </Pressable>
                      </View>

                      {(med.reminderTimes?.length ?? 0) > 0 ? (
                        <View className="mt-3 flex-row flex-wrap gap-2">
                          {med.reminderTimes!.map((time) => (
                            <Chip key={time} label={`⏰ ${time}`} selected color="blush" />
                          ))}
                        </View>
                      ) : null}

                      <Button
                        variant="secondary"
                        size="sm"
                        label="Log a dose"
                        className="mt-3 self-start px-6"
                        icon={PlusCircle}
                        onPress={() => router.push(`/log/medicine?medicineId=${med.id}`)}
                      />
                    </Card>
                  );
                })}
              </View>
            )}

            <SectionTitle>Recent doses</SectionTitle>
          </View>
        }
        renderItem={({ item: dose }) => {
          const medName =
            (medicines ?? []).find((m) => m.id === dose.medicineId)?.name ?? 'Medicine';
          return (
            <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 dark:border-[#35323F] dark:bg-[#26242F]">
              <Pill size={16} color="#F2A7B3" />
              <Text className="flex-1 text-sm text-ink dark:text-[#EDEBF4]" numberOfLines={1}>
                {medName} · {dose.amount}
                {dose.note ? ` · ${dose.note}` : ''}
              </Text>
              <Text className="text-xs text-ink-soft dark:text-[#9B97AB]">
                {formatDayLabel(dose.timestamp)} {formatTime(dose.timestamp)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          medicines && medicines.length > 0 ? (
            <Text className="text-sm text-ink-soft dark:text-[#9B97AB]">
              No doses logged yet.
            </Text>
          ) : null
        }
      />

      {editingMed ? (
        <MedicineEditor babyId={babyId} medicine={editingMed === 'new' ? null : editingMed} onClose={() => setEditingMed(null)} />
      ) : null}
    </Screen>
  );
}

function sameLocalDay(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
