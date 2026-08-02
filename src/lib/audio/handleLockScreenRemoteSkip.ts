/**
 * Skip lock screen / notif → file Himba (Redux), sans seek ±10 s.
 * Appelé depuis les events natifs onRemoteNextTrack / onRemotePreviousTrack.
 *
 * Important : playTrackCore → setNowPlaying → replace() sur le même player
 * (AudioPlayerProvider). Ne pas couper la MediaSession.
 */
import { playTrackCore } from '@/lib/audio/playTrackCore';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { store } from '@/store';

export type LockScreenRemoteSkipDirection = 'next' | 'prev';

let cooldownUntil = 0;
let inFlight = false;

const COOLDOWN_MS = 1200;

/** Reset cooldown (tests). */
export function resetLockScreenRemoteSkipCooldown(): void {
  cooldownUntil = 0;
  inFlight = false;
}

/**
 * 1. Lire queue / track / shuffle / repeat depuis le store
 * 2. Choisir voisin
 * 3. playTrackCore (stream + gate + nowPlaying → soft replace)
 */
export function handleLockScreenRemoteSkip(
  direction: LockScreenRemoteSkipDirection,
): void {
  const now = Date.now();
  if (inFlight || now < cooldownUntil) {
    return;
  }

  const { track, queue, shuffle, repeatMode } = store.getState().player;
  if (!track?.id || queue.length === 0) {
    return;
  }

  const opts = { shuffle, repeatMode };
  const target =
    direction === 'next'
      ? pickNextInQueue(queue, track.id, opts)
      : pickPrevInQueue(queue, track.id, opts);

  if (!target || target.id === track.id) {
    return;
  }

  cooldownUntil = now + COOLDOWN_MS;
  inFlight = true;
  void playTrackCore(target, queue).finally(() => {
    inFlight = false;
  });
}
