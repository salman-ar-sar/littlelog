import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Milk, MoonStar } from 'lucide-react-native';
import { LiveTimer } from '@/screens/log/live-timer';
import { useTimersStore } from '@/stores/timers';

/** Persistent banner shown while a feed or sleep timer is running. */
export function ActiveTimerBanners() {
  const activeSleep = useTimersStore((s) => s.activeSleep);
  const feedSession = useTimersStore((s) => s.feedSession);
  const router = useRouter();

  return (
    <>
      {activeSleep ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sleep timer running — open sleep log"
          onPress={() => router.push('/log/sleep')}
          className="mb-2 flex-row items-center gap-3 rounded-2xl border border-lavender bg-lavender-soft px-4 py-3 active:opacity-80"
        >
          <MoonStar size={18} color="#A99BD8" />
          <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]">
            Sleeping since{' '}
            {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
              new Date(activeSleep.startedAt),
            )}
          </Text>
          <View className="flex-1" />
          <LiveTimer sideStartedAt={new Date(activeSleep.startedAt).getTime()} size="md" />
        </Pressable>
      ) : null}

      {feedSession ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Nursing timer running, ${feedSession.currentSide} side — open feeding log`}
          onPress={() => router.push('/log/feeding')}
          className="mb-2 flex-row items-center gap-3 rounded-2xl border border-peach bg-peach-soft px-4 py-3 active:opacity-80"
        >
          <Milk size={18} color="#F0A47E" />
          <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]">
            Nursing · {feedSession.currentSide}
          </Text>
          <View className="flex-1" />
          <LiveTimer sideStartedAt={feedSession.sideStartedAt} pausedAt={feedSession.pausedAt} size="md" />
        </Pressable>
      ) : null}
    </>
  );
}

