import { z } from 'zod';

/** Réponse POST /payments/tracks/:trackId/intent (et albums). */
export const paymentIntentResponseSchema = z.object({
  clientSecret: z.string().min(1),
  paymentIntentId: z.string().min(1),
  /** Montant en euros, string décimale API (`"1.99"`). */
  amount: z.string().min(1),
  kind: z.enum(['track', 'album']),
});

export type PaymentIntentResponse = z.infer<typeof paymentIntentResponseSchema>;
