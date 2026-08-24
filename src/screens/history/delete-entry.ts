import type { TimelineItem } from '@/db/queries';
import { deleteBath } from '@/db/baths';
import { deleteDiaper } from '@/db/diapers';
import { deleteDose } from '@/db/doses';
import { deleteFeeding } from '@/db/feedings';
import { deleteSleep } from '@/db/sleep';
import { deleteWeight } from '@/db/weights';

export async function deleteEntry(item: TimelineItem): Promise<void> {
  switch (item.kind) {
    case 'feed':
      await deleteFeeding(item.id);
      break;
    case 'sleep':
      await deleteSleep(item.id);
      break;
    case 'diaper':
      await deleteDiaper(item.id);
      break;
    case 'bath':
      await deleteBath(item.id);
      break;
    case 'weight':
      await deleteWeight(item.id);
      break;
    case 'dose':
      await deleteDose(item.id);
      break;
  }
}
