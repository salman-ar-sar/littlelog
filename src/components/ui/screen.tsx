import { Platform, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & { className?: string };

/** Base screen wrapper: safe area + paper background + horizontal padding. */
export function Screen({ className = '', style, children, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'ios' ? Math.max(insets.top, 20) : insets.top;

  return (
    <View
      {...props}
      style={[{ paddingTop: topPadding }, style]}
      className={`flex-1 bg-paper px-4 dark:bg-[#1B1916] ${className}`}
    >
      {children}
    </View>
  );
}
