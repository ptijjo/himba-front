/**
 * Hook lecture — 1. GET stream URL 2. hydrater player 3. POST /plays
 * Titre payant sans achat → needsPurchase (CTA Stripe plus tard).
 */
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
} from '@/store/slices/playerSlice';

export function usePlayTrack() {
  const dispatch = useAppDispatch();
  const [fetchStream, { isFetching }] = useLazyGetStreamUrlQuery();
  const [recordPlay] = useRecordPlayMutation();

  async function playTrack(track: Track): Promise<void> {
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
  }

  return { playTrack, isLoading: isFetching };
}
