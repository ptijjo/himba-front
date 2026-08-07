/**
 * KYC Stripe Connect Express :
 * 1. POST /artists/me/stripe/onboarding-link
 * 2. Ouvrir l’Account Link (navigateur in-app)
 * 3. Au retour : refresh profil artiste + /users/me (rôle ARTIST si VERIFIED)
 */
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/lib/errors/apiError';
import { useAppDispatch } from '@/store';
import {
  useCreateStripeOnboardingLinkMutation,
  useLazyGetMyArtistQuery,
} from '@/store/api/artistsApi';
import { useLazyGetMeQuery } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';

WebBrowser.maybeCompleteAuthSession();

const KYC_POLL_ATTEMPTS = 6;
const KYC_POLL_MS = 1000;

export function useArtistStripeOnboarding() {
  const dispatch = useAppDispatch();
  const [createLink, { isLoading: creatingLink }] =
    useCreateStripeOnboardingLinkMutation();
  const [fetchMyArtist] = useLazyGetMyArtistQuery();
  const [fetchMe] = useLazyGetMeQuery();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAfterOnboarding = useCallback(async () => {
    // 1. Poll Artist KYC (webhook account.updated peut être légèrement différé)
    for (let i = 0; i < KYC_POLL_ATTEMPTS; i++) {
      const artistResult = await fetchMyArtist(undefined, false);
      const artist = artistResult.data;
      if (artist && !artist.needsOnboarding) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, KYC_POLL_MS));
    }

    // 2. Recharger user (role LISTENER → ARTIST si VERIFIED)
    try {
      const me = await fetchMe().unwrap();
      dispatch(setCredentials({ user: me }));
    } catch {
      // Non bloquant — l’UI artiste se mettra à jour au prochain cold start
    }
  }, [dispatch, fetchMe, fetchMyArtist]);

  const startOnboarding = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const { onboardingUrl } = await createLink().unwrap();
      setOpening(true);
      // Navigateur système / Custom Tabs — l’artiste revient via return_url HTML
      await WebBrowser.openBrowserAsync(onboardingUrl, {
        dismissButtonStyle: 'close',
        enableBarCollapsing: true,
      });
      setOpening(false);
      await refreshAfterOnboarding();
      return true;
    } catch (e) {
      setOpening(false);
      setError(getErrorMessage(e, 'Impossible d’ouvrir Stripe'));
      return false;
    }
  }, [createLink, refreshAfterOnboarding]);

  return {
    startOnboarding,
    refreshAfterOnboarding,
    isLoading: creatingLink || opening,
    error,
    clearError: () => setError(null),
  };
}
