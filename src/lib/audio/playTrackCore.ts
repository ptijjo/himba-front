/**
 * Lecture hors hooks — utilisable depuis le PlaybackService RNTP (headless).
 * 1. setQueue  2. résoudre stream (cache → API)  3. setNowPlaying / erreurs
 * 4. POST /plays (y compris skip lock screen)
 */
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  getCachedStreamUrl,
  setCachedStreamUrl,
} from '@/lib/audio/streamUrlCache';
import type { Track } from '@/schemas/tracks';
import { store } from '@/store';
import { tracksApi } from '@/store/api/tracksApi';
import {
  setNeedsPurchase,
  setNowPlaying,
  setPlayerError,
  setQueue,
} from '@/store/slices/playerSlice';

export async function playTrackCore(
  track: Track,
  queue?: Track[],
): Promise<void> {
  const dispatch = store.dispatch;
  dispatch(setQueue(queue ?? [track]));

  try {
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
    void dispatch(tracksApi.endpoints.recordPlay.initiate({ trackId: track.id }));
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: number }).status
        : undefined;

    if (status === 403) {
      dispatch(setNeedsPurchase({ track }));
      return;
    }

    dispatch(setPlayerError(getErrorMessage(error, 'Lecture impossible')));
  }
}
