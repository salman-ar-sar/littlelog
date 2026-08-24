import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import {
  Bath as BathIcon,
  Baby,
  Baby as BabyIconForEmpty,
  Milk,
  MoonStar,
  Pill,
  Scale,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { EmptyState } from '@/components/ui';
import { useTimelineRange, type TimelineItem, type TimelineKind } from '@/db/queries';
import { formatDayLabel, formatTime } from '@/utils/datetime';
import { tap } from '@/utils/haptics';
import type { TrackerFilter } from './filter-chips';
import { EntryEditor } from './entry-editor';
import { deleteEntry } from './delete-entry';

const KIND_META: Record<TimelineKind, { icon: LucideIcon; hex: string; label: string }> = {
  feed: { icon: Milk, hex: '#F0A47E', label: 'Feeding' },
  sleep: { icon: MoonStar, hex: '#A99BD8', label: 'Sleep' },
  diaper: { icon: Baby, hex: '#79C4A4', label: 'Diaper' },
  bath: { icon: BathIcon, hex: '#82B4DC', label: 'Bath' },
  weight: { icon: Scale, hex: '#EFC368', label: 'Weight' },
  dose: { icon: Pill, hex: '#F2A7B3', label: 'Medicine' },
};

const KIND_BY_FILTER: Record<Exclude<TrackerFilter, 'all'>, TimelineKind> = {
  feeding: 'feed',
  sleep: 'sleep',
  diaper: 'diaper',
  bath: 'bath',
  weight: 'weight',
  dose: 'dose',
};

export function EntryList({ babyId, filter }: { babyId: string; filter: TrackerFilter }) {
  const items = useTimelineRange(babyId, 30);
  const [editing, setEditing] = useState<TimelineItem | null>(null);

  const visible = useMemo(() => {
    if (!items) return undefined;
    if (filter === 'all') return items;
    const kind = KIND_BY_FILTER[filter];
    return items.filter((i) => i.kind === kind);
  }, [items, filter]);

  const confirmMenu = (item: TimelineItem) => {
    Alert.alert(`${KIND_META[item.kind].label} entry`, `${item.title} · ${item.subtitle}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry(item) },
      { text: 'Edit', onPress: () => setEditing(item) },
    ]);
  };

  if (!visible) return <Text className="text-sm text-ink-soft">Loading…</Text>;
  if (visible.length === 0) {
    return (
      <EmptyState
        icon={BabyIconForEmpty}
        title="No entries"
        message="Nothing here in the last 30 days for this filter."
      />
    );
  }

  return (
    <>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.kind + item.id}
        renderItem={({ item }) => (
          <LongPressRow item={item} onMenu={() => confirmMenu(item)} />
        )}
        scrollEnabled={false}
        contentContainerStyle={{ rowGap: 8 }}
      />
      {editing ? <EntryEditor babyId={babyId} entry={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function LongPressRow({ item, onMenu }: { item: TimelineItem; onMenu: () => void }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}: ${item.subtitle}, ${formatDayLabel(item.at)} ${formatTime(item.at)}. Long press to edit or delete.`}
      onLongPress={() => {
        void tap();
        onMenu();
      }}
      delayLongPress={350}
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 active:bg-black/5 dark:border-[#35323F] dark:bg-[#26242F] dark:active:bg-white/10"
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${meta.hex}26` }}
      >
        <Icon size={16} color={meta.hex} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]" numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Text className="text-xs text-ink-soft dark:text-[#9B97AB]">
          {formatDayLabel(item.at)} · {formatTime(item.at)}
        </Text>
      </View>
      <Text className="text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-[#9B97AB]">
        {meta.label}
      </Text>
    </Pressable>
  );
}
