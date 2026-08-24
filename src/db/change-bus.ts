type Listener = () => void;

const listeners = new Set<Listener>();

/** Notify all reactive queries that the database changed. Call after every write. */
export function notifyDbChanged(): void {
  for (const fn of listeners) fn();
}

/** Subscribe to db changes. Returns an unsubscribe function. */
export function onDbChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
