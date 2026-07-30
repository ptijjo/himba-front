import type { Track } from '@/schemas/tracks';
import type { RepeatMode } from '@/store/slices/playerSlice';

export function pickRandomTrack(
  tracks: Track[],
  excludeId?: string,
): Track | null {
  if (tracks.length === 0) {
    return null;
  }
  if (tracks.length === 1) {
    return tracks[0] ?? null;
  }
  const pool = excludeId
    ? tracks.filter((t) => t.id !== excludeId)
    : tracks;
  if (pool.length === 0) {
    return tracks[0] ?? null;
  }
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? null;
}

/** Titre suivant dans la file (shuffle / repeat all). */
export function pickNextInQueue(
  queue: Track[],
  currentId: string | undefined,
  options: { shuffle: boolean; repeatMode: RepeatMode },
): Track | null {
  if (queue.length === 0) {
    return null;
  }
  if (options.repeatMode === 'one' && currentId) {
    return queue.find((t) => t.id === currentId) ?? queue[0] ?? null;
  }
  if (options.shuffle) {
    return pickRandomTrack(queue, currentId);
  }
  if (!currentId) {
    return queue[0] ?? null;
  }
  const idx = queue.findIndex((t) => t.id === currentId);
  if (idx < 0) {
    return queue[0] ?? null;
  }
  const next = queue[idx + 1];
  if (next) {
    return next;
  }
  return options.repeatMode === 'all' ? (queue[0] ?? null) : null;
}

/** Titre précédent dans la file. */
export function pickPrevInQueue(
  queue: Track[],
  currentId: string | undefined,
  options: { shuffle: boolean; repeatMode: RepeatMode },
): Track | null {
  if (queue.length === 0) {
    return null;
  }
  if (options.repeatMode === 'one' && currentId) {
    return queue.find((t) => t.id === currentId) ?? queue[0] ?? null;
  }
  if (options.shuffle) {
    return pickRandomTrack(queue, currentId);
  }
  if (!currentId) {
    return queue[queue.length - 1] ?? null;
  }
  const idx = queue.findIndex((t) => t.id === currentId);
  if (idx < 0) {
    return queue[queue.length - 1] ?? null;
  }
  if (idx === 0) {
    return options.repeatMode === 'all'
      ? (queue[queue.length - 1] ?? null)
      : null;
  }
  return queue[idx - 1] ?? null;
}
