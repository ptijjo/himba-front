/**
 * Contournement expo-audio : les boutons lock screen « skip » font un seek ±10 s.
 * Hors app uniquement, on intercepte ce saut pour prev / next dans la file.
 * La barre de progression (scrub) reste native Media3 — non interceptée.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { usePlayTrack } from '@/hooks/usePlayTrack';
import { detectLockScreenSkip } from '@/lib/audio/lockScreenSkipDetection';
import {
  getPlayerProgressSnapshot,
  usePlayerProgressStore,
} from '@/lib/audio/playerProgressStore';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { useAppSelector } from '@/store';

/** Délai après un skip / changement de titre — évite double-fire et reset progress. */
const COOLDOWN_MS = 1400;

export function PlayerLockScreenSkipBridge() {
  const { playTrack } = usePlayTrack();
  const { currentTime } = usePlayerProgressStore();
  const track = useAppSelector((s) => s.player.track);
  const queue = useAppSelector((s) => s.player.queue);
  const shuffle = useAppSelector((s) => s.player.shuffle);
  const repeatMode = useAppSelector((s) => s.player.repeatMode);

  const prevTimeRef = useRef(currentTime);
  const cooldownRef = useRef(false);
  const trackIdRef = useRef(track?.id);

  // 1. Changement de titre → recalibrer baseline + cooldown
  useEffect(() => {
    trackIdRef.current = track?.id;
    const snap = getPlayerProgressSnapshot().currentTime;
    prevTimeRef.current = snap;
    cooldownRef.current = true;
    const t = setTimeout(() => {
      cooldownRef.current = false;
      prevTimeRef.current = getPlayerProgressSnapshot().currentTime;
    }, COOLDOWN_MS);
    return () => {
      clearTimeout(t);
    };
  }, [track?.id]);

  // 2. Détecter seek ±10 s hors app → prev / next
  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;

    if (cooldownRef.current) {
      return;
    }
    if (AppState.currentState === 'active') {
      return;
    }
    if (!track?.id || trackIdRef.current !== track.id) {
      return;
    }

    const direction = detectLockScreenSkip(prev, currentTime);
    if (!direction) {
      return;
    }

    const opts = { shuffle, repeatMode };
    const target =
      direction === 'next'
        ? pickNextInQueue(queue, track.id, opts)
        : pickPrevInQueue(queue, track.id, opts);

    if (!target || target.id === track.id) {
      return;
    }

    cooldownRef.current = true;
    void playTrack(target, { queue });
  }, [currentTime, track, queue, shuffle, repeatMode, playTrack]);

  return null;
}
