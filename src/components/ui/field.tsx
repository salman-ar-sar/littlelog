import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Labeled form row wrapper. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-ink dark:text-[#EDEBF4]">{label}</Text>
      {children}
      {hint ? <Text className="text-xs text-ink-soft dark:text-[#9B97AB]">{hint}</Text> : null}
    </View>
  );
}
