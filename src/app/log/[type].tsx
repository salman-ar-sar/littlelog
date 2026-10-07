import type { ComponentType, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Milk as FeedIcon, MoonStar, Baby, Bath as BathIcon, Scale, Pill } from 'lucide-react-native';

import { Screen } from '@/components/ui/screen';
import { DiaperLogForm } from '@/screens/log/diaper-form';
import { BathLogForm } from '@/screens/log/bath-form';
import { WeightLogForm } from '@/screens/log/weight-log-form';
import { FeedingLogForm } from '@/screens/log/feeding-log-form';
import { SleepLogForm } from '@/screens/log/sleep-log-form';
import { DoseForm } from '@/screens/log/dose-form';
import { EmptyState } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import type { LucideIcon } from 'lucide-react-native';

const TITLES: Record<string, string> = {
  feeding: 'Feeding',
  sleep: 'Sleep',
  diaper: 'Diaper',
  bath: 'Bath',
  weight: 'Weight',
  medicine: 'Medicine',
};

const ICONS: Record<string, LucideIcon> = {
  feeding: FeedIcon,
  sleep: MoonStar,
  diaper: Baby,
  bath: BathIcon,
  weight: Scale,
  medicine: Pill,
};

const FORMS: Record<string, ComponentType<{ babyId: string; onDone: () => void }>> = {
  feeding: FeedingLogForm,
  sleep: SleepLogForm,
  diaper: DiaperLogForm,
  bath: BathLogForm,
  weight: WeightLogForm,
  medicine: DoseForm,
};

export default function LogModal() {
  const router = useRouter();
  const rawType = useLocalSearchParams<{ type?: string }>().type;
  const type = typeof rawType === 'string' ? rawType : '';
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

  const close = () => router.back();
  const Form = FORMS[type];

  return (
    <Screen edges={Platform.OS === 'ios' ? [] : ['top']}>
      <View
        className={`mb-3 flex-row items-center justify-between ${
          Platform.OS === 'ios' ? 'pt-3' : ''
        }`}
      >
        <Text className="text-xl font-bold text-ink dark:text-[#EFEAE0]">
          {TITLES[type] ?? 'Log'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/5 active:opacity-60 dark:bg-white/10"
        >
          <X size={18} color="#8A8699" />
        </Pressable>
      </View>

      {!activeBabyId ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <EmptyState
            icon={Baby}
            title="No baby profile yet"
            message="Add your little one's profile first — then every log is one tap away."
            actionLabel="Add baby profile"
            onAction={() => router.push('/baby/new/edit')}
          />
        </ScrollView>
      ) : Form ? (
        <Form babyId={activeBabyId} onDone={close} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <EmptyState
            icon={ICONS[type] ?? Baby}
            title={`No form for ${type || 'this type'}`}
            message="This logger hasn't been implemented yet. Check back soon."
            actionLabel="Go back"
            onAction={close}
          />
        </ScrollView>
      )}
    </Screen>
  );
}
