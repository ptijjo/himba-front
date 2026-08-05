import { moneyEurosSchema } from '@/schemas/tracks';
import { z } from 'zod';

export const favoriteTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  genre: z.string().nullable().optional(),
  price: moneyEurosSchema.optional(),
  coverUrl: z.string().nullable().optional(),
  artistId: z.string().optional(),
  durationMs: z.number().nullable().optional(),
  artist: z
    .object({
      id: z.string(),
      displayName: z.string(),
    })
    .optional(),
});

export const favoriteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  trackId: z.string(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  track: favoriteTrackSchema.optional(),
});

export const albumFavoriteAlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable().optional(),
  artistId: z.string().optional(),
  artist: z
    .object({
      id: z.string(),
      displayName: z.string(),
    })
    .optional(),
  _count: z
    .object({
      tracks: z.number(),
    })
    .optional(),
});

export const albumFavoriteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  albumId: z.string(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  album: albumFavoriteAlbumSchema.optional(),
});

export const followSchema = z.object({
  id: z.string(),
  followerId: z.string(),
  artistId: z.string(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  artist: z
    .object({
      id: z.string(),
      displayName: z.string(),
      /** Cover / bannière artiste (pas la photo de profil). */
      coverUrl: z.string().nullable().optional(),
      /** Photo de profil du compte User lié. */
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
});

export const playlistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
  /** Nombre de titres — liste GET /playlists. */
  trackCount: z.number().optional(),
  /** Jusqu’à 4 covers pour mosaïque bibliothèque. */
  coverUrls: z.array(z.string()).max(4).optional(),
});

export const playlistTrackItemSchema = z.object({
  id: z.string(),
  playlistId: z.string().optional(),
  trackId: z.string(),
  position: z.number().optional(),
  track: favoriteTrackSchema.optional(),
});

export const playlistDetailSchema = playlistSchema.extend({
  tracks: z.array(playlistTrackItemSchema),
});

export const playlistListSchema = z.object({
  items: z.array(playlistSchema),
  nextCursor: z.string().nullable(),
});

export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
});

export type Favorite = z.infer<typeof favoriteSchema>;
export type AlbumFavorite = z.infer<typeof albumFavoriteSchema>;
export type Follow = z.infer<typeof followSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistDetail = z.infer<typeof playlistDetailSchema>;
export type CreatePlaylistValues = z.infer<typeof createPlaylistSchema>;
