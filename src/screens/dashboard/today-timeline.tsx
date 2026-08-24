import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { TimelineItem, TimelineKind } from '@/db/queries';
import { useTimelineDay } from '@/db/queries';
import { localDayStartISO, formatTime } from '@/utils/datetime';

const KIND_HEX: Record<TimelineKind, string> = {
  feed: '#C05B33',
  sleep: '#5C7FA3',
  diaper: '#7D8F69',
  bath: '#C9A13B',
  weight: '#C4888C',
  dose: '#6E4E75',
};

const KIND_LABEL: Record<TimelineKind, string> = {
  feed: 'Feed',
  sleep: 'Sleep',
  diaper: 'Nappy',
  bath: 'Bath',
  weight: 'Weight',
  dose: 'Medicine',
};

/** "Today" ledger — time column, accent dot + hairline, title + note. */
export function TodayTimeline({ babyId }: { babyId: string }) {
  const items = useTimelineDay(babyId, localDayStartISO());
  const rows = useMemo(() => items ?? [], [items]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.kind + item.id}
      renderItem={({ item, index }) => (
        <LedgerRow item={item} last={index === rows.length - 1} />
      )}
      ListEmptyComponent={
        <View className="rounded-xl border border-dashed border-line px-5 py-8 dark:border-[#38332B]">
          <Text className="text-center font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">
            Nothing logged yet today
          </Text>
          <Text className="mt-1 text-center text-xs text-ink-soft dark:text-[#9C937F]">
            Tap a tile above — logging takes one tap.
          </Text>
        </View>
      }
      scrollEnabled={false}
    />
  );
}

function LedgerRow({ item, last }: { item: TimelineItem; last: boolean }) {
  const hex = KIND_HEX[item.kind];
  return (
    <View className="flex-row py-2.5">
      <Text className="w-14 pt-0.5 text-xs text-ink-soft dark:text-[#9C937F]">
        {formatTime(item.at)}
      </Text>
      <View className="w-6 items-center self-stretch">
        <View className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
        {!last ? <View className="mt-0.5 w-px flex-1 bg-line dark:bg-[#38332B]" /> : null}
      </View>
      <View className="flex-1 pb-1">
        <Text className="font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">
          {KIND_LABEL[item.kind]}
        </Text>
        <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]" numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );
}
