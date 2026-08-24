import { Pressable, Text } from 'react-native';
import { tap } from '../../utils/haptics';

export type AccentColor = 'blush' | 'peach' | 'mint' | 'sky' | 'butter' | 'lavender';

interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  color?: AccentColor;
  disabled?: boolean;
}

/** Soft-tinted selection chip. Selected = accent-soft bg + accent border/text. */
export function Chip({ label, selected = false, onSelect, color = 'sky', disabled }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={() => {
        void tap();
        onSelect?.(!selected);
      }}
      className={`min-h-[44px] rounded-full border px-4 justify-center active:opacity-70 ${
        selected ? chipSelected[color] : chipIdle
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? chipText[color] : chipTextIdle}`}>
        {label}
      </Text>
    </Pressable>
  );
}

// Source of truth for hex values: tailwind.config.js theme.extend.colors
const chipSelected: Record<AccentColor, string> = {
  blush: 'bg-blush-soft border-blush',
  peach: 'bg-peach-soft border-peach',
  mint: 'bg-mint-soft border-mint',
  sky: 'bg-sky-soft border-sky',
  butter: 'bg-butter-soft border-butter',
  lavender: 'bg-lavender-soft border-lavender',
};

const chipIdle =
  'bg-card border-line dark:bg-[#26221D] dark:border-[#38332B]';

const chipText: Record<AccentColor, string> = {
  blush: 'text-blush',
  peach: 'text-peach',
  mint: 'text-mint',
  sky: 'text-sky',
  butter: 'text-butter',
  lavender: 'text-lavender',
};

const chipTextIdle = 'text-ink-soft dark:text-[#9C937F]';
