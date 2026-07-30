/**
 * Catalogue + recommandations + stream/download + publication Studio.
 */
import {
  trackGenresListSchema,
  type TrackGenreOption,
} from '@/schemas/genres';
import { signedUrlSchema, type SignedUrl } from '@/schemas/media';
import {
  recommendationsSchema,
  trackListSchema,
  trackSchema,
  type Track,
  type TrackList,
} from '@/schemas/tracks';
import { baseApi } from '@/store/api/baseApi';

export type CreateTrackFormData = FormData;

/** Corps PATCH /tracks/:id — UpdateTrackDto (JSON). */
export type UpdateTrackBody = {
  title?: string;
  genre?: string;
  /** null = gratuit */
  price?: number | null;
  durationMs?: number;
};

export const tracksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTracks: build.query<
      TrackList,
      { cursor?: string; limit?: number; artistId?: string } | void
    >({
      query: (params) => ({
        url: '/tracks',
        params: {
          cursor: params?.cursor,
          limit: params?.limit ?? 20,
          artistId: params?.artistId,
        },
      }),
      providesTags: ['Tracks'],
      transformResponse: (response: unknown) => {
        const parsed = trackListSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Catalogue invalide');
        }
        return parsed.data;
      },
    }),
    getTrackGenres: build.query<TrackGenreOption[], void>({
      query: () => '/tracks/genres',
      transformResponse: (response: unknown) => {
        const parsed = trackGenresListSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Genres invalides');
        }
        return parsed.data;
      },
    }),
    getRecommendations: build.query<Track[], void>({
      query: () => '/recommendations',
      providesTags: ['Recommendations'],
      transformResponse: (response: unknown) => {
        const parsed = recommendationsSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Recommandations invalides');
        }
        return parsed.data;
      },
    }),
    getTrack: build.query<Track, string>({
      query: (id) => `/tracks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Tracks', id }],
      transformResponse: (response: unknown) => {
        const parsed = trackSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Titre invalide');
        }
        return parsed.data;
      },
    }),
    getStreamUrl: build.query<SignedUrl, string>({
      query: (id) => `/tracks/${id}/stream`,
      transformResponse: (response: unknown) => {
        const parsed = signedUrlSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('URL de stream invalide');
        }
        return parsed.data;
      },
    }),
    getDownloadUrl: build.query<SignedUrl, string>({
      query: (id) => `/tracks/${id}/download`,
      transformResponse: (response: unknown) => {
        const parsed = signedUrlSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('URL de téléchargement invalide');
        }
        return parsed.data;
      },
    }),
    /**
     * POST /tracks — multipart : audio (+ cover optionnel) + champs CreateTrackDto.
     */
    createTrack: build.mutation<Track, CreateTrackFormData>({
      query: (formData) => ({
        url: '/tracks',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Tracks', 'Albums', 'Recommendations'],
      transformResponse: (response: unknown) => {
        const parsed = trackSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Titre publié invalide');
        }
        return parsed.data;
      },
    }),
    /**
     * PATCH /tracks/:id — JSON UpdateTrackDto (owner ARTIST ou ADMIN).
     * Pas de remplacement audio/cover sur cette route API.
     */
    updateTrack: build.mutation<Track, { id: string; body: UpdateTrackBody }>({
      query: ({ id, body }) => ({
        url: `/tracks/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Tracks', 'Albums', 'Recommendations'],
      transformResponse: (response: unknown) => {
        const parsed = trackSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Titre modifié invalide');
        }
        return parsed.data;
      },
    }),
    /** DELETE /tracks/:id — 204, owner ARTIST ou ADMIN. */
    deleteTrack: build.mutation<void, string>({
      query: (id) => ({
        url: `/tracks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tracks', 'Albums', 'Recommendations'],
    }),
    recordPlay: build.mutation<
      unknown,
      { trackId: string; progressMs?: number }
    >({
      query: (body) => ({
        url: '/plays',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetTracksQuery,
  useGetTrackGenresQuery,
  useGetRecommendationsQuery,
  useGetTrackQuery,
  useLazyGetStreamUrlQuery,
  useLazyGetDownloadUrlQuery,
  useCreateTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
  useRecordPlayMutation,
} = tracksApi;
