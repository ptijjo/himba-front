import { ratingSummarySchema } from '@/schemas/ratings';
import { trackPricingSchema } from '@/schemas/studio';
import { moneyEurosSchema } from '@/schemas/tracks';
import { z } from 'zod';

export const albumArtistSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

export const albumSchema = z.object({
  id: z.string(),
  artistId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  price: moneyEurosSchema.optional(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
  artist: albumArtistSchema.optional(),
  _count: z
    .object({
      tracks: z.number(),
    })
    .optional(),
});

/** GET /albums/:id — album + titres rattachés. */
export const albumDetailSchema = albumSchema.extend({
  tracks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        genre: z.string().nullable().optional(),
        price: moneyEurosSchema.optional(),
        coverUrl: z.string().nullable().optional(),
        durationMs: z.number().nullable().optional(),
        albumPosition: z.number().nullable().optional(),
      }),
    )
    .optional(),
  ratingSummary: ratingSummarySchema.optional(),
});

export const albumListSchema = z.object({
  items: z.array(albumSchema),
  nextCursor: z.string().nullable(),
});

/** Image locale (ImagePicker) — JPEG / PNG / WebP. */
export const albumCoverFileSchema = z.object({
  uri: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
});

export const createAlbumSchema = z.object({
  title: z.string().min(1, 'Titre d’album requis').max(200),
  description: z.string().max(2000).optional(),
  cover: albumCoverFileSchema.nullable(),
}).superRefine((data, ctx) => {
  if (!data.cover) {
    ctx.addIssue({
      code: 'custom',
      message: 'Couverture requise',
      path: ['cover'],
    });
  }
});

/**
 * Formulaire édition album — UpdateAlbumDto + cover optionnelle (multipart).
 * Couverture absente = conserver l’existante côté API.
 */
export const updateAlbumSchema = z
  .object({
    title: z.string().min(1, 'Titre d’album requis').max(200),
    description: z.string().max(2000).optional(),
    cover: albumCoverFileSchema.nullable().optional(),
    pricing: trackPricingSchema,
    priceEuros: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricing !== 'paid') {
      return;
    }
    const raw = data.priceEuros?.trim() ?? '';
    if (!raw) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique un prix',
        path: ['priceEuros'],
      });
      return;
    }
    const euros = Number(raw.replace(',', '.'));
    if (!Number.isFinite(euros) || euros <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Prix invalide',
        path: ['priceEuros'],
      });
    }
  });

export type Album = z.infer<typeof albumSchema>;
export type AlbumDetail = z.infer<typeof albumDetailSchema>;
export type AlbumList = z.infer<typeof albumListSchema>;
export type CreateAlbumValues = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumValues = z.infer<typeof updateAlbumSchema>;
export type AlbumCoverFile = z.infer<typeof albumCoverFileSchema>;

export function toAlbumPrice(values: UpdateAlbumValues): number | null {
  if (values.pricing === 'free') {
    return null;
  }
  const euros = Number((values.priceEuros ?? '').replace(',', '.'));
  return Math.round(euros * 100) / 100;
}
