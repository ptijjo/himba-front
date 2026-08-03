/**
 * Endpoints auth + profil — register / login / logout / me.
 */
import { applyAuthLoginResponse } from '@/lib/auth/applyAuthLoginResponse';
import { clearTokens } from '@/lib/auth/tokenStorage';
import {
  clearStoredPushToken,
  getStoredPushToken,
} from '@/lib/push/pushTokenStorage';
import {
  authUserSchema,
  registerPendingResponseSchema,
  type LoginFormValues,
  type RegisterFormValues,
  type RegisterPendingResponse,
} from '@/schemas/auth';
import { baseApi } from '@/store/api/baseApi';
import { notificationsApi } from '@/store/api/notificationsApi';
import { clearCredentials } from '@/store/slices/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<RegisterPendingResponse, RegisterFormValues>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const parsed = registerPendingResponseSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Réponse d’inscription invalide');
        }
        return parsed.data;
      },
    }),
    resendVerification: build.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body,
      }),
    }),
    login: build.mutation({
      query: (body: LoginFormValues) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await applyAuthLoginResponse(data, dispatch);
        } catch {
          // Erreur gérée par le composant
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // 1. Révoquer le token Expo côté API tant que le Bearer est encore valide
        const pushToken = await getStoredPushToken();
        if (pushToken) {
          try {
            await dispatch(
              notificationsApi.endpoints.deletePushToken.initiate(pushToken),
            ).unwrap();
          } catch {
            // Best-effort : on efface quand même le stockage local
          }
          await clearStoredPushToken();
        }
        try {
          await queryFulfilled;
        } finally {
          await clearTokens();
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
    getMe: build.query({
      query: () => '/users/me',
      providesTags: ['Me'],
      transformResponse: (response: unknown) => {
        const parsed = authUserSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil utilisateur invalide');
        }
        return parsed.data;
      },
    }),
    /**
     * PATCH /users/me — multipart `avatar` (jpeg/png/webp).
     * Ne pas forcer Content-Type : le boundary FormData doit rester natif.
     */
    updateMyAvatar: build.mutation({
      query: (formData: FormData) => ({
        url: '/users/me',
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: ['Me'],
      transformResponse: (response: unknown) => {
        const parsed = authUserSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil utilisateur invalide');
        }
        return parsed.data;
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useResendVerificationMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMyAvatarMutation,
} = authApi;
