import { router, type Href } from 'expo-router';

/** Ouvre le profil public artiste (sans PII). */
export function openArtistProfile(artistId: string): void {
  router.push(`/(app)/artist/${artistId}` as Href);
}

/** Ouvre le profil public auditeur (redirige vers artiste si profil artiste). */
export function openUserProfile(userId: string): void {
  router.push(`/(app)/user/${userId}` as Href);
}

/** Détail playlist → titres + file de lecture. */
export function openPlaylist(playlistId: string): void {
  router.push(`/(app)/playlist/${playlistId}` as Href);
}

/** Liste des favoris (même principe que playlist). */
export function openFavorites(): void {
  router.push('/(app)/favorites' as Href);
}

/** Anciennes playlists auto « Découverte … » — plus utilisées. */
export function isDiscoveryPlaylistName(name: string): boolean {
  return /^découverte\b/i.test(name.trim());
}
