import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { useAppSelector } from '@/store';

export default function AuthGroupLayout() {
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: himbaColors.night },
        animation: 'fade',
      }}
    />
  );
}
