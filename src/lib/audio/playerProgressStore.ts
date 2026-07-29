/**
 * Store externe progression lecteur — useSyncExternalStore.
 * Évite setState sur le Provider (sinon toute l’app re-render = audio saccadé).
 */
import { useSyncExternalStore } from 'react';

export type PlayerProgressSnapshot = {
  currentTime: number;
  duration: number;
};

let snapshot: PlayerProgressSnapshot = { currentTime: 0, duration: 0 };
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getPlayerProgressSnapshot(): PlayerProgressSnapshot {
  return snapshot;
}

export function subscribePlayerProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPlayerProgress(next: PlayerProgressSnapshot): void {
  if (
    next.currentTime === snapshot.currentTime &&
    next.duration === snapshot.duration
  ) {
    return;
  }
  snapshot = next;
  emit();
}

export function resetPlayerProgress(duration = 0): void {
  snapshot = { currentTime: 0, duration };
  emit();
}

/** Hook UI — seuls les composants abonnés re-render. */
export function usePlayerProgressStore(): PlayerProgressSnapshot {
  return useSyncExternalStore(
    subscribePlayerProgress,
    getPlayerProgressSnapshot,
    getPlayerProgressSnapshot,
  );
}
