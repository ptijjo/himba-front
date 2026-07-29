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

export const tracksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTracks: build.query<
      TrackList,
      { cursor?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/tracks',
        params: {
          cursor: params?.cursor,
          limit: params?.limit ?? 20,
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
      invalidatesTags: ['Tracks', 'Albums'],
      transformResponse: (response: unknown) => {
        const parsed = trackSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Titre publié invalide');
        }
        return parsed.data;
      },
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
  useRecordPlayMutation,
} = tracksApi;
