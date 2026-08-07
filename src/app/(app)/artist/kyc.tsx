/**
 * Deep link himba://artist/kyc — retour après Account Link Stripe.
 * 1. Refresh Artist + /users/me  2. Redirige vers le profil
 */
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';
import { useArtistStripeOnboarding } from '@/hooks/useArtistStripeOnboarding';
import { useAppSelector } from '@/store';

export default function ArtistKycReturnScreen() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { refreshAfterOnboarding } = useArtistStripeOnboarding();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      await refreshAfterOnboarding();
      if (!cancelled) {
        setDone(true);
        router.replace('/(app)/(tabs)/profile');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshAfterOnboarding]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-himba-night">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <ActivityIndicator color={himbaColors.ember} size="large" />
        <Text className="text-center text-himba-ink">
          {done
            ? 'Retour au profil…'
            : 'Synchronisation de ta vérification Stripe…'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
