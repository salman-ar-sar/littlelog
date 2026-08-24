import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import {
  Baby as BabyIcon,
  Download,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Card,
  Field,
  Screen,
  SectionTitle,
  SegmentedControl,
} from '@/components/ui';
import { useSettingsStore } from '@/stores/settings';
import { useBabyStore } from '@/stores/babies';
import { requestPermissionGracefully } from '@/notifications';
import { exportCsv, exportJson } from './export';

export function SettingsScreen() {
  const router = useRouter();
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const volumeUnit = useSettingsStore((s) => s.volumeUnit);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const setVolumeUnit = useSettingsStore((s) => s.setVolumeUnit);
  const setRemindersEnabled = useSettingsStore((s) => s.setRemindersEnabled);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);

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
        <SectionTitle>Settings</SectionTitle>

        <Card className="mb-4 p-4" >
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-[#9B97AB]">
            Units
          </Text>
          <View style={{ rowGap: 16 }}>
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
        </Card>

        <Card className="mb-4 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]">
                Medicine reminders
              </Text>
              <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9B97AB]">
                Daily local notifications for scheduled medicines.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Medicine reminders"
              trackColor={{ false: '#EFEAE2', true: '#F0A47E' }}
              thumbColor="#FFFFFF"
              value={remindersEnabled}
              onValueChange={(v) => void toggleReminders(v)}
            />
          </View>
        </Card>

        <Card className="mb-4 p-4">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-[#9B97AB]">
            Profiles
          </Text>
          <View style={{ rowGap: 12 }}>
            <Button
              variant="ghost"
              size="sm"
              icon={BabyIcon}
              label="Edit current profile"
              onPress={() =>
                activeBabyId
                  ? router.push(`/baby/${activeBabyId}/edit`)
                  : router.push('/baby/new/edit')
              }
            />
            <Button
              variant="ghost"
              size="sm"
              icon={BabyIcon}
              label="Add another baby"
              onPress={() => router.push('/baby/new/edit')}
            />
          </View>
        </Card>

        <Card className="mb-4 p-4">
          <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-[#9B97AB]">
            Export & backup
          </Text>
          <Text className="mb-3 text-xs text-ink-soft dark:text-[#9B97AB]">
            All data stays on this device. Share a copy to keep a backup.
          </Text>
          <View style={{ rowGap: 12 }}>
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              label="Export as CSV"
              onPress={() => runExport('csv')}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={FileJson}
              label="Export as JSON"
              onPress={() => runExport('json')}
            />
          </View>
        </Card>

        <View className="items-center gap-1 pt-2">
          <Download size={14} color="#8A8699" />
          <Text className="text-xs text-ink-soft dark:text-[#9B97AB]">
            LittleLog · offline-first · your data never leaves the device
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
