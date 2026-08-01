/**
 * Lecteur audio global.
 * 1. Play immédiat : cache local si dispo, sinon stream URL signée
 * 2. Prefetch cache en background pour le prochain play
 * 3. Progress via store externe (pas de setState Provider → pas de jank JS)
 * 4. Mini-lecteur système : play/pause + prev/next (+ barre Media3)
 *
 * Important : ne pas rappeler setActiveForLockScreen à chaque play/pause
 * (sinon la notif se détruit / se recrée et l’UI entre en boucle).
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
import { AppState } from 'react-native';

import { PlayerLockScreenSkipBridge } from '@/components/player/PlayerLockScreenSkipBridge';
import { PlayerQueueAutoAdvance } from '@/components/player/PlayerQueueAutoAdvance';
import { PrefetchQueueNeighbors } from '@/components/player/PrefetchQueueNeighbors';
import {
  getCachedTrackUri,
  prefetchTrackAudio,
} from '@/lib/audio/cacheTrackAudio';
import { lockScreenMetadataFromTrack } from '@/lib/audio/lockScreenMetadata';
import {
  resetPlayerProgress,
  setPlayerProgress,
  usePlayerProgressStore,
} from '@/lib/audio/playerProgressStore';
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

  const playerRef = useRef<AudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const loadGenRef = useRef(0);
  const trackRef = useRef(track);
  trackRef.current = track;
  /** Ignore les status issus de nos propres play()/pause() (évite la boucle Redux ↔ natif). */
  const ignorePlayingSyncRef = useRef(false);
  const lockScreenActiveRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
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
        playerRef.current?.clearLockScreenControls();
        playerRef.current?.remove();
      } catch {
        // ignore
      }
      playerRef.current = null;
      lockScreenActiveRef.current = false;
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

  /** Active la notif média une seule fois par instance de player. */
  const activateLockScreenOnce = useCallback((player: AudioPlayer) => {
    const current = trackRef.current;
    if (!current || lockScreenActiveRef.current) {
      return;
    }
    try {
      // Icônes skip = seek ±10 s natif ; PlayerLockScreenSkipBridge → prev/next file.
      // Barre de progression : fournie par Media3 (session liée au player).
      player.setActiveForLockScreen(
        true,
        lockScreenMetadataFromTrack(current),
        { showSeekForward: true, showSeekBackward: true },
      );
      lockScreenActiveRef.current = true;
    } catch {
      // Expo Go / web
    }
  }, []);

  const destroyPlayer = useCallback(() => {
    stopProgressTimer();
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    try {
      if (lockScreenActiveRef.current) {
        playerRef.current?.clearLockScreenControls();
      }
      playerRef.current?.pause();
      playerRef.current?.remove();
    } catch {
      // ignore
    }
    playerRef.current = null;
    lockScreenActiveRef.current = false;
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
    let lockScreenTimer: ReturnType<typeof setTimeout> | null = null;
    let syncUnlockTimer: ReturnType<typeof setTimeout> | null = null;

    try {
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
            dispatch(markTrackEnded());
            setPlayerProgress({
              currentTime: 0,
              duration:
                Number(status.duration) > 0
                  ? Number(status.duration)
                  : metaDurationRef.current,
            });
            return;
          }
          // Sync play/pause depuis la notif — seulement hors app, et pas pendant nos commandes
          if (ignorePlayingSyncRef.current) {
            return;
          }
          if (AppState.currentState === 'active') {
            return;
          }
          if (
            typeof status.playing === 'boolean' &&
            status.playing !== isPlayingRef.current
          ) {
            dispatch(setPlaying(status.playing));
          }
        },
      );

      playerRef.current = player;
      startProgressTimer();

      if (isPlayingRef.current) {
        try {
          ignorePlayingSyncRef.current = true;
          player.play();
          lockScreenTimer = setTimeout(() => {
            if (!cancelled && gen === loadGenRef.current) {
              activateLockScreenOnce(player);
            }
          }, 250);
          syncUnlockTimer = setTimeout(() => {
            ignorePlayingSyncRef.current = false;
          }, 600);
        } catch {
          ignorePlayingSyncRef.current = false;
        }
      }

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
      if (lockScreenTimer) {
        clearTimeout(lockScreenTimer);
      }
      if (syncUnlockTimer) {
        clearTimeout(syncUnlockTimer);
      }
      destroyPlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on source change
  }, [
    streamUrl,
    trackId,
    dispatch,
    destroyPlayer,
    startProgressTimer,
    activateLockScreenOnce,
  ]);

  // 2. Play / pause UI — sans réactiver le lock screen (évite hide/show notif)
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    try {
      ignorePlayingSyncRef.current = true;
      if (isPlaying) {
        if (!player.playing) {
          player.play();
        }
        // Première activation seulement (si pas encore fait au load)
        activateLockScreenOnce(player);
      } else if (player.playing) {
        player.pause();
      }
    } catch {
      // ignore
    }
    const t = setTimeout(() => {
      ignorePlayingSyncRef.current = false;
    }, 400);
    return () => {
      clearTimeout(t);
    };
  }, [isPlaying, activateLockScreenOnce]);

  // 3. Métadonnées lock screen (titre / cover) sans recréer la session
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !track || !lockScreenActiveRef.current) {
      return;
    }
    try {
      player.updateLockScreenMetadata(lockScreenMetadataFromTrack(track));
    } catch {
      // ignore
    }
  }, [track]);

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
        ignorePlayingSyncRef.current = true;
        player.play();
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
      <PlayerLockScreenSkipBridge />
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
