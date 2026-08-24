import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/stores/toast';

/** Bottom-floating "Nappy logged — Undo" toast; auto-dismisses after 3s. */
export function UndoToast() {
  const message = useToastStore((s) => s.message);
  const undo = useToastStore((s) => s.undo);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (!message) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-4 right-4 z-50"
      style={{ bottom: 96 + insets.bottom }}
    >
      <View className="flex-row items-center justify-between rounded-xl bg-ink px-4 py-3 shadow-lg">
        <Text className="text-sm font-sans-medium text-paper">{message}</Text>
        {undo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Undo last entry"
            onPress={() => {
              void undo();
              dismiss();
            }}
            className="ml-3 active:opacity-60"
          >
            <Text className="font-sans-bold text-sm text-peach-soft">Undo</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
