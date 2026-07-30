/**
 * Après hydratation auth : permission + token Expo → POST /devices/push-token.
 */
import { useEffect, useRef } from 'react';

import {
  obtainExpoPushToken,
  platformForPush,
} from '@/lib/push/registerForPush';
import { useUpsertPushTokenMutation } from '@/store/api/notificationsApi';
import { useAppSelector } from '@/store';

export function usePushRegistration() {
  const { isAuthenticated, isHydrated } = useAppSelector((s) => s.auth);
  const [upsertPushToken] = useUpsertPushTokenMutation();
  const started = useRef(false);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      started.current = false;
      return;
    }
    if (started.current) {
      return;
    }
    started.current = true;

    async function register() {
      try {
        const platform = platformForPush();
        if (!platform) {
          return;
        }
        const token = await obtainExpoPushToken();
        if (!token) {
          return;
        }
        await upsertPushToken({ token, platform }).unwrap();
      } catch {
        // Permission refusée ou build sans push — le fil Actus reste disponible.
        started.current = false;
      }
    }

    void register();
  }, [isAuthenticated, isHydrated, upsertPushToken]);
}
