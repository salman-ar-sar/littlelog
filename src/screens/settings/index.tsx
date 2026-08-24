import { Alert, Pressable, ScrollView, Switch, Text, View , useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  BellRing,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Moon,
  Pill,
  User,
} from 'lucide-react-native';
import { Field, Screen, SegmentedControl } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings';
import { useActiveBaby } from '@/stores/babies';
import { requestPermissionGracefully } from '@/notifications';
import { exportCsv, exportJson } from './export';

export function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const volumeUnit = useSettingsStore((s) => s.volumeUnit);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const nightfeedMode = useSettingsStore((s) => s.nightfeedMode);
  const hapticConfirm = useSettingsStore((s) => s.hapticConfirm);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const setVolumeUnit = useSettingsStore((s) => s.setVolumeUnit);
  const setRemindersEnabled = useSettingsStore((s) => s.setRemindersEnabled);
  const setNightfeedMode = useSettingsStore((s) => s.setNightfeedMode);
  const setHapticConfirm = useSettingsStore((s) => s.setHapticConfirm);
  const activeBaby = useActiveBaby();

  const track = { trackFalse: dark ? '#38332B' : '#E7E0D2', trackTrue: '#C05B33' };

  const toggleReminders = async (enabled: boolean) => {
    if (!enabled) {
      setRemindersEnabled(false);
      return;
    }
    const granted = await requestPermissionGracefully();
    if (!granted) {
      Alert.alert(
        'Notifications off',
        'Notification permission was denied. Enable notifications for LittleLog in system settings to use reminders.',
      );
      return;
    }
    setRemindersEnabled(true);
  };

  const runExport = (kind: 'csv' | 'json') => {
    void (async () => {
      try {
        if (kind === 'csv') await exportCsv();
        else await exportJson();
      } catch (e) {
        Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
      }
    })();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 12 }} />
        <Text className="font-display-semibold text-3xl text-ink dark:text-[#EFEAE0]">
          Settings
        </Text>

        <Group label="Baby">
          <Row
            icon={<User size={16} color="#C05B33" />}
            title={activeBaby?.name ?? 'Add a baby'}
            sub={activeBaby ? 'Profile, photo, birthday' : 'Create a profile'}
            onPress={() =>
              router.push(activeBaby ? `/baby/${activeBaby.id}/edit` : '/baby/new/edit')
            }
          />
          <Row
            icon={<Pill size={16} color="#6E4E75" />}
            title="Medicines & reminders"
            sub="List, schedules, doses"
            onPress={() => router.push('/(tabs)/medicines')}
          />
        </Group>

        <Group label="Units">
          <View className="px-4 py-3" style={{ rowGap: 16 }}>
            <Field label="Weight">
              <SegmentedControl
                value={weightUnit}
                onChange={(u) => setWeightUnit(u)}
                options={[
                  { value: 'kg' as const, label: 'Kilograms (kg)' },
                  { value: 'lb' as const, label: 'Pounds (lb)' },
                ]}
              />
            </Field>
            <Field label="Volume">
              <SegmentedControl
                value={volumeUnit}
                onChange={(u) => setVolumeUnit(u)}
                options={[
                  { value: 'ml' as const, label: 'Milliliters (ml)' },
                  { value: 'oz' as const, label: 'Fluid ounces (oz)' },
                ]}
              />
            </Field>
          </View>
        </Group>

        <Group label="Night">
          <ToggleRow
            icon={<Moon size={16} color="#5C7FA3" />}
            title="Nightfeed mode"
            sub="9:00 PM – 6:00 AM"
            value={nightfeedMode}
            onChange={setNightfeedMode}
            track={track}
          />
          <ToggleRow
            icon={<BellRing size={16} color="#C9A13B" />}
            title="Haptic confirm"
            sub="Light impact on log"
            value={hapticConfirm}
            onChange={setHapticConfirm}
            track={track}
          />
        </Group>

        <Group label="Reminders">
          <ToggleRow
            icon={<BellRing size={16} color="#6E4E75" />}
            title="Medicine reminders"
            sub={remindersEnabled ? 'Daily local notifications' : 'Off'}
            value={remindersEnabled}
            onChange={(v) => void toggleReminders(v)}
            track={track}
          />
        </Group>

        <Group label="Data">
          <Row
            icon={<FileSpreadsheet size={16} color="#7D8F69" />}
            title="Export as CSV"
            sub="Share a spreadsheet copy"
            onPress={() => runExport('csv')}
          />
          <Row
            icon={<FileJson size={16} color="#5C7FA3" />}
            title="Export as JSON"
            sub="Full backup"
            onPress={() => runExport('json')}
          />
          <Row
            icon={<Download size={16} color="#8A8073" />}
            title="Sync across devices"
            sub="Coming soon"
            disabled
          />
        </Group>

        <Text className="mt-4 text-center text-xs text-ink-soft dark:text-[#9C937F]">
          Offline-first · your data never leaves this device
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="mb-2 px-1 text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ink-soft dark:text-[#9C937F]">
        {label}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-line bg-card dark:border-[#38332B] dark:bg-[#26221D]">
        {children}
      </View>
    </View>
  );
}

interface RowProps {
  icon: ReactNode;
  title: string;
  sub?: string;
  onPress?: () => void;
  disabled?: boolean;
}

function Row({ icon, title, sub, onPress, disabled }: RowProps) {
  return (
    <View className="border-b border-line px-4 last:border-b-0 dark:border-[#38332B]">
      <Pressable
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={title}
        disabled={disabled}
        onPress={onPress}
        className={`min-h-[56px] flex-row items-center gap-3 py-3 ${disabled ? 'opacity-40' : 'active:opacity-60'}`}
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-paper dark:bg-[#1B1916]">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">{title}</Text>
          {sub ? (
            <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]">{sub}</Text>
          ) : null}
        </View>
        {onPress && !disabled ? <ChevronRight size={16} color="#8A8073" /> : null}
      </Pressable>
    </View>
  );
}

interface ToggleRowProps {
  icon: ReactNode;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  track: { trackFalse: string; trackTrue: string };
}

function ToggleRow({ icon, title, sub, value, onChange, track }: ToggleRowProps) {
  return (
    <View className="border-b border-line px-4 last:border-b-0 dark:border-[#38332B]">
      <View className="min-h-[56px] flex-row items-center gap-3 py-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-paper dark:bg-[#1B1916]">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-ink dark:text-[#EFEAE0]">{title}</Text>
          {sub ? (
            <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]">{sub}</Text>
          ) : null}
        </View>
        <Switch
          accessibilityLabel={title}
          trackColor={{ false: track.trackFalse, true: track.trackTrue }}
          thumbColor="#FFFFFF"
          value={value}
          onValueChange={onChange}
        />
      </View>
    </View>
  );
}
