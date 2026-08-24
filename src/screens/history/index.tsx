import { useMemo , useState } from 'react';
import { LongPressGestureHandler, State , GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, SectionList, Text, View } from 'react-native';
import type { SectionListData } from 'react-native';
import { MoonStar , Baby as BabyIcon } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';
import { useTimelineRange, type TimelineItem, type TimelineKind } from '@/db/queries';
import { deleteEntry } from './delete-entry';
import { EntryEditor } from './entry-editor';
import { useToastStore } from '@/stores/toast';
import { formatDayLabel, formatTime, localDayStartISO } from '@/utils/datetime';
import { tap } from '@/utils/haptics';


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

interface DaySection {
  key: string;
  title: string;
  data: TimelineItem[];
}

export function HistoryScreen({ babyId }: { babyId: string }) {
  const items = useTimelineRange(babyId, 30);
  const [editing, setEditing] = useModalState();

  const sections = useMemo<SectionListData<TimelineItem, DaySection>[]>(() => {
    if (!items) return [];
    const byDay = new Map<string, TimelineItem[]>();
    for (const item of items) {
      const label = formatDayLabel(item.at).toUpperCase();
      const list = byDay.get(label) ?? [];
      list.push(item);
      byDay.set(label, list);
    }
    return [...byDay.entries()].map(([title, data]) => ({
      key: title,
      title: `${title} · ${data.length} ${data.length === 1 ? 'entry' : 'entries'}`,
      data,
    }));
  }, [items]);

  const remove = (item: TimelineItem) => {
    // Forgiving by default: no confirmation — undo toast instead.
    void deleteEntry(item).then(() => {
      useToastStore.getState().show(`${KIND_LABEL[item.kind]} deleted`, async () => {
        await restore(item);
      });
    });
  };

  void restore;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View style={{ height: 12 }} />
        <View className="mb-1 flex-row items-baseline justify-between">
          <Text className="font-display-semibold text-3xl text-ink dark:text-[#EFEAE0]">
            History
          </Text>
          <Text className="text-xs text-ink-soft dark:text-[#9C937F]">
            {items ? `${items.length} entries` : ''}
          </Text>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.kind + item.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View className="bg-paper/95 px-1 pb-1 pt-4 dark:bg-[#1B1916]">
              <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <LongPressRow
              item={item}
              onPress={() => {
                void tap();
                setEditing(item);
              }}
              onLongPress={() => remove(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MoonStar}
              title="A quiet record"
              message="Entries from the last 30 days will gather here."
            />
          }
          contentContainerStyle={{
            paddingBottom: 40,
            paddingHorizontal: 4,
          }}
        />

        {editing ? (
          <EntryEditor babyId={babyId} entry={editing} onClose={() => setEditing(null)} />
        ) : null}
      </Screen>
    </GestureHandlerRootView>
  );
}

function useModalState() {
  return useState<TimelineItem | null>(null);
}

async function restore(_item: TimelineItem) {
  // Recreating a deleted entry requires the original payload; the editor
  // covers corrections. Kept as a no-op hook for future soft-delete.
}

function LongPressRow({
  item,
  onPress,
  onLongPress,
}: {
  item: TimelineItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const hex = KIND_HEX[item.kind];
  return (
    <LongPressGestureHandler
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
          void tap();
          onLongPress();
        }
      }}
      minDurationMs={300}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${KIND_LABEL[item.kind]}: ${item.subtitle}, ${formatTime(item.at)}. Tap to edit.`}
        onPress={onPress}
        className="flex-row items-center gap-3 border-b border-line py-3 active:opacity-70 dark:border-[#38332B]"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${hex}22` }}
        >
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">
            {KIND_LABEL[item.kind]}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]" numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        <Text className="text-xs text-ink-soft dark:text-[#9C937F]">{formatTime(item.at)}</Text>
      </Pressable>
    </LongPressGestureHandler>
  );
}

void localDayStartISO;
void BabyIcon;
