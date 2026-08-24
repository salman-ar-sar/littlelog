import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

type ScreenProps = SafeAreaViewProps & { className?: string };

/** Base screen wrapper: safe area + paper background + horizontal padding. */
export function Screen({ className = '', children, ...props }: ScreenProps) {
  return (
    <SafeAreaView
      {...props}
      edges={['top']}
      className={`flex-1 bg-paper px-4 dark:bg-[#1C1B22] ${className}`}
    >
      {children}
    </SafeAreaView>
  );
}
