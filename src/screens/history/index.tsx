import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, SectionTitle } from '@/components/ui';
import { FilterChips, type TrackerFilter } from './filter-chips';
import { WeightSection } from './weight-section';
import { SleepSection } from './sleep-section';
import { EntryList } from './entry-list';
import { FeedStats } from './feed-stats';

export function HistoryScreen({ babyId }: { babyId: string }) {
  const [filter, setFilter] = useState<TrackerFilter>('all');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 12 }} />
        <SectionTitle>History & insights</SectionTitle>
        <View className="mb-4">
          <FilterChips value={filter} onChange={setFilter} />
        </View>

        {(filter === 'all' || filter === 'feeding') && (
          <FeedStats babyId={babyId} />
        )}
        {(filter === 'all' || filter === 'sleep') && <SleepSection babyId={babyId} />}
        {(filter === 'all' || filter === 'weight') && <WeightSection babyId={babyId} />}

        <SectionTitle>Entries · last 30 days</SectionTitle>
        <EntryList babyId={babyId} filter={filter} />
      </ScrollView>
    </Screen>
  );
}
