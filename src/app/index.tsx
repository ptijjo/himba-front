import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { useAppSelector } from '@/store';

/** Point d’entrée — redirige selon la session SecureStore hydratée. */
export default function Index() {
  const { isAuthenticated, isHydrated } = useAppSelector((s) => s.auth);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-himba-night">
        <ActivityIndicator color={himbaColors.ember} size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
