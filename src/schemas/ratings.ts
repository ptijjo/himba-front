/**
 * Notes ★ — miroir PUT /ratings + ratingSummary sur détails.
 */
import { z } from 'zod';

export const ratingSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number().int().nonnegative(),
  myValue: z.number().int().min(1).max(5).nullable(),
});

export const upsertRatingBodySchema = z
  .object({
    value: z.number().int().min(1).max(5),
    trackId: z.string().min(1).optional(),
    artistId: z.string().min(1).optional(),
    albumId: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const n = [data.trackId, data.artistId, data.albumId].filter(Boolean).length;
    if (n !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indiquer exactement une cible : trackId, artistId ou albumId',
      });
    }
  });

export const ratingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  trackId: z.string().nullable().optional(),
  artistId: z.string().nullable().optional(),
  albumId: z.string().nullable().optional(),
  value: z.number().int().min(1).max(5),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

export type RatingSummary = z.infer<typeof ratingSummarySchema>;
export type UpsertRatingBody = z.infer<typeof upsertRatingBodySchema>;
export type Rating = z.infer<typeof ratingSchema>;
