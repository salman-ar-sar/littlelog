import { Text } from 'react-native';

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-base font-semibold text-ink dark:text-[#EFEAE0]">{children}</Text>
  );
}
