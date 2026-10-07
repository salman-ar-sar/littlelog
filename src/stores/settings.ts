import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VolumeUnit, WeightUnit } from '../utils/units';

type SettingsState = {
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  remindersEnabled: boolean;
  nightfeedMode: boolean;
  hapticConfirm: boolean;
  defaultFeedDurationMinutes: number;
  setWeightUnit: (u: WeightUnit) => void;
  setVolumeUnit: (u: VolumeUnit) => void;
  setRemindersEnabled: (b: boolean) => void;
  setNightfeedMode: (b: boolean) => void;
  setHapticConfirm: (b: boolean) => void;
  setDefaultFeedDurationMinutes: (m: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: 'kg',
      volumeUnit: 'ml',
      remindersEnabled: true,
      nightfeedMode: false,
      hapticConfirm: true,
      defaultFeedDurationMinutes: 18,
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setVolumeUnit: (volumeUnit) => set({ volumeUnit }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      setNightfeedMode: (nightfeedMode) => set({ nightfeedMode }),
      setHapticConfirm: (hapticConfirm) => set({ hapticConfirm }),
      setDefaultFeedDurationMinutes: (defaultFeedDurationMinutes) =>
        set({ defaultFeedDurationMinutes }),
    }),
    {
      name: 'littlelog-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
