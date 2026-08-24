import { Pressable, Text, View } from 'react-native';
import { tap } from '../../utils/haptics';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Simple segmented control; selection pill positioned by index (no animation dep). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const widthPct = 100 / options.length;

  return (
    <View
      accessibilityRole="tablist"
      className={`relative flex-row rounded-xl bg-black/5 p-1 dark:bg-white/10 ${className}`}
    >
      <View
        pointerEvents="none"
        className="absolute inset-y-1 rounded-lg bg-card dark:bg-[#3A3745]"
        style={{ width: `${widthPct}%`, left: `${index * widthPct}%` }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                void tap();
                onChange(option.value);
              }
            }}
            className="min-h-[44px] flex-1 items-center justify-center active:opacity-70"
          >
            <Text
              className={`text-sm font-medium ${
                active ? 'text-ink dark:text-[#EDEBF4]' : 'text-ink-soft dark:text-[#9B97AB]'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
