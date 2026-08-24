import { View } from 'react-native';
import { Milk } from 'lucide-react-native';
import { StatCard } from '@/components/ui';
import { useTodaySnapshot } from '@/db/queries';
import { formatRelative, durationText } from '@/utils/datetime';

/** Today's feeding stat cards. */
export function FeedStats({ babyId }: { babyId: string }) {
  const snapshot = useTodaySnapshot(babyId);
  if (!snapshot) return null;

  const breastMin = Math.round(snapshot.feeds.totalBreastSeconds / 60);

  return (
    <View className="mb-5 flex-row gap-3">
      <StatCard
        label="Feeds today"
        value={String(snapshot.feeds.count)}
        sublabel={snapshot.lastFeedAt ? `last ${formatRelative(snapshot.lastFeedAt)}` : undefined}
        accent="peach"
        icon={Milk}
      />
      <StatCard
        label="Bottle volume"
        value={`${Math.round(snapshot.feeds.totalMl)} ml`}
        sublabel={`breast ${breastMin > 0 ? durationText(snapshot.feeds.totalBreastSeconds) : '0m'}`}
        accent="butter"
        icon={Milk}
      />
    </View>
  );
}
