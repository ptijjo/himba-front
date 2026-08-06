/**
 * StripeProvider natif — clé publique Expo uniquement (jamais la secret key).
 */
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { StripeProvider } from '@stripe/stripe-react-native';
import type { ReactNode } from 'react';

function resolvePublishableKey(): string {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
}

function resolveUrlScheme(): string {
  return Constants.appOwnership === 'expo'
    ? Linking.createURL('/--/')
    : Linking.createURL('');
}

export function HimbaStripeProvider({ children }: { children: ReactNode }) {
  const publishableKey = resolvePublishableKey();

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme={resolveUrlScheme()}
    >
      {children}
    </StripeProvider>
  );
}
