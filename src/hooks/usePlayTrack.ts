/**
 * Hook lecture — 1. GET stream URL 2. hydrater player 3. POST /plays
 * Option `queue` : charge la file (playlist) pour prev / next / auto-avance.
 */
import { useCallback } from 'react';

import { getErrorMessage } from '@/lib/errors/apiError';
import type { Track } from '@/schemas/tracks';
import { useAppDispatch } from '@/store';
import {
  useLazyGetStreamUrlQuery,
  useRecordPlayMutation,
} from '@/store/api/tracksApi';
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
  const [fetchStream, { isFetching }] = useLazyGetStreamUrlQuery();
  const [recordPlay] = useRecordPlayMutation();

  const playTrack = useCallback(
    async (track: Track, options?: PlayTrackOptions): Promise<void> => {
      // 1. Fixer la file avant le stream (prev/next cohérents)
      dispatch(setQueue(options?.queue ?? [track]));

      try {
        const signed = await fetchStream(track.id).unwrap();
        dispatch(setNowPlaying({ track, streamUrl: signed.url }));
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
    [dispatch, fetchStream, recordPlay],
  );

  return { playTrack, isLoading: isFetching };
}
