/**
 * Slice player — métadonnées UI + file de lecture (playlist).
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Track } from '@/schemas/tracks';

export type RepeatMode = 'off' | 'all' | 'one';

type PlayerState = {
  track: Track | null;
  streamUrl: string | null;
  isPlaying: boolean;
  needsPurchase: boolean;
  error: string | null;
  shuffle: boolean;
  repeatMode: RepeatMode;
  /** File active (playlist ou titre isolé). */
  queue: Track[];
  /** Incrémenté à la fin d’un titre → auto-avance. */
  trackEndedNonce: number;
};

const initialState: PlayerState = {
  track: null,
  streamUrl: null,
  isPlaying: false,
  needsPurchase: false,
  error: null,
  shuffle: false,
  repeatMode: 'off',
  queue: [],
  trackEndedNonce: 0,
};

const REPEAT_CYCLE: RepeatMode[] = ['off', 'all', 'one'];

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setQueue(state, action: PayloadAction<Track[]>) {
      state.queue = action.payload;
    },
    setNowPlaying(
      state,
      action: PayloadAction<{ track: Track; streamUrl: string }>,
    ) {
      state.track = action.payload.track;
      state.streamUrl = action.payload.streamUrl;
      state.isPlaying = true;
      state.needsPurchase = false;
      state.error = null;
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    markTrackEnded(state) {
      state.isPlaying = false;
      state.trackEndedNonce += 1;
    },
    setNeedsPurchase(state, action: PayloadAction<{ track: Track }>) {
      state.track = action.payload.track;
      state.streamUrl = null;
      state.isPlaying = false;
      state.needsPurchase = true;
      state.error = 'Achat requis pour écouter ce titre';
    },
    setPlayerError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isPlaying = false;
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
    cycleRepeatMode(state) {
      const idx = REPEAT_CYCLE.indexOf(state.repeatMode);
      const next = REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length];
      state.repeatMode = next ?? 'off';
    },
    clearPlayer(state) {
      state.track = null;
      state.streamUrl = null;
      state.isPlaying = false;
      state.needsPurchase = false;
      state.error = null;
      state.queue = [];
      // shuffle / repeat conservés volontairement
    },
  },
});

export const {
  setQueue,
  setNowPlaying,
  setPlaying,
  markTrackEnded,
  setNeedsPurchase,
  setPlayerError,
  toggleShuffle,
  cycleRepeatMode,
  clearPlayer,
} = playerSlice.actions;
export const playerReducer = playerSlice.reducer;
