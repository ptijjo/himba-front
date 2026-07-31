/**
 * Bibliothèque — favoris, follows, playlists (MVP).
 */
import {
  createPlaylistSchema,
  albumFavoriteSchema,
  favoriteSchema,
  followSchema,
  playlistDetailSchema,
  playlistListSchema,
  playlistSchema,
  type AlbumFavorite,
  type CreatePlaylistValues,
  type Favorite,
  type Follow,
  type Playlist,
  type PlaylistDetail,
} from '@/schemas/library';
import { z } from 'zod';
import { baseApi } from '@/store/api/baseApi';

export const libraryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFavorites: build.query<Favorite[], void>({
      query: () => '/library/favorites',
      providesTags: ['Favorites'],
      transformResponse: (response: unknown) => {
        const parsed = z.array(favoriteSchema).safeParse(response);
        if (!parsed.success) {
          throw new Error('Favoris invalides');
        }
        return parsed.data;
      },
    }),
    addFavorite: build.mutation<Favorite, string>({
      query: (trackId) => ({
        url: `/library/favorites/${trackId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Favorites'],
    }),
    removeFavorite: build.mutation<void, string>({
      query: (trackId) => ({
        url: `/library/favorites/${trackId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),
    getAlbumFavorites: build.query<AlbumFavorite[], void>({
      query: () => '/library/album-favorites',
      providesTags: ['AlbumFavorites'],
      transformResponse: (response: unknown) => {
        const parsed = z.array(albumFavoriteSchema).safeParse(response);
        if (!parsed.success) {
          throw new Error('Favoris albums invalides');
        }
        return parsed.data;
      },
    }),
    addAlbumFavorite: build.mutation<AlbumFavorite, string>({
      query: (albumId) => ({
        url: `/library/album-favorites/${albumId}`,
        method: 'POST',
      }),
      invalidatesTags: ['AlbumFavorites'],
      transformResponse: (response: unknown) => {
        // POST renvoie la ligne Prisma brute (sans include album)
        const parsed = albumFavoriteSchema
          .omit({ album: true })
          .safeParse(response);
        if (!parsed.success) {
          throw new Error('Favori album invalide');
        }
        return parsed.data;
      },
    }),
    removeAlbumFavorite: build.mutation<void, string>({
      query: (albumId) => ({
        url: `/library/album-favorites/${albumId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AlbumFavorites'],
    }),
    getFollows: build.query<Follow[], void>({
      query: () => '/library/follows',
      providesTags: ['Follows'],
      transformResponse: (response: unknown) => {
        const parsed = z.array(followSchema).safeParse(response);
        if (!parsed.success) {
          throw new Error('Abonnements invalides');
        }
        return parsed.data;
      },
    }),
    followArtist: build.mutation<Follow, string>({
      query: (artistId) => ({
        url: `/library/follows/${artistId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Follows', 'Artists'],
      transformResponse: (response: unknown) => {
        const parsed = followSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Abonnement invalide');
        }
        return parsed.data;
      },
    }),
    unfollowArtist: build.mutation<void, string>({
      query: (artistId) => ({
        url: `/library/follows/${artistId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Follows', 'Artists'],
    }),
    getPlaylists: build.query<
      { items: Playlist[]; nextCursor: string | null },
      void
    >({
      query: () => '/playlists',
      providesTags: ['Playlists'],
      transformResponse: (response: unknown) => {
        const parsed = playlistListSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Playlists invalides');
        }
        return parsed.data;
      },
    }),
    getPlaylist: build.query<PlaylistDetail, string>({
      query: (id) => `/playlists/${id}`,
      providesTags: ['Playlists'],
      transformResponse: (response: unknown) => {
        const parsed = playlistDetailSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Détail playlist invalide');
        }
        return parsed.data;
      },
    }),
    createPlaylist: build.mutation<Playlist, CreatePlaylistValues>({
      query: (body) => ({
        url: '/playlists',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Playlists'],
      transformResponse: (response: unknown) => {
        const parsed = playlistSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Playlist invalide');
        }
        return parsed.data;
      },
      async onQueryStarted(arg, { queryFulfilled }) {
        createPlaylistSchema.parse(arg);
        await queryFulfilled;
      },
    }),
    addPlaylistTrack: build.mutation<
      unknown,
      { playlistId: string; trackId: string }
    >({
      query: ({ playlistId, trackId }) => ({
        url: `/playlists/${playlistId}/tracks`,
        method: 'POST',
        body: { trackId },
      }),
      invalidatesTags: ['Playlists'],
    }),
    deletePlaylist: build.mutation<void, string>({
      query: (playlistId) => ({
        url: `/playlists/${playlistId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Playlists'],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetAlbumFavoritesQuery,
  useAddAlbumFavoriteMutation,
  useRemoveAlbumFavoriteMutation,
  useGetFollowsQuery,
  useFollowArtistMutation,
  useUnfollowArtistMutation,
  useGetPlaylistsQuery,
  useGetPlaylistQuery,
  useLazyGetPlaylistQuery,
  useCreatePlaylistMutation,
  useAddPlaylistTrackMutation,
  useDeletePlaylistMutation,
} = libraryApi;
