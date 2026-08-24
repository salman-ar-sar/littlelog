import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function available(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** Light impact — quick taps, chip selection. */
export async function tap(): Promise<void> {
  if (!available()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no haptics on this device — ignore
  }
}

/** Success notification — entry saved / timer finished. */
export async function success(): Promise<void> {
  if (!available()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

/** Error notification — validation failed. */
export async function error(): Promise<void> {
  if (!available()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // ignore
  }
}
