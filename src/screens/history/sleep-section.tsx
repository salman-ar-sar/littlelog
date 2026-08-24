import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { MoonStar } from 'lucide-react-native';
import { Card, SectionTitle, SegmentedControl, StatCard } from '@/components/ui';
import { useDbQuery } from '@/db/queries';
import { listSleep } from '@/db/sleep';
import { startOfLocalDay } from '@/utils/datetime';

type Range = '7' | '30';

/** Sleep per day bar chart (last 7/30 days) + stat cards. */
export function SleepSection({ babyId }: { babyId: string }) {
  const [range, setRange] = useState<Range>('7');
  const entries = useDbQuery(`sleep:${babyId}`, () => listSleep(babyId));

  const days = Number(range);
  const [nowMs] = useState(() => Date.now());

  const chart = useMemo(() => {
    if (!entries) return null;
    const now = new Date(nowMs);
    const today = startOfLocalDay(now);
    const buckets: { label: string; hours: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const dayStart = new Date(today.getTime() - i * 86_400_000);
      const dayEnd = dayStart.getTime() + 86_400_000;
      let seconds = 0;
      for (const s of entries) {
        const start = new Date(s.startTime).getTime();
        const end = s.endTime ? new Date(s.endTime).getTime() : nowMs;
        const overlap = Math.min(end, dayEnd) - Math.max(start, dayStart.getTime());
        if (overlap > 0 && end <= nowMs) seconds += overlap / 1000;
      }
      buckets.push({
        label:
          i === 0
            ? 'Today'
            : `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        hours: Math.round((seconds / 3600) * 10) / 10,
      });
    }
    return buckets;
  }, [entries, days, nowMs]);

  const stats = useMemo(() => {
    if (!entries || !chart) return null;
    const lastNight = chart[chart.length - 1]?.hours ?? 0;
    let naps7 = 0;
    let longest = 0;
    const weekAgo = nowMs - 7 * 86_400_000;
    for (const s of entries) {
      const start = new Date(s.startTime).getTime();
      if (start < weekAgo) continue;
      if (s.type === 'nap') naps7 += 1;
      if (s.endTime) {
        const dur = (new Date(s.endTime).getTime() - start) / 1000;
        if (dur > longest) longest = dur;
      }
    }
    return { lastNightHours: lastNight, naps7, longest };
  }, [entries, chart, nowMs]);

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between">
        <SectionTitle>Sleep per day</SectionTitle>
        <SegmentedControl<Range>
          value={range}
          onChange={setRange}
          options={[
            { value: '7', label: '7d' },
            { value: '30', label: '30d' },
          ]}
          className="w-28"
        />
      </View>

      <Card className="p-4">
        {chart ? (
          <BarChart
            data={chart.map((b) => ({ value: b.hours, label: b.label }))}
            barWidth={days === 7 ? 22 : 8}
            spacing={days === 7 ? 14 : 4}
            barBorderRadius={6}
            noOfSections={4}
            height={160}
            roundedTop
            frontColor="#A99BD8"
            yAxisColor="#8A8699"
            xAxisColor="#8A8699"
            yAxisTextStyle={{ color: '#8A8699', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#8A8699', fontSize: 9 }}
            isAnimated
          />
        ) : (
          <Text className="text-sm text-ink-soft">Loading…</Text>
        )}
      </Card>

      {stats ? (
        <View className="mt-3 flex-row gap-3">
          <StatCard
            label="Last night"
            value={`${stats.lastNightHours}h`}
            accent="lavender"
            icon={MoonStar}
          />
          <StatCard
            label="Naps · 7d"
            value={String(stats.naps7)}
            sublabel={`longest ${Math.round(stats.longest / 60)}m`}
            accent="lavender"
            icon={MoonStar}
          />
        </View>
      ) : null}
    </View>
  );
}

