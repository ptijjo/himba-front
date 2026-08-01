/**
 * Synchro Actus sans reload :
 * 1. Poll GET /notifications
 * 2. Badge système + compteur onglet
 * 3. Si nouvelles non-lues → bannière + son (notif locale)
 * 4. Écoute push distant → invalidate cache
 */
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import {
  ensureAndroidSortiesChannel,
  presentSortieAlert,
} from '@/lib/push/registerForPush';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  notificationsApi,
  useGetNotificationsQuery,
} from '@/store/api/notificationsApi';

const POLL_MS = 8_000;

function unreadCountFrom(
  items: Array<{ id: string; readAt?: string | Date | null }>,
): number {
  return items.filter((n) => n.readAt == null).length;
}

export function useNotificationsLiveSync() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isHydrated } = useAppSelector((s) => s.auth);
  const ready = isHydrated && isAuthenticated;

  const { data } = useGetNotificationsQuery(
    { limit: 50 },
    {
      skip: !ready,
      pollingInterval: ready ? POLL_MS : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  const primed = useRef(false);
  const knownUnreadIds = useRef<Set<string>>(new Set());

  // Canal + permission notifs (locales) dès que la session est prête
  useEffect(() => {
    if (!ready) {
      return;
    }
    void (async () => {
      await ensureAndroidSortiesChannel();
      const current = await Notifications.getPermissionsAsync();
      if (current.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, [ready]);

  // Push distant reçu → rafraîchir le fil Actus (+ bannière si le système ne l’a pas montrée)
  useEffect(() => {
    if (!ready) {
      return;
    }
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      dispatch(notificationsApi.util.invalidateTags(['Notifications']));
      const content = notification.request.content;
      const id = notification.request.identifier;
      if (id && knownUnreadIds.current.has(id)) {
        return;
      }
      // Marquer pour éviter double alerte polling juste après
      if (content.title && content.body) {
        knownUnreadIds.current.add(id);
      }
    });
    return () => {
      sub.remove();
    };
  }, [dispatch, ready]);

  // Retour avant-plan → refetch immédiat
  useEffect(() => {
    if (!ready) {
      return;
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        dispatch(notificationsApi.util.invalidateTags(['Notifications']));
      }
    });
    return () => {
      sub.remove();
    };
  }, [dispatch, ready]);

  useEffect(() => {
    if (!ready || !data) {
      if (!ready) {
        primed.current = false;
        knownUnreadIds.current = new Set();
        void Notifications.setBadgeCountAsync(0);
      }
      return;
    }

    const unread = data.items.filter((n) => n.readAt == null);
    const count = unread.length;
    void Notifications.setBadgeCountAsync(count);

    if (!primed.current) {
      // Premier chargement : pas d’alerte (évite popup au cold start)
      primed.current = true;
      knownUnreadIds.current = new Set(unread.map((n) => n.id));
      return;
    }

    const fresh = unread.filter((n) => !knownUnreadIds.current.has(n.id));
    knownUnreadIds.current = new Set([
      ...knownUnreadIds.current,
      ...unread.map((n) => n.id),
    ]);

    if (fresh.length === 0) {
      return;
    }

    // API renvoie createdAt desc → fresh[0] = plus récente
    const latest = fresh[0];
    if (!latest) {
      return;
    }

    void presentSortieAlert({
      title: latest.title,
      body: latest.body,
      data: latest.data,
    });
  }, [data, ready]);
}

/** Nombre de non-lues pour le badge onglet Actus (cache RTK partagé). */
export function useUnreadNotificationsCount(): number {
  const { isAuthenticated, isHydrated } = useAppSelector((s) => s.auth);
  const { data } = useGetNotificationsQuery(
    { limit: 50 },
    { skip: !isHydrated || !isAuthenticated },
  );
  return unreadCountFrom(data?.items ?? []);
}
