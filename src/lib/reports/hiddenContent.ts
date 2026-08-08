/**
 * Règles de masquage local pour le reporteur.
 * Cascade : ARTIST → titres/albums ; ALBUM → titres de l’album.
 */
import type { ReportTargetType } from '@/schemas/reports';
import type { Track } from '@/schemas/tracks';

import type { HiddenContentEntry } from '@/lib/reports/hiddenContentStorage';

export function hiddenContentKey(
  targetType: ReportTargetType,
  targetId: string,
): string {
  return `${targetType}:${targetId}`;
}

export function toHiddenKeySet(entries: HiddenContentEntry[]): Set<string> {
  return new Set(
    entries.map((e) => hiddenContentKey(e.targetType, e.targetId)),
  );
}

export function isTargetHidden(
  keys: Set<string>,
  targetType: ReportTargetType,
  targetId: string,
): boolean {
  return keys.has(hiddenContentKey(targetType, targetId));
}

/** Titre masqué s’il l’est lui-même, via son album, ou via son artiste. */
export function isTrackHidden(track: Track, keys: Set<string>): boolean {
  if (isTargetHidden(keys, 'TRACK', track.id)) {
    return true;
  }
  if (track.albumId && isTargetHidden(keys, 'ALBUM', track.albumId)) {
    return true;
  }
  if (track.artistId && isTargetHidden(keys, 'ARTIST', track.artistId)) {
    return true;
  }
  return false;
}

export function isAlbumHidden(
  album: { id: string; artistId?: string | null },
  keys: Set<string>,
): boolean {
  if (isTargetHidden(keys, 'ALBUM', album.id)) {
    return true;
  }
  if (album.artistId && isTargetHidden(keys, 'ARTIST', album.artistId)) {
    return true;
  }
  return false;
}

export function isArtistHidden(artistId: string, keys: Set<string>): boolean {
  return isTargetHidden(keys, 'ARTIST', artistId);
}

export function isUserHidden(userId: string, keys: Set<string>): boolean {
  return isTargetHidden(keys, 'USER', userId);
}

export function filterHiddenTracks<T extends Track>(
  tracks: T[],
  keys: Set<string>,
): T[] {
  return tracks.filter((t) => !isTrackHidden(t, keys));
}
