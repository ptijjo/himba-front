/**
 * Albums — list / detail / create / update / delete (owner ARTIST ou ADMIN).
 */
import {
  albumDetailSchema,
  albumListSchema,
  albumSchema,
  type Album,
  type AlbumDetail,
  type AlbumList,
} from '@/schemas/albums';
import { baseApi } from '@/store/api/baseApi';

/** PATCH JSON sans nouveau fichier cover (permet `price: null`). */
export type UpdateAlbumJsonBody = {
  title?: string;
  description?: string | null;
  price?: number | null;
};

export type UpdateAlbumArg =
  | { id: string; formData: FormData }
  | { id: string; body: UpdateAlbumJsonBody };

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
    getAlbum: build.query<AlbumDetail, string>({
      query: (id) => `/albums/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Albums', id }],
      transformResponse: (response: unknown) => {
        const parsed = albumDetailSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Album invalide');
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
    /**
     * PATCH /albums/:id — multipart (nouvelle cover) ou JSON (méta + price null).
     */
    updateAlbum: build.mutation<Album, UpdateAlbumArg>({
      query: (arg) => {
        if ('formData' in arg) {
          return {
            url: `/albums/${arg.id}`,
            method: 'PATCH',
            body: arg.formData,
          };
        }
        return {
          url: `/albums/${arg.id}`,
          method: 'PATCH',
          body: arg.body,
        };
      },
      invalidatesTags: ['Albums', 'Tracks'],
      transformResponse: (response: unknown) => {
        const parsed = albumSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Album modifié invalide');
        }
        return parsed.data;
      },
    }),
    /** DELETE /albums/:id — 204 ; titres détachés (albumId null). */
    deleteAlbum: build.mutation<void, string>({
      query: (id) => ({
        url: `/albums/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Albums', 'Tracks'],
    }),
  }),
});

export const {
  useGetAlbumsQuery,
  useGetAlbumQuery,
  useCreateAlbumMutation,
  useUpdateAlbumMutation,
  useDeleteAlbumMutation,
} = albumsApi;
