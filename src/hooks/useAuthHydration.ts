/**
 * Hydrate la session au cold start :
 * 1. Lire access token SecureStore
 * 2. Si présent → GET /users/me
 * 3. Sinon → marquer hydraté sans session
 */
import { useEffect } from 'react';

import { getAccessToken, clearTokens } from '@/lib/auth/tokenStorage';
import { useLazyGetMeQuery } from '@/store/api/authApi';
import { useAppDispatch } from '@/store';
import {
  clearCredentials,
  setCredentials,
  setHydrated,
} from '@/store/slices/authSlice';

export function useAuthHydration() {
  const dispatch = useAppDispatch();
  const [fetchMe] = useLazyGetMeQuery();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!cancelled) {
            dispatch(clearCredentials());
            dispatch(setHydrated(true));
          }
          return;
        }

        const user = await fetchMe(undefined).unwrap();
        if (user.status === 'BANNED') {
          await clearTokens();
          if (!cancelled) {
            dispatch(clearCredentials());
          }
        } else if (!cancelled) {
          dispatch(setCredentials({ user }));
        }
      } catch {
        await clearTokens();
        if (!cancelled) {
          dispatch(clearCredentials());
        }
      } finally {
        if (!cancelled) {
          dispatch(setHydrated(true));
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [dispatch, fetchMe]);
}
