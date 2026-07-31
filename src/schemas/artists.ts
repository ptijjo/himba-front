import { z } from 'zod';

export const becomeArtistSchema = z.object({
  displayName: z.string().min(2, 'Au moins 2 caractères').max(80),
  bio: z.string().max(1000).optional(),
});

export const artistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  bio: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  /** Photo de profil User liée. */
  avatarUrl: z.string().nullable().optional(),
  /** Nombre de personnes qui suivent cet artiste. */
  followersCount: z.number().int().nonnegative().optional(),
  /** Nombre d’artistes suivis par ce compte. */
  followingCount: z.number().int().nonnegative().optional(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

export type BecomeArtistValues = z.infer<typeof becomeArtistSchema>;
export type Artist = z.infer<typeof artistSchema>;
