/**
 * Schémas catalogue / recommandations — miroir réponses tracks API.
 * Prix API = euros (`price`) — plus de `priceCents`.
 */
import { z } from 'zod';

/** Decimal Prisma / number / string → number | null. */
export const moneyEurosSchema = z.preprocess((val) => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number().nullable());

export const trackArtistSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

export const trackSchema = z.object({
  id: z.string(),
  title: z.string(),
  genre: z.string().nullable().optional(),
  price: moneyEurosSchema,
  coverUrl: z.string().nullable().optional(),
  artistId: z.string(),
  albumId: z.string().nullable().optional(),
  albumPosition: z.number().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  artist: trackArtistSchema.optional(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

export const trackListSchema = z.object({
  items: z.array(trackSchema),
  nextCursor: z.string().nullable(),
});

export const recommendationsSchema = z.array(trackSchema);

export type Track = z.infer<typeof trackSchema>;
export type TrackList = z.infer<typeof trackListSchema>;

export function formatTrackPrice(price: number | null | undefined): string {
  if (price == null) {
    return 'Gratuit';
  }
  return `${price.toFixed(2)} €`;
}
