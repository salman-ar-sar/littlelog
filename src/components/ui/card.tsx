import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  /** Accessibility label when the card is pressable. */
  accessibilityLabel?: string;
}

export function Card({ children, className = '', onPress, accessibilityLabel }: CardProps) {
  const base =
    'bg-card dark:bg-[#26242F] rounded-2xl border border-line dark:border-[#35323F]';
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className={`${base} active:opacity-80 ${className}`}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={`${base} ${className}`}>{children}</View>;
}
