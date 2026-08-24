import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medicine } from '@/db/types';
import { updateMedicine } from '@/db/medicines';

const CHANNEL_ID = 'medicine-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for notification permission only when the user enables a reminder.
 * Returns false when denied — callers must degrade gracefully (disable UI).
 */
export async function requestPermissionGracefully(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medicine reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function parseHHMM(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':');
  return { hour: Number(h), minute: Number(m) };
}

/**
 * Schedule (replacing previous ones) all daily reminders for a medicine.
 * Persists reminderTimes on the record so they can be re-created after reboot
 * of the schedule list UI. Returns true on success.
 */
export async function saveMedicineSchedule(
  medicine: Medicine,
  times: string[],
): Promise<boolean> {
  await updateMedicine(medicine.id, { reminderTimes: times });
  await cancelMedicineReminder(medicine.id);
  if (times.length === 0) return true;

  const granted = await requestPermissionGracefully();
  if (!granted) {
    // Keep times saved but unscheduled; settings UI shows reminders disabled.
    return false;
  }
  await ensureChannel();
  for (const time of times) {
    const { hour, minute } = parseHHMM(time);
    await Notifications.scheduleNotificationAsync({
      identifier: `med-${medicine.id}-${time}`,
      content: {
        title: `⏰ ${medicine.name} time`,
        body: `Time for ${medicine.dosage} ${medicine.unit} of ${medicine.name}. Tap to mark as given.`,
        sound: false,
        data: {
          url: `/log/medicine?medicineId=${medicine.id}`,
          medicineId: medicine.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
        channelId: CHANNEL_ID,
      },
    });
  }
  return true;
}

/** Remove every scheduled notification belonging to this medicine. */
export async function cancelMedicineReminder(medicineId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `med-${medicineId}-`;
  for (const n of scheduled) {
    if (n.identifier.startsWith(prefix)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
