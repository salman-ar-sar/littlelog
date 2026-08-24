import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Baby,
  BellRing,
  ChartSpline,
  Milk,
} from 'lucide-react-native';

const FEATURES = [
  { icon: Milk, color: '#F0A47E', soft: '#FDEFE5', title: 'Feeds & sleep', body: 'One-tap timers for nursing and naps — even mid-night.' },
  { icon: Baby, color: '#79C4A4', soft: '#E6F4ED', title: 'Diapers & baths', body: 'Track wet, dirty, and bath days without typing.' },
  { icon: ChartSpline, color: '#EFC368', soft: '#FBF2DF', title: 'Growth & trends', body: 'Weight charts and daily insights as they grow.' },
  { icon: BellRing, color: '#F2A7B3', soft: '#FDEEF0', title: 'Medicine reminders', body: 'Daily schedules that tap straight to “given”.' },
];

/** Branded landing page shown before any baby profile exists. */
export function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-paper dark:bg-[#1C1B22]"
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pt-10">
        <View className="h-36 w-36 items-center justify-center rounded-full border border-line bg-card dark:border-[#35323F] dark:bg-[#26242F]">
          <View className="absolute -left-2 top-6 h-8 w-8 rounded-full bg-peach-soft" />
          <View className="absolute -right-1 bottom-7 h-10 w-10 rounded-full bg-mint-soft" />
          <View className="absolute right-8 -top-1 h-6 w-6 rounded-full bg-sky-soft" />
          <Text className="text-6xl">🍼</Text>
        </View>

        <Text className="mt-6 text-4xl font-bold text-ink dark:text-[#EDEBF4]">LittleLog</Text>
        <Text className="mt-2 text-center text-base text-ink-soft dark:text-[#9B97AB]">
          Every feed, nap, diaper and dose —{'\n'}logged in one tap, kept private.
        </Text>
      </View>

      <View style={{ rowGap: 14 }} className="mt-10">
        {FEATURES.map((f) => (
          <View
            key={f.title}
            className="flex-row items-center gap-4 rounded-2xl border border-line bg-card p-4 dark:border-[#35323F] dark:bg-[#26242F]"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: f.soft }}>
              <f.icon size={22} color={f.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]">{f.title}</Text>
              <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9B97AB]">{f.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create baby profile"
        onPress={() => router.push('/baby/new/edit')}
        className="mt-10 min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-peach py-4 active:opacity-80"
      >
        <Text className="text-lg font-semibold text-white">Get started</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </Pressable>

      <Text className="mt-5 text-center text-xs text-ink-soft dark:text-[#9B97AB]">
        Offline-first · no account needed · your data never leaves this device
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
