/**
 * URL de base API Himba.
 * Sur Expo Go / appareil physique, `localhost` pointe vers le téléphone —
 * on remplace par l’IP du PC (host Metro) en développement.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function extractPort(url: string | undefined, fallback: string): string {
  if (!url) {
    return fallback;
  }
  const match = url.match(/:(\d+)\/?$/);
  return match?.[1] ?? fallback;
}

function isLoopbackHost(url: string): boolean {
  return (
    url.includes('://localhost') ||
    url.includes('://127.0.0.1') ||
    url.includes('://[::1]')
  );
}

/** IP / hostname du packager Expo (ex. 192.168.1.119). */
export function resolveExpoDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    null;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

export function getApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8989').replace(
    /\/$/,
    '',
  );
  const port = extractPort(configured, '8989');

  if (!isLoopbackHost(configured)) {
    return configured;
  }

  // 1. Appareil physique / Expo Go → IP LAN du PC
  const lanHost = resolveExpoDevHost();
  if (lanHost) {
    return `http://${lanHost}:${port}`;
  }

  // 2. Émulateur Android → alias machine hôte
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  // 3. Simulateur iOS / web sur la machine
  return configured;
}
