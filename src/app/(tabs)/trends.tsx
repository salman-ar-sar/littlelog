import { EmptyState } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import { Baby as BabyIcon } from 'lucide-react-native';
import { TrendsScreen } from '@/screens/trends';

export default function TrendsRoute() {
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  if (!activeBabyId) {
    return (
      <EmptyState
        icon={BabyIcon}
        title="No baby profile"
        message="Add a profile first to see trends."
      />
    );
  }
  return <TrendsScreen babyId={activeBabyId} />;
}
