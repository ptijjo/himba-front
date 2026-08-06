/**
 * Stub web — @stripe/stripe-react-native est native-only
 * (codegenNativeComponent non supporté sur web).
 */
import { useCallback, useState } from 'react';

import type { Track } from '@/schemas/tracks';

export function usePurchaseTrack() {
  const [error, setError] = useState<string | null>(null);

  const purchaseTrack = useCallback(async (_track: Track): Promise<boolean> => {
    setError(
      'L’achat Stripe est disponible sur l’app mobile (iOS / Android), pas sur le web.',
    );
    return false;
  }, []);

  return {
    purchaseTrack,
    isLoading: false,
    error,
    clearError: () => setError(null),
  };
}
