import { Text, View } from 'react-native';
import { Droplet } from 'lucide-react-native';
import type { LastFeedDetail } from '@/db/queries';
import { durationText, formatTime } from '@/utils/datetime';

interface SinceCardProps {
  lastFeed: LastFeedDetail | null;
  /** Live elapsed seconds since last feed; undefined while loading. */
  elapsedSeconds: number | null;
  sleptTodaySeconds: number;
  nappyCount: number;
  weightKg: number | null;
}

/** Hero card: "SINCE LAST FEED" numeral + three quiet stats. */
export function SinceCard({
  lastFeed,
  elapsedSeconds,
  sleptTodaySeconds,
  nappyCount,
  weightKg,
}: SinceCardProps) {
  const sub = lastFeed ? describeFeed(lastFeed) : 'No feeds logged yet';

  return (
    <View className="rounded-2xl border border-line bg-card p-5 dark:border-[#38332B] dark:bg-[#26221D]">
      <View className="flex-row items-center gap-1.5">
        <Droplet size={12} color="#C05B33" />
        <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-peach">
          Since last feed
        </Text>
      </View>

      <Text className="mt-2 font-display-semibold text-[52px] leading-[56px] text-ink dark:text-[#EFEAE0]">
        {elapsedSeconds === null
          ? '—'
          : `${Math.floor(elapsedSeconds / 3600)}h ${Math.round((elapsedSeconds % 3600) / 60)}m`}
      </Text>
      <Text className="mt-1 text-sm text-ink-soft dark:text-[#9C937F]">{sub}</Text>

      <View className="mt-4 h-px bg-line dark:bg-[#38332B]" />

      <View className="mt-3 flex-row">
        <Stat value={`${Math.floor(sleptTodaySeconds / 3600)}h ${Math.round((sleptTodaySeconds % 3600) / 60)}m`} label="Slept today" />
        <Stat value={String(nappyCount)} label="Nappies" />
        <Stat value={weightKg === null ? '—' : `${(weightKg / 1000).toFixed(2)} kg`} label="Weight" last />
      </View>
    </View>
  );
}

function Stat({ value, label, last }: { value: string; label: string; last?: boolean }) {
  return (
    <View className={`flex-1 ${last ? '' : 'border-r border-line dark:border-[#38332B]'}`}>
      <Text className="font-display-semibold text-xl text-ink dark:text-[#EFEAE0]">{value}</Text>
      <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]">{label}</Text>
    </View>
  );
}

function describeFeed(f: LastFeedDetail): string {
  const time = formatTime(f.at);
  if (f.mode === 'bottle') {
    return f.amountMl ? `${time} · bottle, ${Math.round(f.amountMl)} ml` : `${time} · bottle`;
  }
  const bits = [time];
  if (f.side) bits.push(`${f.side} breast`);
  if (f.durationSeconds) bits.push(durationText(f.durationSeconds));
  return bits.join(' · ');
}
