/**
 * Hook lecture — 1. stream (cache → réseau) 2. hydrater player 3. POST /plays
 * Option `queue` : charge la file (playlist) pour prev / next / auto-avance.
 */
import { useCallback } from 'react';

import { getErrorMessage } from '@/lib/errors/apiError';
import {
  getCachedStreamUrl,
  setCachedStreamUrl,
} from '@/lib/audio/streamUrlCache';
import type { Track } from '@/schemas/tracks';
import { useAppDispatch } from '@/store';
import { tracksApi, useRecordPlayMutation } from '@/store/api/tracksApi';
import {
  setNeedsPurchase,
  setNowPlaying,
  setPlayerError,
  setQueue,
} from '@/store/slices/playerSlice';

export type PlayTrackOptions = {
  /** File de lecture ; omis = file = [track]. */
  queue?: Track[];
};

export function usePlayTrack() {
  const dispatch = useAppDispatch();
  const [recordPlay] = useRecordPlayMutation();

  const playTrack = useCallback(
    async (track: Track, options?: PlayTrackOptions): Promise<void> => {
      dispatch(setQueue(options?.queue ?? [track]));

      try {
        // 1. Cache mémoire / RTK → play sans attendre le réseau
        let streamUrl = getCachedStreamUrl(track.id);
        if (!streamUrl) {
          const result = await dispatch(
            tracksApi.endpoints.getStreamUrl.initiate(track.id, {
              forceRefetch: false,
            }),
          );
          if (result.error) {
            throw result.error;
          }
          if (!result.data) {
            throw new Error('URL de stream manquante');
          }
          streamUrl = result.data.url;
          setCachedStreamUrl(
            track.id,
            result.data.url,
            result.data.expiresInSeconds,
          );
        }

        dispatch(setNowPlaying({ track, streamUrl }));
        void recordPlay({ trackId: track.id });
      } catch (error) {
        const status =
          typeof error === 'object' &&
          error !== null &&
          'status' in error
            ? (error as { status?: number }).status
            : undefined;

        if (status === 403) {
          dispatch(setNeedsPurchase({ track }));
          return;
        }

        dispatch(
          setPlayerError(getErrorMessage(error, 'Lecture impossible')),
        );
      }
    },
    [dispatch, recordPlay],
  );

  return { playTrack, isLoading: false };
}
