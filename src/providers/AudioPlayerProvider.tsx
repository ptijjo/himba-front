/**
 * Lecteur audio global via react-native-track-player.
 * 1. Redux (streamUrl / track / isPlaying) = source de vérité métier
 * 2. RNTP charge 1 piste + notif / lock screen (prev / next réels)
 * 3. Progress via PlaybackProgressUpdated → store externe (pas de jank)
 * 4. Fin de piste → markTrackEnded → PlayerQueueAutoAdvance
 *
 * Les Remote* (lock screen) sont gérés dans src/services/playbackService.ts
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import TrackPlayer, {
  Event,
  State,
  type PlaybackState,
} from 'react-native-track-player';

import { PlayerQueueAutoAdvance } from '@/components/player/PlayerQueueAutoAdvance';
import { PrefetchQueueNeighbors } from '@/components/player/PrefetchQueueNeighbors';
import {
  getCachedTrackUri,
  prefetchTrackAudio,
} from '@/lib/audio/cacheTrackAudio';
import {
  resetPlayerProgress,
  setPlayerProgress,
  usePlayerProgressStore,
} from '@/lib/audio/playerProgressStore';
import { ensureTrackPlayerReady } from '@/lib/audio/trackPlayerSetup';
import { useAppDispatch, useAppSelector } from '@/store';
import { markTrackEnded, setPlaying } from '@/store/slices/playerSlice';

type PlayerControlsValue = {
  toggle: () => void;
  seekTo: (seconds: number) => Promise<void>;
};

type PlayerProgressValue = {
  currentTime: number;
  duration: number;
};

const PlayerControlsContext = createContext<PlayerControlsValue | null>(null);

const isNativePlayer = Platform.OS === 'ios' || Platform.OS === 'android';

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const streamUrl = useAppSelector((s) => s.player.streamUrl);
  const isPlaying = useAppSelector((s) => s.player.isPlaying);
  const track = useAppSelector((s) => s.player.track);
  const trackId = track?.id;
  const trackDurationMs = track?.durationMs;

  const metaDurationSec =
    trackDurationMs != null && trackDurationMs > 0
      ? trackDurationMs / 1000
      : 0;
  const metaDurationRef = useRef(metaDurationSec);
  metaDurationRef.current = metaDurationSec;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const loadGenRef = useRef(0);
  const loadedTrackIdRef = useRef<string | null>(null);
  /** Ignore les status issus de nos propres play()/pause() (évite la boucle Redux ↔ natif). */
  const ignorePlayingSyncRef = useRef(false);

  // Setup RNTP une fois (natif uniquement)
  useEffect(() => {
    if (!isNativePlayer) {
      return;
    }
    void ensureTrackPlayerReady().catch(() => {
      // Expo Go / module natif absent
    });
  }, []);

  // Progress + fin de piste + sync play/pause depuis notif / casque
  useEffect(() => {
    if (!isNativePlayer) {
      return;
    }

    const progressSub = TrackPlayer.addEventListener(
      Event.PlaybackProgressUpdated,
      (event) => {
        const duration =
          event.duration > 0
            ? event.duration
            : metaDurationRef.current > 0
              ? metaDurationRef.current
              : 0;
        setPlayerProgress({
          currentTime: event.position,
          duration,
        });
      },
    );

    const queueEndedSub = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      () => {
        dispatch(markTrackEnded());
        setPlayerProgress({
          currentTime: 0,
          duration: metaDurationRef.current,
        });
      },
    );

    const stateSub = TrackPlayer.addEventListener(
      Event.PlaybackState,
      (event: PlaybackState) => {
        if (ignorePlayingSyncRef.current) {
          return;
        }
        const playing = event.state === State.Playing;
        const pausedLike =
          event.state === State.Paused ||
          event.state === State.Stopped ||
          event.state === State.Ready;
        if (playing && !isPlayingRef.current) {
          dispatch(setPlaying(true));
        } else if (pausedLike && isPlayingRef.current) {
          dispatch(setPlaying(false));
        }
      },
    );

    return () => {
      progressSub.remove();
      queueEndedSub.remove();
      stateSub.remove();
    };
  }, [dispatch]);

  // 1. Nouvelle URL → reset RNTP + add + play
  useEffect(() => {
    if (!isNativePlayer) {
      return;
    }

    const gen = ++loadGenRef.current;
    let cancelled = false;

    const run = async () => {
      resetPlayerProgress(metaDurationSec);

      if (!streamUrl || !trackId || !track) {
        loadedTrackIdRef.current = null;
        try {
          await ensureTrackPlayerReady();
          await TrackPlayer.reset();
        } catch {
          // ignore
        }
        return;
      }

      try {
        await ensureTrackPlayerReady();
        if (cancelled || gen !== loadGenRef.current) {
          return;
        }

        const cached = getCachedTrackUri(trackId);
        const sourceUri = cached ?? streamUrl;

        await TrackPlayer.reset();
        loadedTrackIdRef.current = null;
        await TrackPlayer.add({
          id: trackId,
          url: sourceUri,
          title: track.title,
          artist: track.artist?.displayName ?? 'Himba',
          artwork: track.coverUrl ?? undefined,
          duration: metaDurationSec > 0 ? metaDurationSec : undefined,
        });

        if (cancelled || gen !== loadGenRef.current) {
          return;
        }

        loadedTrackIdRef.current = trackId;

        if (isPlayingRef.current) {
          ignorePlayingSyncRef.current = true;
          await TrackPlayer.play();
          setTimeout(() => {
            ignorePlayingSyncRef.current = false;
          }, 500);
        }

        if (!cached) {
          prefetchTrackAudio(trackId, streamUrl);
        }
      } catch {
        if (!cancelled && gen === loadGenRef.current) {
          loadedTrackIdRef.current = null;
          dispatch(setPlaying(false));
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on source change
  }, [streamUrl, trackId, dispatch, metaDurationSec]);

  // 2. Play / pause UI ↔ RNTP (hors chargement initial — géré par l’effet URL)
  useEffect(() => {
    if (!isNativePlayer || !streamUrl || !trackId) {
      return;
    }
    if (loadedTrackIdRef.current !== trackId) {
      return;
    }

    let unlockTimer: ReturnType<typeof setTimeout> | null = null;

    const sync = async () => {
      try {
        await ensureTrackPlayerReady();
        ignorePlayingSyncRef.current = true;
        if (isPlaying) {
          await TrackPlayer.play();
        } else {
          await TrackPlayer.pause();
        }
      } catch {
        // ignore
      }
      unlockTimer = setTimeout(() => {
        ignorePlayingSyncRef.current = false;
      }, 400);
    };

    void sync();

    return () => {
      if (unlockTimer) {
        clearTimeout(unlockTimer);
      }
    };
  }, [isPlaying, streamUrl, trackId]);

  const toggle = useCallback(() => {
    dispatch(setPlaying(!isPlayingRef.current));
  }, [dispatch]);

  const seekTo = useCallback(async (seconds: number) => {
    if (!isNativePlayer) {
      return;
    }
    const fallbackDur = metaDurationRef.current;
    const maxDur =
      fallbackDur > 0 ? fallbackDur : Number.POSITIVE_INFINITY;
    const rounded = Math.min(Math.max(0, seconds), maxDur);
    try {
      await ensureTrackPlayerReady();
      await TrackPlayer.seekTo(rounded);
      setPlayerProgress({
        currentTime: rounded,
        duration: fallbackDur,
      });
      if (isPlayingRef.current) {
        ignorePlayingSyncRef.current = true;
        await TrackPlayer.play();
        setTimeout(() => {
          ignorePlayingSyncRef.current = false;
        }, 400);
      }
    } catch {
      // seek pas encore possible
    }
  }, []);

  const controls = useMemo(
    () => ({ toggle, seekTo }),
    [toggle, seekTo],
  );

  return (
    <PlayerControlsContext.Provider value={controls}>
      <PlayerQueueAutoAdvance />
      <PrefetchQueueNeighbors />
      {children}
    </PlayerControlsContext.Provider>
  );
}

/** Play / pause / seek — stable (pas de re-render à chaque tick). */
export function useAudioPlayerControls(): PlayerControlsValue {
  const ctx = useContext(PlayerControlsContext);
  if (!ctx) {
    throw new Error('useAudioPlayerControls hors AudioPlayerProvider');
  }
  return ctx;
}

/** Position / durée — store externe, re-render ciblé. */
export function useAudioPlayerProgress(): PlayerProgressValue {
  return usePlayerProgressStore();
}
