import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { CalendarClock } from 'lucide-react-native';

interface DateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Optional label prefix; defaults to "When". */
  label?: string;
}

/**
 * Pressable row showing a formatted date/time. Opens the native picker:
 * SwiftUI inline on iOS (with a Done button); Material dialog on Android
 * (auto-dismisses on selection or cancel).
 */
export function DateTimeField({ value, onChange, label = 'When' }: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatted}`}
        onPress={() => setOpen((v) => !v)}
        className="min-h-[48px] flex-row items-center justify-between rounded-xl border border-line bg-card px-3 dark:border-[#35323F] dark:bg-[#26242F]"
      >
        <Text className="text-base text-ink dark:text-[#EDEBF4]">{label}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-ink-soft dark:text-[#9B97AB]">{formatted}</Text>
          <CalendarClock size={16} color="#8A8699" />
        </View>
      </Pressable>

      {open ? (
        <>
          <ExpoDateTimePicker
            value={value}
            mode="datetime"
            accentColor="#F0A47E"
            presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
            onValueChange={(_event, date) => {
              if (date) onChange(date);
              if (Platform.OS === 'android') setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done picking time"
              onPress={() => setOpen(false)}
              className="mt-1 self-end rounded-full bg-black/5 px-4 py-2 active:opacity-60 dark:bg-white/10"
            >
              <Text className="text-sm font-semibold text-ink-soft dark:text-[#9B97AB]">Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
