import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import {
  Bath as BathIcon,
  Baby,
  Milk,
  MoonStar,
  Pill,
  Scale,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { TimelineItem, TimelineKind } from '@/db/queries';
import { useTimelineDay } from '@/db/queries';
import { localDayStartISO, formatTime } from '@/utils/datetime';

const KIND_META: Record<TimelineKind, { icon: LucideIcon; hex: string }> = {
  feed: { icon: Milk, hex: '#F0A47E' },
  sleep: { icon: MoonStar, hex: '#A99BD8' },
  diaper: { icon: Baby, hex: '#79C4A4' },
  bath: { icon: BathIcon, hex: '#82B4DC' },
  weight: { icon: Scale, hex: '#EFC368' },
  dose: { icon: Pill, hex: '#F2A7B3' },
};

interface Row {
  key: string;
  hour?: string;
  item?: TimelineItem;
}

/** "Today" timeline, grouped by hour, virtualized via FlatList. */
export function TodayTimeline({ babyId }: { babyId: string }) {
  const items = useTimelineDay(babyId, localDayStartISO());

  const rows: Row[] = useMemo(() => {
    if (!items) return [];
    const out: Row[] = [];
    let lastHour: string | null = null;
    for (const item of items) {
      const date = new Date(item.at);
      const hourLabel = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(date);
      if (hourLabel !== lastHour) {
        out.push({ key: `h-${item.id}`, hour: hourLabel });
        lastHour = hourLabel;
      }
      out.push({ key: item.id + item.kind, item });
    }
    return out;
  }, [items]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={({ item: row }) =>
        'hour' in row && row.hour ? (
          <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-ink-soft dark:text-[#9B97AB]">
            {row.hour}
          </Text>
        ) : row.item ? (
          <TimelineRow item={row.item} />
        ) : null
      }
      ListEmptyComponent={
        <View className="rounded-2xl border border-dashed border-line px-6 py-10 dark:border-[#35323F]">
          <Text className="text-center text-sm font-semibold text-ink dark:text-[#EDEBF4]">
            Nothing logged yet today
          </Text>
          <Text className="mt-1 text-center text-xs text-ink-soft dark:text-[#9B97AB]">
            Tap a card above — logging takes one tap.
          </Text>
        </View>
      }
      scrollEnabled={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 mb-2 dark:border-[#35323F] dark:bg-[#26242F]">
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${meta.hex}26` }}
      >
        <Icon size={16} color={meta.hex} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-ink-soft dark:text-[#9B97AB]" numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <Text className="text-xs text-ink-soft dark:text-[#9B97AB]">{formatTime(item.at)}</Text>
    </View>
  );
}
