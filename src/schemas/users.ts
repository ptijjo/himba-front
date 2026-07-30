import { z } from 'zod';

/** GET /users/:id/public — jamais email ni données sensibles. */
export const userPublicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  artistId: z.string().nullable(),
});

/** GET /users/:id/playlists — vitrine profil. */
export const publicPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  trackCount: z.number(),
});

export type UserPublicProfile = z.infer<typeof userPublicProfileSchema>;
export type PublicPlaylist = z.infer<typeof publicPlaylistSchema>;
