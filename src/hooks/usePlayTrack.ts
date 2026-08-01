/**
 * Hook lecture — délègue à playTrackCore (même chemin que le PlaybackService).
 */
import { useCallback } from 'react';

import { playTrackCore } from '@/lib/audio/playTrackCore';
import type { Track } from '@/schemas/tracks';

export type PlayTrackOptions = {
  /** File de lecture ; omis = file = [track]. */
  queue?: Track[];
};

export function usePlayTrack() {
  const playTrack = useCallback(
    async (track: Track, options?: PlayTrackOptions): Promise<void> => {
      await playTrackCore(track, options?.queue);
    },
    [],
  );

  return { playTrack, isLoading: false };
}
