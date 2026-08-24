import { create } from 'zustand';

interface ToastState {
  message: string | null;
  undo: (() => Promise<void> | void) | null;
  /** Monotonic id so stale timeouts never clear a newer toast. */
  seq: number;
  show: (message: string, undo?: () => Promise<void> | void) => void;
  dismiss: () => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  undo: null,
  seq: 0,
  show: (message, undo) => {
    counter += 1;
    const seq = counter;
    set({ message, undo, seq });
    setTimeout(() => {
      if (useToastStore.getState().seq === seq) {
        set({ message: null, undo: null });
      }
    }, 3000);
  },
  dismiss: () => set({ message: null, undo: null }),
}));
