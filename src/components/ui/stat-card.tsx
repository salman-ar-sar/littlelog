import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { AccentColor } from './chip';
import { accentSoftBg, accentText } from './accent';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: AccentColor;
  className?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = 'sky',
  className = '',
}: StatCardProps) {
  return (
    <View
      className={`flex-1 rounded-2xl border border-line bg-card p-3 dark:border-[#38332B] dark:bg-[#26221D] ${className}`}
    >
      <View className="flex-row items-center gap-2">
        {Icon ? (
          <View className={`h-8 w-8 items-center justify-center rounded-full ${accentSoftBg[accent]}`}>
            <Icon size={16} color={accentHex[accent]} />
          </View>
        ) : null}
        <Text className="text-xs font-medium text-ink-soft dark:text-[#9C937F]">{label}</Text>
      </View>
      <Text className="mt-2 text-xl font-bold text-ink dark:text-[#EFEAE0]">{value}</Text>
      {sublabel ? (
        <Text className="mt-0.5 text-xs text-ink-soft dark:text-[#9C937F]" numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}

// Source of truth for hex values: tailwind.config.js theme.extend.colors
const accentHex: Record<AccentColor, string> = {
  blush: '#F2A7B3',
  peach: '#F0A47E',
  mint: '#79C4A4',
  sky: '#82B4DC',
  butter: '#EFC368',
  lavender: '#A99BD8',
};

export { accentSoftBg, accentText };
