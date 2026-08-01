/**
 * Prefetch stream + fichier local pour prev/next — swipe quasi immédiat.
 */
import { useEffect, useRef } from 'react';

import { prefetchTrackAudio } from '@/lib/audio/cacheTrackAudio';
import {
  getCachedStreamUrl,
  setCachedStreamUrl,
} from '@/lib/audio/streamUrlCache';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { useAppDispatch, useAppSelector, type AppDispatch } from '@/store';
import { tracksApi } from '@/store/api/tracksApi';

async function prefetchOne(
  dispatch: AppDispatch,
  trackId: string,
): Promise<void> {
  if (getCachedStreamUrl(trackId)) {
    return;
  }
  try {
    const result = await dispatch(
      tracksApi.endpoints.getStreamUrl.initiate(trackId, {
        forceRefetch: false,
      }),
    );
    if ('data' in result && result.data) {
      setCachedStreamUrl(
        trackId,
        result.data.url,
        result.data.expiresInSeconds,
      );
      prefetchTrackAudio(trackId, result.data.url);
    }
  } catch {
    // silencieux — play demandera le stream à nouveau
  }
}

export function PrefetchQueueNeighbors() {
  const dispatch = useAppDispatch();
  const trackId = useAppSelector((s) => s.player.track?.id);
  const queue = useAppSelector((s) => s.player.queue);
  const shuffle = useAppSelector((s) => s.player.shuffle);
  const repeatMode = useAppSelector((s) => s.player.repeatMode);
  const lastKey = useRef<string>('');

  useEffect(() => {
    if (!trackId || queue.length === 0) {
      return;
    }
    const key = `${trackId}:${queue.length}:${shuffle}:${repeatMode}`;
    if (key === lastKey.current) {
      return;
    }
    lastKey.current = key;

    const opts = { shuffle, repeatMode };
    const next = pickNextInQueue(queue, trackId, opts);
    const prev = pickPrevInQueue(queue, trackId, opts);
    const ids = [next?.id, prev?.id].filter(
      (id): id is string => Boolean(id) && id !== trackId,
    );

    for (const id of ids) {
      void prefetchOne(dispatch, id);
    }
  }, [trackId, queue, shuffle, repeatMode, dispatch]);

  return null;
}
