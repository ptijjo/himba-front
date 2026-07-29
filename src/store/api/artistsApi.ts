import {
  artistSchema,
  type Artist,
  type BecomeArtistValues,
} from '@/schemas/artists';
import { baseApi } from '@/store/api/baseApi';

export const artistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    becomeArtist: build.mutation<Artist, BecomeArtistValues>({
      query: (body) => ({
        url: '/artists/become',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me', 'MyArtist'],
      transformResponse: (response: unknown) => {
        const parsed = artistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil artiste invalide');
        }
        return parsed.data;
      },
    }),
    getMyArtist: build.query<Artist | null, void>({
      query: () => '/artists/me',
      providesTags: ['MyArtist'],
      transformResponse: (response: unknown) => {
        if (response == null) {
          return null;
        }
        const parsed = artistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil artiste invalide');
        }
        return parsed.data;
      },
    }),
    getArtist: build.query<Artist, string>({
      query: (id) => `/artists/${id}`,
      transformResponse: (response: unknown) => {
        const parsed = artistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Artiste invalide');
        }
        return parsed.data;
      },
    }),
  }),
});

export const {
  useBecomeArtistMutation,
  useGetMyArtistQuery,
  useGetArtistQuery,
} = artistsApi;
