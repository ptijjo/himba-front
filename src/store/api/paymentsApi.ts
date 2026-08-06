/**
 * Endpoints paiement Stripe — intent titre / album.
 * Confirmation Purchase = webhook API (jamais appelée depuis le client).
 */
import {
  paymentIntentResponseSchema,
  type PaymentIntentResponse,
} from '@/schemas/payments';
import { baseApi } from '@/store/api/baseApi';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createTrackPaymentIntent: build.mutation<PaymentIntentResponse, string>({
      query: (trackId) => ({
        url: `/payments/tracks/${trackId}/intent`,
        method: 'POST',
      }),
      transformResponse: (response: unknown) => {
        const parsed = paymentIntentResponseSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Réponse paiement invalide');
        }
        return parsed.data;
      },
    }),
    createAlbumPaymentIntent: build.mutation<PaymentIntentResponse, string>({
      query: (albumId) => ({
        url: `/payments/albums/${albumId}/intent`,
        method: 'POST',
      }),
      transformResponse: (response: unknown) => {
        const parsed = paymentIntentResponseSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Réponse paiement invalide');
        }
        return parsed.data;
      },
    }),
  }),
});

export const {
  useCreateTrackPaymentIntentMutation,
  useCreateAlbumPaymentIntentMutation,
} = paymentsApi;
