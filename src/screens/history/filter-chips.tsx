import { View } from 'react-native';
import { Chip } from '@/components/ui';

export type TrackerFilter =
  | 'all'
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'bath'
  | 'weight'
  | 'dose';

const FILTERS: { value: TrackerFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'diaper', label: 'Diaper' },
  { value: 'bath', label: 'Bath' },
  { value: 'weight', label: 'Weight' },
  { value: 'dose', label: 'Meds' },
];

export function FilterChips({
  value,
  onChange,
}: {
  value: TrackerFilter;
  onChange: (v: TrackerFilter) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Chip
          key={f.value}
          label={f.label}
          selected={value === f.value}
          onSelect={() => onChange(f.value)}
          color="peach"
        />
      ))}
    </View>
  );
}
