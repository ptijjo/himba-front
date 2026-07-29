import { getApiBaseUrl, resolveExpoDevHost } from '@/constants/api';

jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: '192.168.1.119:8081' },
  expoGoConfig: { debuggerHost: '192.168.1.119:8081' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('getApiBaseUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalEnv;
  });

  it('remplace localhost par l’IP Expo en dev', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8989';
    expect(getApiBaseUrl()).toBe('http://192.168.1.119:8989');
  });

  it('conserve une URL LAN déjà configurée', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.0.5:8989';
    expect(getApiBaseUrl()).toBe('http://10.0.0.5:8989');
  });

  it('conserve l’URL API production HTTPS', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://himba.cellulenoire.fr';
    expect(getApiBaseUrl()).toBe('https://himba.cellulenoire.fr');
  });

  it('extrait le host Expo', () => {
    expect(resolveExpoDevHost()).toBe('192.168.1.119');
  });
});
