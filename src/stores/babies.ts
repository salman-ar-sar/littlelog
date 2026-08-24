import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listBabies } from '../db/babies';
import type { Baby } from '../db/types';

type BabyState = {
  babies: Baby[];
  loaded: boolean;
  activeBabyId: string | null;
  setActiveBaby: (id: string) => void;
  refresh: () => Promise<void>;
};

export const useBabyStore = create<BabyState>()(
  persist(
    (set, get) => ({
      babies: [],
      loaded: false,
      activeBabyId: null,

      setActiveBaby: (id) => set({ activeBabyId: id }),

      refresh: async () => {
        const babies = await listBabies();
        const { activeBabyId } = get();
        const stillValid = babies.some((b) => b.id === activeBabyId);
        set({
          babies,
          loaded: true,
          activeBabyId: stillValid ? activeBabyId : (babies[0]?.id ?? null),
        });
      },
    }),
    {
      name: 'littlelog-babies',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeBabyId: state.activeBabyId }),
    },
  ),
);

/** Convenience selector — the active baby object or undefined. */
export function useActiveBaby(): Baby | undefined {
  return useBabyStore((s) => s.babies.find((b) => b.id === s.activeBabyId));
}
