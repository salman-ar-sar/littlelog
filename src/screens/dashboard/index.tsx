import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileSwitcher } from '@/components/profile-switcher';
import { SectionTitle } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import { QuickLogGrid } from './quick-log-grid';
import { ActiveTimerBanners } from './timer-banners';
import { TodayTimeline } from './today-timeline';
import { LandingScreen } from './landing';

export function DashboardScreen() {
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

  if (!activeBabyId) {
    return <LandingScreen />;
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-paper dark:bg-[#1C1B22]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View className="pt-3">
          <ProfileSwitcher />
        </View>

        <View className="mt-4">
          <ActiveTimerBanners />
        </View>

        <QuickLogGrid babyId={activeBabyId} />

        <View className="mt-2">
          <SectionTitle>Today</SectionTitle>
          <TodayTimeline babyId={activeBabyId} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
