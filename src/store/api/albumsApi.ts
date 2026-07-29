/**
 * Albums — list / create multipart (cover obligatoire).
 */
import {
  albumListSchema,
  albumSchema,
  type Album,
  type AlbumList,
} from '@/schemas/albums';
import { baseApi } from '@/store/api/baseApi';

export const albumsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getAlbums: build.query<
      AlbumList,
      { artistId?: string; cursor?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/albums',
        params: {
          artistId: params?.artistId,
          cursor: params?.cursor,
          limit: params?.limit ?? 50,
        },
      }),
      providesTags: ['Albums'],
      transformResponse: (response: unknown) => {
        const parsed = albumListSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Liste d’albums invalide');
        }
        return parsed.data;
      },
    }),
    /** POST /albums — multipart `cover` + title / description. */
    createAlbum: build.mutation<Album, FormData>({
      query: (formData) => ({
        url: '/albums',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Albums'],
      transformResponse: (response: unknown) => {
        const parsed = albumSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Album invalide');
        }
        return parsed.data;
      },
    }),
  }),
});

export const { useGetAlbumsQuery, useCreateAlbumMutation } = albumsApi;
