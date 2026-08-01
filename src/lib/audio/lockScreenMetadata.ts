import type { AudioMetadata } from 'expo-audio';

import type { Track } from '@/schemas/tracks';

/** Métadonnées affichées sur la notif / écran verrouillé (mini-lecteur système). */
export function lockScreenMetadataFromTrack(track: Track): AudioMetadata {
  return {
    title: track.title,
    artist: track.artist?.displayName ?? 'Himba',
    artworkUrl: track.coverUrl ?? undefined,
  };
}
