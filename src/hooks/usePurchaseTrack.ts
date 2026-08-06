/**
 * Achat titre payant (iOS / Android) :
 * 1. POST /payments/tracks/:id/intent → clientSecret
 * 2. PaymentSheet Stripe
 * 3. Attendre le webhook API (Purchase) puis re-tenter le stream
 */
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback, useState } from 'react';

import { clearCachedStreamUrl } from '@/lib/audio/streamUrlCache';
import { playTrackCore } from '@/lib/audio/playTrackCore';
import { getErrorMessage } from '@/lib/errors/apiError';
import type { Track } from '@/schemas/tracks';
import { store } from '@/store';
import { useCreateTrackPaymentIntentMutation } from '@/store/api/paymentsApi';
import { tracksApi } from '@/store/api/tracksApi';

const WEBHOOK_POLL_ATTEMPTS = 8;
const WEBHOOK_POLL_MS = 750;

async function waitForStreamUnlocked(trackId: string): Promise<boolean> {
  clearCachedStreamUrl(trackId);
  for (let i = 0; i < WEBHOOK_POLL_ATTEMPTS; i++) {
    const result = await store.dispatch(
      tracksApi.endpoints.getStreamUrl.initiate(trackId, {
        forceRefetch: true,
      }),
    );
    if (result.data?.url) {
      return true;
    }
    const status =
      typeof result.error === 'object' &&
      result.error !== null &&
      'status' in result.error
        ? (result.error as { status?: number }).status
        : undefined;
    if (status !== 403) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, WEBHOOK_POLL_MS));
  }
  return false;
}

export function usePurchaseTrack() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [createIntent, { isLoading: creatingIntent }] =
    useCreateTrackPaymentIntentMutation();
  const [presenting, setPresenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseTrack = useCallback(
    async (track: Track): Promise<boolean> => {
      setError(null);
      if (track.price == null) {
        setError('Ce titre est gratuit');
        return false;
      }

      try {
        // 1. Intent API
        const intent = await createIntent(track.id).unwrap();
        if (!intent.clientSecret) {
          setError('Paiement indisponible');
          return false;
        }

        // 2. Init + présentation PaymentSheet (carte uniquement côté Intent)
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'Himba',
          paymentIntentClientSecret: intent.clientSecret,
          allowsDelayedPaymentMethods: false,
          returnURL: 'himba://stripe-redirect',
          // Pas de Link / wallets pour l’instant
          link: { display: 'never' },
          googlePay: undefined,
          applePay: undefined,
        });
        if (initError) {
          setError(initError.message || 'Initialisation Stripe impossible');
          return false;
        }

        setPresenting(true);
        const { error: presentError } = await presentPaymentSheet();
        setPresenting(false);

        if (presentError) {
          // Annulation utilisateur — pas d’erreur bloquante
          if (presentError.code === 'Canceled') {
            return false;
          }
          setError(presentError.message || 'Paiement échoué');
          return false;
        }

        // 3. Webhook → Purchase ; poll stream jusqu’à déblocage
        const unlocked = await waitForStreamUnlocked(track.id);
        if (!unlocked) {
          setError(
            'Paiement reçu — l’accès peut prendre quelques secondes. Réessaie la lecture.',
          );
          return false;
        }

        await playTrackCore(track);
        return true;
      } catch (e) {
        setPresenting(false);
        setError(getErrorMessage(e, 'Achat impossible'));
        return false;
      }
    },
    [createIntent, initPaymentSheet, presentPaymentSheet],
  );

  return {
    purchaseTrack,
    isLoading: creatingIntent || presenting,
    error,
    clearError: () => setError(null),
  };
}
