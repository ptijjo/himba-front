/**
 * Lecteur audio global.
 * 1. Play immédiat : cache local si dispo, sinon stream URL signée
 * 2. Prefetch cache en background pour le prochain play
 * 3. Progress via store externe (pas de setState Provider → pas de jank JS)
 */
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import {
  getCachedTrackUri,
  prefetchTrackAudio,
} from '@/lib/audio/cacheTrackAudio';
import {
  resetPlayerProgress,
  setPlayerProgress,
  usePlayerProgressStore,
} from '@/lib/audio/playerProgressStore';
import { useAppDispatch, useAppSelector } from '@/store';
import { setPlaying } from '@/store/slices/playerSlice';

type PlayerControlsValue = {
  toggle: () => void;
  seekTo: (seconds: number) => Promise<void>;
};

type PlayerProgressValue = {
  currentTime: number;
  duration: number;
};

const PlayerControlsContext = createContext<PlayerControlsValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const streamUrl = useAppSelector((s) => s.player.streamUrl);
  const isPlaying = useAppSelector((s) => s.player.isPlaying);
  const trackId = useAppSelector((s) => s.player.track?.id);
  const trackDurationMs = useAppSelector((s) => s.player.track?.durationMs);

  const metaDurationSec =
    trackDurationMs != null && trackDurationMs > 0
      ? trackDurationMs / 1000
      : 0;
  const metaDurationRef = useRef(metaDurationSec);
  metaDurationRef.current = metaDurationSec;

  const playerRef = useRef<AudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const loadGenRef = useRef(0);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
    });

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      try {
        playerRef.current?.remove();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, []);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      try {
        const t = Number(player.currentTime);
        const d = Number(player.duration);
        const duration =
          Number.isFinite(d) && d > 0
            ? d
            : metaDurationRef.current > 0
              ? metaDurationRef.current
              : 0;
        const currentTime = Number.isFinite(t) ? t : 0;
        setPlayerProgress({ currentTime, duration });
      } catch {
        // player dispose mid-tick
      }
    }, 500);
  }, [stopProgressTimer]);

  const destroyPlayer = useCallback(() => {
    stopProgressTimer();
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    try {
      playerRef.current?.pause();
      playerRef.current?.remove();
    } catch {
      // ignore
    }
    playerRef.current = null;
  }, [stopProgressTimer]);

  // 1. Nouvelle URL → play immédiat (cache hit ou stream), prefetch async
  useEffect(() => {
    destroyPlayer();
    resetPlayerProgress(metaDurationSec);

    if (!streamUrl || !trackId) {
      return;
    }

    const gen = ++loadGenRef.current;
    let cancelled = false;

    try {
      // Cache hit = fichier local ; sinon stream tout de suite (pas d’attente download)
      const cached = getCachedTrackUri(trackId);
      const sourceUri = cached ?? streamUrl;

      const player = createAudioPlayer(
        { uri: sourceUri },
        { updateInterval: 1000 },
      );
      player.volume = 1;

      subscriptionRef.current = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          if (cancelled || gen !== loadGenRef.current) {
            return;
          }
          if (status.didJustFinish) {
            dispatch(setPlaying(false));
            setPlayerProgress({
              currentTime: 0,
              duration:
                Number(status.duration) > 0
                  ? Number(status.duration)
                  : metaDurationRef.current,
            });
          }
        },
      );

      playerRef.current = player;
      startProgressTimer();

      if (isPlayingRef.current) {
        try {
          player.play();
        } catch {
          // ignore
        }
      }

      // Prefetch en background pour le prochain play (sans bloquer)
      if (!cached) {
        prefetchTrackAudio(trackId, streamUrl);
      }
    } catch {
      if (!cancelled && gen === loadGenRef.current) {
        dispatch(setPlaying(false));
      }
    }

    return () => {
      cancelled = true;
      destroyPlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on source change
  }, [streamUrl, trackId, dispatch, destroyPlayer, startProgressTimer]);

  // 2. Play / pause explicite
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    try {
      if (isPlaying) {
        if (!player.playing) {
          player.play();
        }
      } else if (player.playing) {
        player.pause();
      }
    } catch {
      // ignore
    }
  }, [isPlaying]);

  const toggle = useCallback(() => {
    dispatch(setPlaying(!isPlayingRef.current));
  }, [dispatch]);

  const seekTo = useCallback(async (seconds: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const nativeDur = Number(player.duration);
    const fallbackDur = metaDurationRef.current;
    const maxDur =
      Number.isFinite(nativeDur) && nativeDur > 0
        ? nativeDur
        : fallbackDur > 0
          ? fallbackDur
          : Number.POSITIVE_INFINITY;
    const rounded = Math.round(Math.min(Math.max(0, seconds), maxDur));
    try {
      await player.seekTo(rounded);
      setPlayerProgress({
        currentTime: rounded,
        duration:
          Number.isFinite(nativeDur) && nativeDur > 0
            ? nativeDur
            : fallbackDur,
      });
      if (isPlayingRef.current) {
        player.play();
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
