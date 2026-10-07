import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { Calendar, Clock } from 'lucide-react-native';
import { formatDayLabel, mergeDateFromPicker, mergeTimeFromPicker } from '@/utils/datetime';

export interface DateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Optional label prefix; defaults to "When". */
  label?: string;
  /** Picker mode: "datetime" | "date" | "time". Defaults to "datetime". */
  mode?: 'datetime' | 'date' | 'time';
}

/**
 * Pressable row showing a formatted date/time.
 * - Renders consistent pill buttons for date and time across iOS and Android.
 * - On Android: launches native Material 3 dialog pickers.
 * - On iOS: launches a themed bottom sheet modal with native SwiftUI pickers.
 * - Preserves date when changing time, and preserves time when changing date.
 */
export function DateTimeField({
  value,
  onChange,
  label = 'When',
  mode = 'datetime',
}: DateTimeFieldProps) {
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const colorScheme = useColorScheme();

  const is24Hour = !new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions()
    .hour12;

  const dateText =
    mode === 'date'
      ? new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(value)
      : formatDayLabel(value.toISOString());

  const timeText = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);

  return (
    <View>
      <View className="min-h-[48px] flex-row items-center justify-between rounded-xl border border-line bg-card px-3 dark:border-[#38332B] dark:bg-[#26221D]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${mode === 'date' ? dateText : mode === 'time' ? timeText : `${dateText}, ${timeText}`}`}
          onPress={() => setActivePicker(mode === 'date' ? 'date' : 'time')}
          className="flex-1 py-3"
        >
          <Text className="text-base text-ink dark:text-[#EFEAE0]">{label}</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          {mode !== 'time' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date: ${dateText}`}
              onPress={() => setActivePicker('date')}
              className="flex-row items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-1.5 active:opacity-60 dark:bg-white/10"
            >
              <Calendar size={14} color="#8A8699" />
              <Text className="text-sm font-medium text-ink-soft dark:text-[#9C937F]">
                {dateText}
              </Text>
            </Pressable>
          ) : null}

          {mode !== 'date' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Time: ${timeText}`}
              onPress={() => setActivePicker('time')}
              className="flex-row items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-1.5 active:opacity-60 dark:bg-white/10"
            >
              <Clock size={14} color="#8A8699" />
              <Text className="text-sm font-medium text-ink-soft dark:text-[#9C937F]">
                {timeText}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Android Dialog Pickers */}
      {Platform.OS === 'android' && activePicker === 'date' && (
        <ExpoDateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          accentColor="#F0A47E"
          onValueChange={(_event, date) => {
            setActivePicker(null);
            if (date) {
              onChange(mergeDateFromPicker(value, date));
            }
          }}
          onDismiss={() => setActivePicker(null)}
        />
      )}

      {Platform.OS === 'android' && activePicker === 'time' && (
        <ExpoDateTimePicker
          value={value}
          mode="time"
          presentation="dialog"
          is24Hour={is24Hour}
          accentColor="#F0A47E"
          onValueChange={(_event, date) => {
            setActivePicker(null);
            if (date) {
              onChange(mergeTimeFromPicker(value, date));
            }
          }}
          onDismiss={() => setActivePicker(null)}
        />
      )}

      {/* iOS Modal Bottom Sheet */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={activePicker !== null}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
              accessibilityLabel="Dismiss picker"
              onPress={() => setActivePicker(null)}
            />
            <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
            <View className="rounded-t-3xl border-t border-line bg-[#FAF7F2] p-4 pb-9 dark:border-[#38332B] dark:bg-[#1E1B16]">
              <View className="mb-2 flex-row items-center justify-between border-b border-line pb-3 dark:border-[#38332B]">
                <Text className="text-base font-semibold text-ink dark:text-[#EFEAE0]">
                  {activePicker === 'date' ? 'Select date' : 'Select time'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  onPress={() => setActivePicker(null)}
                  className="rounded-full bg-peach/15 px-4 py-1.5 active:opacity-60 dark:bg-peach/25"
                >
                  <Text className="font-sans-bold text-sm text-peach dark:text-[#F5B495]" style={{ color: colorScheme === 'dark' ? '#F5B495' : '#C05B33' }}>Done</Text>
                </Pressable>
              </View>

              <View className="items-center justify-center py-2">
                {activePicker === 'date' ? (
                  <ExpoDateTimePicker
                    value={value}
                    mode="date"
                    display="inline"
                    accentColor="#F0A47E"
                    themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                    onValueChange={(_event, date) => {
                      if (date) {
                        onChange(mergeDateFromPicker(value, date));
                      }
                    }}
                  />
                ) : activePicker === 'time' ? (
                  <ExpoDateTimePicker
                    value={value}
                    mode="time"
                    display="spinner"
                    accentColor="#F0A47E"
                    themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                    onValueChange={(_event, date) => {
                      if (date) {
                        onChange(mergeTimeFromPicker(value, date));
                      }
                    }}
                  />
                ) : null}
              </View>
            </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
