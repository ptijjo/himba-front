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

export type Album = z.infer<typeof albumSchema>;
export type AlbumList = z.infer<typeof albumListSchema>;
export type CreateAlbumValues = z.infer<typeof createAlbumSchema>;
export type AlbumCoverFile = z.infer<typeof albumCoverFileSchema>;
