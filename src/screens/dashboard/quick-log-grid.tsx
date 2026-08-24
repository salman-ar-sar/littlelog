import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Baby,
  Bath as BathIcon,
  Milk,
  MoonStar,
  Pill,
  Scale,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Card, accentSoftBg, type AccentColor } from '@/components/ui';
import { useTodaySnapshot } from '@/db/queries';
import { formatRelative } from '@/utils/datetime';
import { formatWeight } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';

type TrackerType = 'feeding' | 'sleep' | 'diaper' | 'bath' | 'weight' | 'medicine';

interface QuickLogGridProps {
  babyId: string;
}

/** 2×3 grid of quick-log cards with live "last logged" summaries. */
export function QuickLogGrid({ babyId }: QuickLogGridProps) {
  const router = useRouter();
  const snapshot = useTodaySnapshot(babyId);

  const cards = CARDS.map((card) => ({
    ...card,
    summary: snapshot ? card.summarize(snapshot) : '…',
  }));

  return (
    <View className="flex-row flex-wrap justify-between">
      {cards.map((card) => (
        <Card
          key={card.type}
          onPress={() => router.push(`/log/${card.type}`)}
          accessibilityLabel={`Log ${card.title}. ${card.summary}`}
          className="mb-3 w-[48.5%] p-4"
        >
          <View className="flex-row items-center gap-2.5">
            <View className={`h-10 w-10 items-center justify-center rounded-full ${accentSoftBg[card.accent]}`}>
              <card.icon size={18} color={HEX[card.accent]} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-ink dark:text-[#EDEBF4]" numberOfLines={1}>
              {card.title}
            </Text>
          </View>
          <Text className="mt-2.5 text-xs text-ink-soft dark:text-[#9B97AB]" numberOfLines={1}>
            {card.summary}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const CARDS: {
  type: TrackerType;
  title: string;
  icon: LucideIcon;
  accent: AccentColor;
  summarize: (s: NonNullable<ReturnType<typeof useTodaySnapshot>>) => string;
}[] = [
  {
    type: 'feeding',
    title: 'Feeding',
    icon: Milk,
    accent: 'peach',
    summarize: (s) => {
      const bits: string[] = [`${s.feeds.count} feed${s.feeds.count === 1 ? '' : 's'} today`];
      if (s.feeds.totalMl > 0) bits.push(`${Math.round(s.feeds.totalMl)} ml`);
      if (s.lastFeedAt) return `${bits.join(' · ')} · last ${formatRelative(s.lastFeedAt)}`;
      return bits.join(' · ');
    },
  },
  {
    type: 'sleep',
    title: 'Sleep',
    icon: MoonStar,
    accent: 'lavender',
    summarize: (s) =>
      `${Math.floor(s.sleepTodaySeconds / 3600)}h ${Math.round((s.sleepTodaySeconds % 3600) / 60)}m today · ${s.napCount} nap${s.napCount === 1 ? '' : 's'}`,
  },
  {
    type: 'diaper',
    title: 'Diaper',
    icon: Baby,
    accent: 'mint',
    summarize: (s) => {
      const bits: string[] = [];
      if (s.diapers.wet) bits.push(`${s.diapers.wet} wet`);
      if (s.diapers.dirty) bits.push(`${s.diapers.dirty} dirty`);
      if (bits.length === 0) bits.push('No changes yet');
      if (s.diapers.lastChangeAt) bits.push(`last ${formatRelative(s.diapers.lastChangeAt)}`);
      return bits.join(' · ');
    },
  },
  {
    type: 'bath',
    title: 'Bath',
    icon: BathIcon,
    accent: 'sky',
    summarize: (s) => (s.lastBathAt ? `Last bath ${formatRelative(s.lastBathAt)}` : 'No baths logged'),
  },
  {
    type: 'weight',
    title: 'Weight',
    icon: Scale,
    accent: 'butter',
    summarize: (s) => weightSummary(s),
  },
  {
    type: 'medicine',
    title: 'Medicine',
    icon: Pill,
    accent: 'blush',
    summarize: (s) => `${s.dosesGivenToday} dose${s.dosesGivenToday === 1 ? '' : 's'} given today`,
  },
];

function weightSummary(s: NonNullable<ReturnType<typeof useTodaySnapshot>>): string {
  const unit = useSettingsStore.getState().weightUnit;
  if (s.lastWeightGrams === null) return 'No weights yet';
  const current = s.lastWeightGrams;
  if (s.prevWeightGrams !== null) {
    const delta = current - s.prevWeightGrams;
    const sign = delta >= 0 ? '+' : '−';
    return `${formatWeight(current, unit)} · ${sign}${Math.abs(Math.round(delta))}g`;
  }
  return `Last ${formatWeight(current, unit)}`;
}

// Source of truth for hex values: tailwind.config.js theme.extend.colors
const HEX: Record<AccentColor, string> = {
  blush: '#F2A7B3',
  peach: '#F0A47E',
  mint: '#79C4A4',
  sky: '#82B4DC',
  butter: '#EFC368',
  lavender: '#A99BD8',
};
