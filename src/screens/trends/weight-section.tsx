import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Scale } from 'lucide-react-native';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { useDbQuery } from '@/db/queries';
import { listWeights } from '@/db/weights';
import { getBaby } from '@/db/babies';
import { formatWeight, weightToDisplay } from '@/utils/units';
import { useSettingsStore } from '@/stores/settings';

/** Growth trend line chart + last/first summary cards. */
export function WeightSection({ babyId, days = 365 }: { babyId: string; days?: number }) {
  const [nowMs] = useState(() => Date.now());
  const unit = useSettingsStore((s) => s.weightUnit);
  const entries = useDbQuery(`weights:${babyId}`, () => listWeights(babyId));
  const baby = useDbQuery(`baby:${babyId}`, () => getBaby(babyId));

  const series = useMemo(() => {
    if (!entries) return null;
    const cutoff = nowMs - days * 86_400_000;
    // Chronological ascending for the chart, bounded by the range.
    const asc = [...entries].filter((e) => new Date(e.timestamp).getTime() >= cutoff).reverse();
    const points: { value: number; label: string; grams: number; iso: string }[] = [];
    if (baby?.birthWeightGrams) {
      const d = new Date(baby.dateOfBirth);
      points.push({
        value: weightToDisplay(baby.birthWeightGrams, unit),
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        grams: baby.birthWeightGrams,
        iso: baby.dateOfBirth,
      });
    }
    for (const e of asc) {
      const d = new Date(e.timestamp);
      points.push({
        value: weightToDisplay(e.weightGrams, unit),
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        grams: e.weightGrams,
        iso: e.timestamp,
      });
    }
    return points;
  }, [entries, baby, unit, days, nowMs]);

  if (!entries || !series) return null;

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ink dark:text-[#EDEBF4]">
          Growth ({unit})
        </Text>
        {series.length >= 2 ? (
          <Text className="text-xs text-ink-soft">
            Reference only — not medical advice
          </Text>
        ) : null}
      </View>

      {series.length < 2 ? (
        <EmptyState
          icon={Scale}
          title="Not enough readings"
          message="Log at least two weights to see the growth trend. Birth weight counts as the first point."
        />
      ) : (
        <>
          <Card className="p-4">
            <LineChart
              data={series.map((p) => ({
                value: p.value,
                label: p.label,
                labelTextStyle: { color: '#8A8699', fontSize: 9 },
              }))}
              curved
              thickness={3}
              color="#EFC368"
              startFillColor="#FDEFE5"
              endFillColor="#FFFFFF"
              startOpacity={0.9}
              endOpacity={0}
              areaChart
              noOfSections={4}
              yAxisColor="#8A8699"
              xAxisColor="#EFEAE2"
              yAxisTextStyle={{ color: '#8A8699', fontSize: 10 }}
              isAnimated
              height={180}
            />
          </Card>

          <View className="mt-3 flex-row gap-3">
            <StatCard
              label={`First · ${new Date(series[0].iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
              value={formatWeight(series[0].grams, unit)}
              accent="butter"
              icon={Scale}
            />
            <StatCard
              label={`Latest · ${new Date(series[series.length - 1].iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
              value={formatWeight(series[series.length - 1].grams, unit)}
              accent="butter"
              icon={Scale}
            />
          </View>
        </>
      )}
    </View>
  );
}
