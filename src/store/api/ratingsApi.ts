/**
 * PUT /ratings — upsert note titre / artiste / album.
 */
import {
  ratingSchema,
  upsertRatingBodySchema,
  type Rating,
  type UpsertRatingBody,
} from '@/schemas/ratings';
import { baseApi } from '@/store/api/baseApi';

export const ratingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    upsertRating: build.mutation<Rating, UpsertRatingBody>({
      query: (body) => ({
        url: '/ratings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => {
        const tags: (
          | { type: 'Tracks'; id: string }
          | { type: 'Artists'; id: string }
          | { type: 'Albums'; id: string }
        )[] = [];
        if (arg.trackId) {
          tags.push({ type: 'Tracks', id: arg.trackId });
        }
        if (arg.artistId) {
          tags.push({ type: 'Artists', id: arg.artistId });
        }
        if (arg.albumId) {
          tags.push({ type: 'Albums', id: arg.albumId });
        }
        return tags;
      },
      transformResponse: (response: unknown) => {
        const parsed = ratingSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Note invalide');
        }
        return parsed.data;
      },
    }),
  }),
});

export const { useUpsertRatingMutation } = ratingsApi;

/** Valide le corps avant envoi (Zod formulaire / appel manuel). */
export function parseUpsertRatingBody(raw: unknown): UpsertRatingBody {
  const parsed = upsertRatingBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Note invalide');
  }
  return parsed.data;
}
