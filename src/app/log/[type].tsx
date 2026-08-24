import type { ComponentType, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X , Milk as FeedIcon, MoonStar, Baby, Bath as BathIcon, Scale, Pill } from 'lucide-react-native';

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

export default function LogModal() {
  const router = useRouter();
  const rawType = useLocalSearchParams<{ type?: string }>().type;
  const type = typeof rawType === 'string' ? rawType : '';
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

  const close = () => router.back();
  const Form = FORMS[type];

  return (
    <Screen>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-ink dark:text-[#EDEBF4]">
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
            actionLabel="Add a baby"
            onAction={close}
          />
        </ScrollView>
      ) : Form ? (
        <FormWrapper>
          <Form babyId={activeBabyId} onDone={close} />
        </FormWrapper>
      ) : (
        <EmptyState
          icon={ICONS.diaper}
          title="Unknown tracker"
          message={`Nothing to log for "${type}".`}
          actionLabel="Go back"
          onAction={close}
        />
      )}
    </Screen>
  );
}

function FormWrapper({ children }: { children: ReactNode }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
      {children}
    </ScrollView>
  );
}

const FORMS: Record<string, ComponentType<{ babyId: string; onDone: () => void }>> = {
  feeding: FeedingLogForm,
  sleep: SleepLogForm,
  diaper: DiaperLogForm,
  bath: BathLogForm,
  weight: WeightLogForm,
  medicine: DoseForm,
};

