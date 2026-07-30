/**
 * 1. Permission notifications
 * 2. Canal Android « sorties »
 * 3. ExpoPushToken (projectId EAS)
 * 4. POST /devices/push-token (appelant)
 *
 * Push distant retiré d’Expo Go (SDK 53+) — uniquement en development / production build.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { setStoredPushToken } from '@/lib/push/pushTokenStorage';
import type { UpsertPushTokenValues } from '@/schemas/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function ensureAndroidSortiesChannel(): Promise<void> {
  if (Platform.OS !== 'android' || isExpoGo()) {
    return;
  }
  await Notifications.setNotificationChannelAsync('sorties', {
    name: 'Sorties',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
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
