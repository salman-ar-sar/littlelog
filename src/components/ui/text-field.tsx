import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & { className?: string };

export function TextField({ className = '', ...props }: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor="#8A8699"
      {...props}
      className={`h-12 rounded-xl border border-line bg-card px-3 text-base text-ink dark:border-[#35323F] dark:bg-[#26242F] dark:text-[#EDEBF4] ${className}`}
    />
  );
}
