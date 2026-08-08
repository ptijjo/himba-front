import { z } from 'zod';

import { ratingSummarySchema } from '@/schemas/ratings';

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
  // Prisma Decimal / objets { toString } / { value }
  if (typeof val === 'object') {
    const asRecord = val as Record<string, unknown>;
    if (typeof asRecord.value === 'string' || typeof asRecord.value === 'number') {
      const n = Number(asRecord.value);
      return Number.isFinite(n) ? n : null;
    }
    if (typeof (val as { toString?: () => string }).toString === 'function') {
      const raw = String(val);
      if (raw !== '[object Object]') {
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      }
    }
  }
  return null;
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
  /** Présent sur GET /tracks/:id uniquement. */
  ratingSummary: ratingSummarySchema.optional(),
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
