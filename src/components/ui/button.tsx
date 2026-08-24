import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, { container: string; label: string }> = {
  primary: { container: 'bg-peach', label: 'text-white' },
  secondary: {
    container: 'bg-blush-soft dark:bg-[#2A2833] border border-blush',
    label: 'text-ink dark:text-[#EDEBF4]',
  },
  ghost: {
    container: 'bg-transparent border border-line dark:border-[#35323F]',
    label: 'text-ink dark:text-[#EDEBF4]',
  },
  danger: { container: 'bg-blush', label: 'text-white' },
};

const SIZE: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'min-h-[40px] px-3 py-2 rounded-xl', text: 'text-sm' },
  md: { container: 'min-h-[48px] px-4 py-3 rounded-2xl', text: 'text-base' },
  lg: { container: 'min-h-[56px] px-6 py-4 rounded-2xl', text: 'text-lg' },
};

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  label,
  icon: Icon,
  onPress,
  className = '',
  style,
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={style}
      className={`flex-row items-center justify-center gap-2 ${v.container} ${s.container} ${
        isDisabled ? 'opacity-40' : 'active:opacity-70'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <>
          {Icon ? <Icon size={size === 'lg' ? 20 : 16} color={iconColor(variant)} /> : null}
          <Text className={`${s.text} font-semibold ${v.label}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function iconColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    default:
      return '#3D3A4A'; // ink — source of truth: tailwind.config.js
  }
}
