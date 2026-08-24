import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

interface NumberFieldProps {
  value: number | undefined;
  onChangeValue: (value: number | undefined) => void;
  suffix?: string;
  placeholder?: string;
}

/** Numeric input; empty string maps to undefined. */
export function NumberField({ value, onChangeValue, suffix, placeholder }: NumberFieldProps) {
  const [raw, setRaw] = useState(value === undefined ? '' : String(value));

  const handleChange = (text: string) => {
    // Allow digits and one decimal point only.
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setRaw(cleaned);
    const parsed = Number.parseFloat(cleaned);
    onChangeValue(Number.isNaN(parsed) ? undefined : parsed);
  };

  return (
    <View className="h-12 flex-row items-center rounded-xl border border-line bg-card px-3 dark:border-[#35323F] dark:bg-[#26242F]">
      <TextInput
        accessibilityLabel={placeholder}
        keyboardType="decimal-pad"
        value={raw}
        onChangeText={handleChange}
        placeholder={placeholder ?? '0'}
        placeholderTextColor="#8A8699"
        className="flex-1 text-base text-ink dark:text-[#EDEBF4]"
      />
      {suffix ? (
        <Text className="ml-2 text-sm font-medium text-ink-soft dark:text-[#9B97AB]">{suffix}</Text>
      ) : null}
    </View>
  );
}
