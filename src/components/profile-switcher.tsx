import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronDown, Plus, Settings2 } from 'lucide-react-native';
import { Avatar } from '@/components/ui/avatar';
import { useBabyStore } from '@/stores/babies';
import { formatAge } from '@/utils/age';

/**
 * Header widget: active baby's avatar/name/age. Tap to open a dropdown
 * for switching profiles, editing the current one, or adding a new baby.
 */
export function ProfileSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const setActiveBaby = useBabyStore((s) => s.setActiveBaby);

  const active = babies.find((b) => b.id === activeBabyId) ?? babies[0];

  return (
    <View className="relative">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Active baby ${active?.name ?? 'none'}. Tap to switch profile`}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-3 rounded-2xl px-1 py-1 active:opacity-70"
      >
        <Avatar uri={active?.photoUri} name={active?.name ?? 'Add'} size={44} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="text-lg font-bold text-ink dark:text-[#EFEAE0]" numberOfLines={1}>
              {active?.name ?? 'Add a baby'}
            </Text>
            <ChevronDown size={16} color="#8A8699" />
          </View>
          {active ? (
            <Text className="text-xs text-ink-soft dark:text-[#9C937F]">
              {formatAge(active.dateOfBirth)}
            </Text>
          ) : (
            <Text className="text-xs text-ink-soft dark:text-[#9C937F]">Tap here to start</Text>
          )}
        </View>
      </Pressable>

      {open ? (
        <>
          {/* Dismiss layer */}
          <Pressable
            accessibilityLabel="Close switcher"
            onPress={() => setOpen(false)}
            className="absolute -inset-24 z-10"
          />
          <View className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-line bg-card p-2 shadow-lg dark:border-[#38332B] dark:bg-[#26221D]">
            {babies.map((baby) => {
              const isActive = baby.id === (active?.id ?? null);
              return (
                <Pressable
                  key={baby.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${baby.name}`}
                  onPress={() => {
                    setActiveBaby(baby.id);
                    setOpen(false);
                  }}
                  className="min-h-[48px] flex-row items-center gap-3 rounded-xl px-2 active:bg-black/5 dark:active:bg-white/10"
                >
                  <Avatar uri={baby.photoUri} name={baby.name} size={32} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink dark:text-[#EFEAE0]">
                      {baby.name}
                    </Text>
                    <Text className="text-xs text-ink-soft dark:text-[#9C937F]">
                      {formatAge(baby.dateOfBirth)}
                    </Text>
                  </View>
                  {isActive ? <Check size={18} color="#79C4A4" /> : null}
                </Pressable>
              );
            })}
            <View className="my-1 h-px bg-line dark:bg-[#38332B]" />
            <SwitcherAction
              label="Edit profile"
              icon={<Settings2 size={16} color="#8A8699" />}
              onPress={() => {
                setOpen(false);
                router.push(active ? `/baby/${active.id}/edit` : '/baby/new/edit');
              }}
            />
            <SwitcherAction
              label="Add another baby"
              icon={<Plus size={16} color="#8A8699" />}
              onPress={() => {
                setOpen(false);
                router.push('/baby/new/edit');
              }}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

function SwitcherAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[48px] flex-row items-center gap-2 rounded-xl px-3 active:bg-black/5 dark:active:bg-white/10"
    >
      {icon}
      <Text className="text-sm text-ink dark:text-[#EFEAE0]">{label}</Text>
    </Pressable>
  );
}
