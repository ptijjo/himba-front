/**
 * Profils publics — GET /users/:id/public|playlists|follows.
 */
import { followSchema, type Follow } from '@/schemas/library';
import {
  publicPlaylistSchema,
  userPublicProfileSchema,
  type PublicPlaylist,
  type UserPublicProfile,
} from '@/schemas/users';
import { z } from 'zod';
import { baseApi } from '@/store/api/baseApi';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicProfile: build.query<UserPublicProfile, string>({
      query: (userId) => `/users/${userId}/public`,
      transformResponse: (response: unknown) => {
        const parsed = userPublicProfileSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Profil public invalide');
        }
        return parsed.data;
      },
    }),
    getUserPlaylists: build.query<PublicPlaylist[], string>({
      query: (userId) => `/users/${userId}/playlists`,
      transformResponse: (response: unknown) => {
        const parsed = z.array(publicPlaylistSchema).safeParse(response);
        if (!parsed.success) {
          throw new Error('Playlists publiques invalides');
        }
        return parsed.data;
      },
    }),
    getUserFollows: build.query<Follow[], string>({
      query: (userId) => `/users/${userId}/follows`,
      transformResponse: (response: unknown) => {
        const parsed = z.array(followSchema).safeParse(response);
        if (!parsed.success) {
          throw new Error('Suivis publics invalides');
        }
        return parsed.data;
      },
    }),
  }),
});

export const {
  useGetPublicProfileQuery,
  useGetUserPlaylistsQuery,
  useGetUserFollowsQuery,
} = usersApi;
