import { Button } from './button';
import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 dark:border-[#35323F]">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-sky-soft">
        <Icon size={28} color="#82B4DC" />
      </View>
      <Text className="text-base font-semibold text-ink dark:text-[#EDEBF4]">{title}</Text>
      <Text className="text-center text-sm text-ink-soft dark:text-[#9B97AB]">{message}</Text>
      {actionLabel && onAction ? (
        <Button variant="ghost" size="sm" label={actionLabel} onPress={onAction} className="mt-1" />
      ) : null}
    </View>
  );
}
