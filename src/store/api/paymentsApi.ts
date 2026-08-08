/**
 * Endpoints paiement Stripe — intent titre / album + historique achats.
 * Confirmation Purchase = webhook API (jamais appelée depuis le client).
 */
import {
  paymentIntentResponseSchema,
  userPurchasesResponseSchema,
  type PaymentIntentResponse,
  type UserPurchasesResponse,
} from '@/schemas/payments';
import { baseApi } from '@/store/api/baseApi';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyPurchases: build.query<UserPurchasesResponse, void>({
      query: () => '/payments/purchases',
      providesTags: ['Purchases'],
      transformResponse: (response: unknown) => {
        const parsed = userPurchasesResponseSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Historique d’achats invalide');
        }
        return parsed.data;
      },
    }),
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
      invalidatesTags: ['Purchases'],
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
      invalidatesTags: ['Purchases'],
    }),
  }),
});

export const {
  useGetMyPurchasesQuery,
  useCreateTrackPaymentIntentMutation,
  useCreateAlbumPaymentIntentMutation,
} = paymentsApi;
