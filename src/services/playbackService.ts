/**
 * Service headless RNTP — boutons lock screen / notif / casque.
 * Tourne hors React ; lit Redux + playTrackCore pour next/prev (file Himba).
 */
import TrackPlayer, { Event } from 'react-native-track-player';

import { playTrackCore } from '@/lib/audio/playTrackCore';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { store } from '@/store';
import { setPlaying } from '@/store/slices/playerSlice';

export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    store.dispatch(setPlaying(true));
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    store.dispatch(setPlaying(false));
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    store.dispatch(setPlaying(false));
    void TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    const { queue, track, shuffle, repeatMode } = store.getState().player;
    const next = pickNextInQueue(queue, track?.id, { shuffle, repeatMode });
    if (next) {
      void playTrackCore(next, queue);
    }
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    const { queue, track, shuffle, repeatMode } = store.getState().player;
    const prev = pickPrevInQueue(queue, track?.id, { shuffle, repeatMode });
    if (prev) {
      void playTrackCore(prev, queue);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    void TrackPlayer.seekTo(event.position);
  });
}
