import { useState } from 'react';
import { ScrollView, View , Text } from 'react-native';
import { Screen, SegmentedControl } from '@/components/ui';
import { WeightSection } from './weight-section';
import { SleepSection } from './sleep-section';
import { FeedStats } from './feed-stats';


type Range = '7' | '30' | 'all';

/** Trends — weight line + sleep bars, informational only. */
export function TrendsScreen({ babyId }: { babyId: string }) {
  const [range, setRange] = useState<Range>('7');
  const days = range === 'all' ? 365 : Number(range);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 12 }} />
        <Text className="font-display-semibold text-3xl text-ink dark:text-[#EFEAE0]">Trends</Text>
        <View className="mb-4 mt-3">
          <SegmentedControl<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: 'all', label: 'All' },
            ]}
          />
        </View>

        <FeedStats babyId={babyId} />
        <SleepSection babyId={babyId} days={days} />
        <WeightSection babyId={babyId} days={days} />
      </ScrollView>
    </Screen>
  );
}
