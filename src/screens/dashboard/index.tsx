import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Baby,
  Bath as BathIcon,
  Bell,
  Milk,
  MoonStar,
  Scale,
  Syringe,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import type { AccentColor } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import { useTodaySnapshot } from '@/db/queries';
import { formatRelative } from '@/utils/datetime';
import { ageShort, dayNumber } from '@/utils/age';
import { formatWeight } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';
import { SinceCard } from './since-card';
import { TodayTimeline } from './today-timeline';
import { LandingScreen } from './landing';
import { ActiveTimerBanners } from './timer-banners';

type Snapshot = ReturnType<typeof useTodaySnapshot>;

/** Seconds since last feed, re-ticked every 30s. Isolated from the tree. */
function useSinceLastFeed(lastFeedAt: string | null): number | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!lastFeedAt) return;
    const interval = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [lastFeedAt]);

  if (!lastFeedAt) return null;
  return Math.max(0, Math.round((nowMs - new Date(lastFeedAt).getTime()) / 1000));
}

/** Editorial dashboard — design 1 "Since-card". */
export function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const baby = useBabyStore((s) => s.babies.find((b) => b.id === s.activeBabyId));
  const snapshot = useTodaySnapshot(activeBabyId ?? '');
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const elapsed = useSinceLastFeed(snapshot?.lastFeed?.at ?? null);

  if (!activeBabyId) {
    return <LandingScreen />;
  }

  return (
    <View
      className="flex-1 bg-paper pt-[insets.top] dark:bg-[#1B1916]"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <View className="flex-row items-center pt-2">
          <Avatar uri={baby?.photoUri} name={baby?.name ?? '?'} size={40} />
          <View className="ml-3 flex-1">
            <Text className="font-sans-bold text-base text-ink dark:text-[#EFEAE0]">
              {baby?.name ?? 'LittleLog'}
            </Text>
            {baby ? (
              <Text className="text-xs text-ink-soft dark:text-[#9C937F]">
                {ageShort(baby.dateOfBirth)} · day {dayNumber(baby.dateOfBirth)}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reminders and medicines"
            onPress={() => router.push('/(tabs)/medicines')}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-card active:opacity-70 dark:border-[#38332B] dark:bg-[#26221D]"
          >
            <Bell size={17} color="#262019" />
          </Pressable>
        </View>

        <View className="mt-4">
          <ActiveTimerBanners />
        </View>

        <View className="mt-2">
          <SinceCard
            lastFeed={snapshot?.lastFeed ?? null}
            elapsedSeconds={elapsed}
            sleptTodaySeconds={snapshot?.sleepTodaySeconds ?? 0}
            nappyCount={snapshot?.diapers.changes ?? 0}
            weightKg={snapshot?.lastWeightGrams ?? null}
          />
        </View>

        <Text className="mb-2 mt-6 text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
          Quick log
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {TILES.map((tile) => (
            <Tile
              key={tile.type}
              tile={tile}
              snapshot={snapshot}
              weightUnit={weightUnit}
              onPress={() => router.push(`/log/${tile.type}`)}
            />
          ))}
        </View>

        <View className="mb-1 mt-6 flex-row items-baseline justify-between">
          <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
            Today
          </Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/(tabs)/history')}>
            <Text className="font-sans-semibold text-sm text-peach">All entries</Text>
          </Pressable>
        </View>
        <TodayTimeline babyId={activeBabyId} />
      </ScrollView>
    </View>
  );
}

type TileType = 'feeding' | 'sleep' | 'diaper' | 'bath' | 'weight' | 'medicine';

interface TileDef {
  type: TileType;
  label: string;
  icon: LucideIcon;
  accent: AccentColor;
}

const TILES: TileDef[] = [
  { type: 'feeding', label: 'Feed', icon: Milk, accent: 'peach' },
  { type: 'sleep', label: 'Sleep', icon: MoonStar, accent: 'lavender' },
  { type: 'diaper', label: 'Nappy', icon: Baby, accent: 'mint' },
  { type: 'bath', label: 'Bath', icon: BathIcon, accent: 'sky' },
  { type: 'weight', label: 'Weight', icon: Scale, accent: 'butter' },
  { type: 'medicine', label: 'Medicine', icon: Syringe, accent: 'blush' },
];

// Hex mirrors of tailwind tokens (source of truth: tailwind.config.js)
const HEX: Record<AccentColor, string> = {
  blush: '#6E4E75',
  peach: '#C05B33',
  mint: '#7D8F69',
  sky: '#C9A13B',
  butter: '#C4888C',
  lavender: '#5C7FA3',
};

const SOFT: Record<AccentColor, string> = {
  blush: '#EFE7F0',
  peach: '#F5E4DB',
  mint: '#E9EDDF',
  sky: '#F3EBD4',
  butter: '#F4E5E6',
  lavender: '#E2E9F0',
};

function Tile({
  tile,
  snapshot,
  weightUnit,
  onPress,
}: {
  tile: TileDef;
  snapshot: Snapshot;
  weightUnit: 'kg' | 'lb';
  onPress: () => void;
}) {
  const Icon = tile.icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Log ${tile.label}`}
      onPress={onPress}
      className="mb-3 w-[31.5%] rounded-xl border border-line bg-card p-3 active:opacity-80 dark:border-[#38332B] dark:bg-[#26221D]"
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: SOFT[tile.accent] }}
      >
        <Icon size={16} color={HEX[tile.accent]} />
      </View>
      <Text className="mt-2 font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">
        {tile.label}
      </Text>
      <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]" numberOfLines={1}>
        {tileSub(tile, snapshot, weightUnit)}
      </Text>
    </Pressable>
  );
}

function tileSub(tile: TileDef, snapshot: Snapshot, unit: 'kg' | 'lb'): string {
  if (!snapshot) return '…';
  switch (tile.type) {
    case 'feeding':
      return snapshot.lastFeed ? formatRelative(snapshot.lastFeed.at) : 'tap to log';
    case 'sleep':
      return snapshot.sleepTodaySeconds > 0
        ? `${Math.floor(snapshot.sleepTodaySeconds / 3600)}h ${Math.round(
            (snapshot.sleepTodaySeconds % 3600) / 60,
          )}m today`
        : 'tap to start';
    case 'diaper':
      return snapshot.diapers.lastChangeAt
        ? formatRelative(snapshot.diapers.lastChangeAt)
        : 'tap to log';
    case 'bath':
      return snapshot.lastBathAt ? formatRelative(snapshot.lastBathAt) : 'tap to log';
    case 'weight':
      return snapshot.lastWeightGrams !== null
        ? formatWeight(snapshot.lastWeightGrams, unit)
        : 'tap to log';
    case 'medicine':
      return snapshot.dosesGivenToday > 0 ? `${snapshot.dosesGivenToday} given today` : 'due today';
  }
}
