/**
 * 1. Permission notifications
 * 2. Canal Android « sorties » (HIGH + son)
 * 3. ExpoPushToken (projectId EAS)
 * 4. POST /devices/push-token (appelant)
 *
 * Push distant retiré d’Expo Go (SDK 53+) — synchro Actus via polling + notif locale.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { setStoredPushToken } from '@/lib/push/pushTokenStorage';
import type { UpsertPushTokenValues } from '@/schemas/notifications';

export const SORTIES_CHANNEL_ID = 'sorties';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function ensureAndroidSortiesChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(SORTIES_CHANNEL_ID, {
    name: 'Sorties',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableVibrate: true,
  });
}

/**
 * Bannière locale + son — utiliséée quand une nouvelle Actu arrive (polling / push).
 */
export async function presentSortieAlert(input: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await ensureAndroidSortiesChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      data: input.data,
      ...(Platform.OS === 'android'
        ? { channelId: SORTIES_CHANNEL_ID }
        : {}),
    },
    trigger: null,
  });
}

/**
 * Demande la permission et renvoie le token Expo, ou null si refusé / indispo / Expo Go.
 */
export async function obtainExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo()) {
    return null;
  }

  await ensureAndroidSortiesChannel();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    return null;
  }

  const push = await Notifications.getExpoPushTokenAsync({ projectId });
  await setStoredPushToken(push.data);
  return push.data;
}

export function platformForPush(): UpsertPushTokenValues['platform'] | null {
  if (Platform.OS === 'android') {
    return 'android';
  }
  if (Platform.OS === 'ios') {
    return 'ios';
  }
  return null;
}
