import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createFeeding } from '../db/feedings';
import { createSleep } from '../db/sleep';
import type { FeedingSide } from '../db/types';
import { useBabyStore } from './babies';

type FeedSession = {
  startedAt: string; // ISO — session start, used as entry timestamp
  segments: { side: FeedingSide; seconds: number }[];
  currentSide: Exclude<FeedingSide, 'both'>;
  sideStartedAt: number; // epoch ms
  pausedAt: number | null; // epoch ms when paused; null = running
};

type TimersState = {
  activeSleep: { startedAt: string } | null;
  feedSession: FeedSession | null;

  startSleep: () => void;
  stopSleep: () => Promise<void>;
  startFeed: (side: Exclude<FeedingSide, 'both'>) => void;
  switchFeedSide: () => void;
  togglePauseFeed: () => void;
  finishFeed: (opts?: { manualDurationSeconds?: number }) => Promise<void>;
};

// Local UUID helper (avoid extra dep): timestamp + random.
function newId(): string {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useTimersStore = create<TimersState>()(
  persist(
    (set, get) => ({
      activeSleep: null,
      feedSession: null,

      startSleep: () => {
        if (get().activeSleep) return;
        set({ activeSleep: { startedAt: new Date().toISOString() } });
      },

      stopSleep: async () => {
        const { activeSleep } = get();
        if (!activeSleep) return;
        set({ activeSleep: null }); // clear first to prevent double-stop
        const babyId = useBabyStore.getState().activeBabyId;
        if (!babyId) return;
        const startHour = new Date(activeSleep.startedAt).getHours();
        await createSleep({
          id: newId(),
          babyId,
          startTime: activeSleep.startedAt,
          endTime: new Date().toISOString(),
          type: startHour < 19 ? 'nap' : 'night',
        });
      },

      startFeed: (side) => {
        if (get().feedSession) return;
        set({
          feedSession: {
            startedAt: new Date().toISOString(),
            segments: [],
            currentSide: side,
            sideStartedAt: Date.now(),
            pausedAt: null,
          },
        });
      },

      switchFeedSide: () => {
        const session = get().feedSession;
        if (!session || session.pausedAt) return;
        const elapsed = Math.round((Date.now() - session.sideStartedAt) / 1000);
        set({
          feedSession: {
            ...session,
            segments: [...session.segments, { side: session.currentSide, seconds: elapsed }],
            currentSide: session.currentSide === 'left' ? 'right' : 'left',
            sideStartedAt: Date.now(),
          },
        });
      },

      togglePauseFeed: () => {
        const session = get().feedSession;
        if (!session) return;
        if (session.pausedAt === null) {
          const banked = Math.round((Date.now() - session.sideStartedAt) / 1000);
          set({
            feedSession: {
              ...session,
              segments: [...session.segments, { side: session.currentSide, seconds: banked }],
              pausedAt: Date.now(),
            },
          });
        } else {
          set({ feedSession: { ...session, pausedAt: null, sideStartedAt: Date.now() } });
        }
      },

      finishFeed: async (opts) => {
        const session = get().feedSession;
        if (!session) return;
        set({ feedSession: null }); // clear first to prevent double-finish

        let totalSeconds = opts?.manualDurationSeconds ?? 0;
        if (totalSeconds === 0) {
          totalSeconds = session.segments.reduce((sum, s) => sum + s.seconds, 0);
          if (session.pausedAt === null && !opts?.manualDurationSeconds) {
            totalSeconds += Math.round((Date.now() - session.sideStartedAt) / 1000);
          }
        }

        const sides = new Set<FeedingSide>([
          ...session.segments.map((s) => s.side),
          ...(totalSeconds > 0 || session.segments.length === 0 ? [session.currentSide] : []),
        ]);
        const side: FeedingSide =
          sides.size === 2 ? 'both' : sides.values().next().value ?? session.currentSide;

        const babyId = useBabyStore.getState().activeBabyId;
        if (!babyId) return;
        await createFeeding({
          id: newId(),
          babyId,
          timestamp: session.startedAt,
          mode: 'breast',
          side,
          durationSeconds: totalSeconds,
        });
      },
    }),
    {
      name: 'littlelog-timers',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeSleep: state.activeSleep,
        feedSession: state.feedSession,
      }),
    },
  ),
);

export type { FeedSession };
