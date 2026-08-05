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
      providesTags: (_result, _error, id) => [{ type: 'Artists', id }],
      transformResponse: (response: unknown) => {
        const parsed = artistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Artiste invalide');
        }
        return parsed.data;
      },
    }),
    /**
     * PATCH /artists/:id — multipart (displayName + acceptArtistTerms si rename).
     */
    updateArtist: build.mutation<
      Artist,
      {
        artistId: string;
        displayName?: string;
        bio?: string;
        acceptArtistTerms?: boolean;
      }
    >({
      query: ({ artistId, displayName, bio, acceptArtistTerms }) => {
        const formData = new FormData();
        if (displayName !== undefined) {
          formData.append('displayName', displayName);
        }
        if (bio !== undefined) {
          formData.append('bio', bio);
        }
        if (acceptArtistTerms === true) {
          formData.append('acceptArtistTerms', 'true');
        }
        return {
          url: `/artists/${artistId}`,
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: ['MyArtist', 'Artists'],
      transformResponse: (response: unknown) => {
        const parsed = artistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil artiste invalide');
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
  useUpdateArtistMutation,
} = artistsApi;
