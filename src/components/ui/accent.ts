import type { AccentColor } from './chip';

/**
 * Class fragments mapping accent tokens to soft backgrounds and text colors.
 * Source of truth for hex values: tailwind.config.js theme.extend.colors.
 */
export const accentSoftBg: Record<AccentColor, string> = {
  blush: 'bg-blush-soft',
  peach: 'bg-peach-soft',
  mint: 'bg-mint-soft',
  sky: 'bg-sky-soft',
  butter: 'bg-butter-soft',
  lavender: 'bg-lavender-soft',
};

export const accentText: Record<AccentColor, string> = {
  blush: 'text-blush',
  peach: 'text-peach',
  mint: 'text-mint',
  sky: 'text-sky',
  butter: 'text-butter',
  lavender: 'text-lavender',
};
