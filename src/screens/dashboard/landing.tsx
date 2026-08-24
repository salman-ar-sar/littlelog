import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Editorial onboarding — abstract arcs and dots, one promise, one action. */
export function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper dark:bg-[#1B1916]">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pt-16">
          <View className="h-52 w-52 items-center justify-center">
            <View className="absolute h-52 w-52 rounded-full border-[6px] border-peach/70" />
            <View className="absolute h-40 w-40 rounded-full border-2 border-line dark:border-[#38332B]" />
            <View
              className="absolute h-52 w-52 rounded-full border-[6px] border-lavender/70"
              style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
            />
            <View className="absolute h-28 w-28 rounded-full bg-card dark:bg-[#26221D]" />
            <View className="absolute -right-1 top-8 h-3 w-3 rounded-full bg-mint" />
            <View className="absolute -left-2 bottom-16 h-2.5 w-2.5 rounded-full bg-butter" />
            <View className="absolute bottom-24 left-16 h-2 w-2 rounded-full bg-blush" />
            <View className="h-4 w-4 rounded-full bg-peach" />
          </View>
        </View>

        <Text className="mt-12 font-display-semibold text-[34px] leading-[40px] text-ink dark:text-[#EFEAE0]">
          {'A quiet record\nof the small hours.'}
        </Text>

        <Text className="mt-4 text-base leading-6 text-ink-soft dark:text-[#9C937F]">
          Feeds, sleep, nappies — logged in one thumb tap, and never a streak or a badge in
          sight.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add your baby"
          onPress={() => router.push('/baby/new/edit')}
          className="mt-10 min-h-[56px] items-center justify-center rounded-xl bg-ink active:opacity-80 dark:bg-[#EFEAE0]"
        >
          <Text className="text-base font-sans-semibold text-paper dark:text-[#1B1916]">
            Add your baby
          </Text>
        </Pressable>

        <Text className="mt-6 text-center text-xs text-ink-soft dark:text-[#9C937F]">
          Offline-first · no account needed
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
