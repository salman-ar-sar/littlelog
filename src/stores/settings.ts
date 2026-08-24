import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VolumeUnit, WeightUnit } from '../utils/units';

type SettingsState = {
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  remindersEnabled: boolean;
  setWeightUnit: (u: WeightUnit) => void;
  setVolumeUnit: (u: VolumeUnit) => void;
  setRemindersEnabled: (b: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: 'kg',
      volumeUnit: 'ml',
      remindersEnabled: true,
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setVolumeUnit: (volumeUnit) => set({ volumeUnit }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
    }),
    {
      name: 'littlelog-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
