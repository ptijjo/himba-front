import { z } from 'zod';

import { ratingSummarySchema } from '@/schemas/ratings';

/** Corps API POST /artists/become */
export const becomeArtistSchema = z.object({
  displayName: z.string().min(2, 'Au moins 2 caractères').max(80),
  bio: z.string().max(1000).optional(),
});

/** Formulaire mobile — acceptation CGU obligatoire après scroll. */
export const becomeArtistFormSchema = becomeArtistSchema.extend({
  acceptArtistTerms: z.boolean().refine((v) => v === true, {
    message: 'Tu dois accepter les conditions artiste',
  }),
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
  /** Présent sur GET /artists/:id. */
  ratingSummary: ratingSummarySchema.optional(),
});

export type BecomeArtistValues = z.infer<typeof becomeArtistSchema>;
export type BecomeArtistFormValues = z.infer<typeof becomeArtistFormSchema>;
export type Artist = z.infer<typeof artistSchema>;
