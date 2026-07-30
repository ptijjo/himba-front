/**
 * À la fin d’un titre → enchaîne le suivant dans la file (shuffle / repeat).
 */
import { useEffect, useRef } from 'react';

import { usePlayTrack } from '@/hooks/usePlayTrack';
import { pickNextInQueue } from '@/lib/player/queueNavigation';
import { useAppSelector } from '@/store';

export function PlayerQueueAutoAdvance() {
  const { playTrack } = usePlayTrack();
  const trackEndedNonce = useAppSelector((s) => s.player.trackEndedNonce);
  const track = useAppSelector((s) => s.player.track);
  const queue = useAppSelector((s) => s.player.queue);
  const shuffle = useAppSelector((s) => s.player.shuffle);
  const repeatMode = useAppSelector((s) => s.player.repeatMode);
  const lastNonce = useRef(0);

  useEffect(() => {
    if (trackEndedNonce === 0 || trackEndedNonce === lastNonce.current) {
      return;
    }
    lastNonce.current = trackEndedNonce;

    const next = pickNextInQueue(queue, track?.id, { shuffle, repeatMode });
    if (next) {
      void playTrack(next, { queue });
    }
  }, [
    trackEndedNonce,
    track?.id,
    queue,
    shuffle,
    repeatMode,
    playTrack,
  ]);

  return null;
}
