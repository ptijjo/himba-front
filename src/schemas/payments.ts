import { z } from 'zod';

import { moneyEurosSchema } from '@/schemas/tracks';

/** Réponse POST /payments/tracks/:trackId/intent (et albums). */
export const paymentIntentResponseSchema = z.object({
  clientSecret: z.string().min(1),
  paymentIntentId: z.string().min(1),
  /** Montant en euros, string décimale API (`"1.99"`). */
  amount: z.string().min(1),
  kind: z.enum(['track', 'album']),
});

export type PaymentIntentResponse = z.infer<typeof paymentIntentResponseSchema>;

const purchaseArtistSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

const purchaseTrackRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable(),
  artist: purchaseArtistSchema.optional(),
});

const purchaseAlbumRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable(),
  artist: purchaseArtistSchema.optional(),
});

export const userPurchaseItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('track'),
    id: z.string(),
    amount: moneyEurosSchema,
    createdAt: z.union([z.string(), z.coerce.date()]),
    track: purchaseTrackRefSchema,
  }),
  z.object({
    kind: z.literal('album'),
    id: z.string(),
    amount: moneyEurosSchema,
    createdAt: z.union([z.string(), z.coerce.date()]),
    album: purchaseAlbumRefSchema,
  }),
]);

export const userPurchasesResponseSchema = z.object({
  items: z.array(userPurchaseItemSchema),
});

export type UserPurchaseItem = z.infer<typeof userPurchaseItemSchema>;
export type UserPurchasesResponse = z.infer<typeof userPurchasesResponseSchema>;
