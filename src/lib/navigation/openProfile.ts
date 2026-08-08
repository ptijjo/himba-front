import { router, type Href } from 'expo-router';

/** Ouvre le profil public artiste (sans PII). */
export function openArtistProfile(artistId: string): void {
  router.push(`/(app)/(tabs)/artist/${artistId}` as Href);
}

/** Ouvre le profil public auditeur (redirige vers artiste si profil artiste). */
export function openUserProfile(userId: string): void {
  router.push(`/(app)/(tabs)/user/${userId}` as Href);
}

/** Détail playlist → titres + file de lecture. */
export function openPlaylist(playlistId: string): void {
  router.push(`/(app)/(tabs)/playlist/${playlistId}` as Href);
}

/** Liste des favoris (même principe que playlist). */
export function openFavorites(): void {
  router.push('/(app)/(tabs)/favorites' as Href);
}

/** Historique d’achats (titres + albums payants). */
export function openPurchases(): void {
  router.push('/(app)/(tabs)/purchases' as Href);
}

/** Albums aimés (bibliothèque). */
export function openLibraryAlbums(): void {
  router.push('/(app)/(tabs)/library-albums' as Href);
}

/** Artistes suivis (bibliothèque). */
export function openLibraryArtists(): void {
  router.push('/(app)/(tabs)/library-artists' as Href);
}

/** Détail album public. */
export function openAlbum(albumId: string): void {
  router.push(`/(app)/(tabs)/album/${albumId}` as Href);
}

/** Anciennes playlists auto « Découverte … » — plus utilisées. */
export function isDiscoveryPlaylistName(name: string): boolean {
  return /^découverte\b/i.test(name.trim());
}
