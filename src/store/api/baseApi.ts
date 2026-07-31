/**
 * baseApi RTK Query — Bearer depuis SecureStore + refresh silencieux sur 401.
 * baseUrl résolu à chaque requête (IP LAN Expo Go vs localhost).
 */
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { getApiBaseUrl } from '@/constants/api';
import { clearTokens, getAccessToken } from '@/lib/auth/tokenStorage';
import { refreshAccessToken } from '@/lib/auth/refreshAccessToken';
import { clearCredentials } from '@/store/slices/authSlice';

const rawBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  return fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: async (headers) => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
    // FormData (avatar) : laisser le runtime poser le boundary multipart.
    fetchFn: async (input, init) => {
      if (init?.body instanceof FormData && init.headers) {
        const headers = new Headers(init.headers);
        headers.delete('Content-Type');
        return fetch(input, { ...init, headers });
      }
      return fetch(input, init);
    },
  })(args, api, extraOptions);
};

let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      await clearTokens();
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Les onglets restent montés : sans refetch, le catalogue reste figé jusqu’au logout.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Me',
    'MyArtist',
    'Tracks',
    'Albums',
    'Recommendations',
    'Favorites',
    'AlbumFavorites',
    'Follows',
    'Playlists',
    'Notifications',
    'Artists',
  ],
  endpoints: () => ({}),
});
