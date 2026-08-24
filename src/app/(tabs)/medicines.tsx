import { EmptyState } from '@/components/ui';
import { useBabyStore } from '@/stores/babies';
import { Baby as BabyIcon } from 'lucide-react-native';
import { MedicinesScreen } from '@/screens/medicines';

export default function MedicinesRoute() {
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  if (!activeBabyId) {
    return (
      <EmptyState
        icon={BabyIcon}
        title="No baby profile"
        message="Add a profile first to manage medicines."
      />
    );
  }
  return <MedicinesScreen babyId={activeBabyId} />;
}
