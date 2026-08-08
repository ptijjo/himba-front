/**
 * Hydratation / persistance + filtres React pour le masquage reporteur.
 */
import { useCallback, useMemo } from 'react';

import {
  filterHiddenTracks,
  isAlbumHidden,
  isArtistHidden,
  isTrackHidden,
  isUserHidden,
  toHiddenKeySet,
} from '@/lib/reports/hiddenContent';
import {
  loadHiddenContent,
  saveHiddenContent,
  type HiddenContentEntry,
} from '@/lib/reports/hiddenContentStorage';
import type { ReportTargetType } from '@/schemas/reports';
import type { Track } from '@/schemas/tracks';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearHiddenContentState,
  hideReportedContent,
  setHiddenContentHydrated,
} from '@/store/slices/hiddenContentSlice';
import { clearPlayer, setQueue } from '@/store/slices/playerSlice';

export function useHiddenContentKeys(): Set<string> {
  const entries = useAppSelector((s) => s.hiddenContent.entries);
  return useMemo(() => toHiddenKeySet(entries), [entries]);
}

export function useFilterHiddenTracks<T extends Track>(tracks: T[]): T[] {
  const keys = useHiddenContentKeys();
  return useMemo(() => filterHiddenTracks(tracks, keys), [tracks, keys]);
}

export function useIsTrackHidden(track: Track | null | undefined): boolean {
  const keys = useHiddenContentKeys();
  return useMemo(
    () => (track ? isTrackHidden(track, keys) : false),
    [track, keys],
  );
}

export function useHiddenContentActions() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);
  const entries = useAppSelector((s) => s.hiddenContent.entries);
  const player = useAppSelector((s) => s.player);

  const hydrateForUser = useCallback(
    async (id: string) => {
      const loaded = await loadHiddenContent(id);
      dispatch(setHiddenContentHydrated({ userId: id, entries: loaded }));
    },
    [dispatch],
  );

  const reset = useCallback(() => {
    dispatch(clearHiddenContentState());
  }, [dispatch]);

  const hideAndPersist = useCallback(
    async (targetType: ReportTargetType, targetId: string) => {
      if (!userId) {
        return;
      }
      dispatch(hideReportedContent({ targetType, targetId }));
      const next: HiddenContentEntry[] = [
        ...entries.filter(
          (e) => !(e.targetType === targetType && e.targetId === targetId),
        ),
        { targetType, targetId },
      ];
      await saveHiddenContent(userId, next);

      // 1. Retirer de la file
      // 2. Si le titre en cours est masqué (direct ou cascade) → clear player
      const keys = toHiddenKeySet(next);
      const filteredQueue = filterHiddenTracks(player.queue, keys);
      if (player.track && isTrackHidden(player.track, keys)) {
        // Titre en cours masqué → stop complet (évite de laisser l’URL en lecture)
        dispatch(clearPlayer());
      } else if (filteredQueue.length !== player.queue.length) {
        dispatch(setQueue(filteredQueue));
      }
    },
    [dispatch, entries, player.queue, player.track, userId],
  );

  return {
    hydrateForUser,
    reset,
    hideAndPersist,
    isAlbumHidden: (album: { id: string; artistId?: string | null }) =>
      isAlbumHidden(album, toHiddenKeySet(entries)),
    isArtistHidden: (artistId: string) =>
      isArtistHidden(artistId, toHiddenKeySet(entries)),
    isUserHidden: (id: string) => isUserHidden(id, toHiddenKeySet(entries)),
  };
}
