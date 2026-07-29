/**
 * Endpoints auth + profil — register / login / logout / me.
 */
import { applyAuthLoginResponse } from '@/lib/auth/applyAuthLoginResponse';
import { clearTokens } from '@/lib/auth/tokenStorage';
import { authUserSchema, type LoginFormValues, type RegisterFormValues } from '@/schemas/auth';
import { baseApi } from '@/store/api/baseApi';
import { clearCredentials } from '@/store/slices/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation({
      query: (body: RegisterFormValues) => ({
        url: '/auth/register',
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
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMyAvatarMutation,
} = authApi;
