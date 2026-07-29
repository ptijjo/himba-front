import { Literata_700Bold, useFonts } from '@expo-google-fonts/literata';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { himbaColors } from '@/constants/theme';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { AudioPlayerProvider } from '@/providers/AudioPlayerProvider';
import { store } from '@/store';

import '@/global.css';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  useAuthHydration();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: himbaColors.night },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Literata_700Bold });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <AudioPlayerProvider>
        <RootNavigator />
      </AudioPlayerProvider>
    </Provider>
  );
}
