/**
 * Setup unique TrackPlayer + options notif (prev/next réels).
 */
import { Platform } from 'react-native';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from 'react-native-track-player';

let setupPromise: Promise<void> | null = null;

export async function ensureTrackPlayerReady(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  if (!setupPromise) {
    setupPromise = (async () => {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        progressUpdateEventInterval: 1,
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.ContinuePlayback,
        },
      });
      // La file métier reste dans Redux — RNTP = 1 piste active.
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
    })().catch((err: unknown) => {
      setupPromise = null;
      throw err;
    });
  }
  await setupPromise;
}
