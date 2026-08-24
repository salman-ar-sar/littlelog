import { EmptyState } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import { Baby as BabyIcon } from 'lucide-react-native';
import { HistoryScreen } from '@/screens/history';

export default function HistoryRoute() {
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  if (!activeBabyId) {
    return (
      <EmptyState
        icon={BabyIcon}
        title="No baby profile"
        message="Add a profile first to see history and insights."
      />
    );
  }
  return <HistoryScreen babyId={activeBabyId} />;
}
