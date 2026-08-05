/**
 * Tap notif (locale ou push) → profil artiste.
 * Une seule navigation par identifiant de notif.
 */
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { openArtistProfile, openUserProfile } from '@/lib/navigation/openProfile';
import { notificationDataSchema } from '@/schemas/notifications';

const handledResponseIds = new Set<string>();

function navigateFromNotificationData(raw: unknown): void {
  const parsed = notificationDataSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }
  // Réponse signalement : pas de deep-link (reste dans Actus)
  if (parsed.data.reportId) {
    return;
  }
  // Nouveau follower → profil de celui qui suit ; sinon profil artiste (sortie)
  if (parsed.data.followerId) {
    openUserProfile(parsed.data.followerId);
    return;
  }
  if (parsed.data.artistId) {
    openArtistProfile(parsed.data.artistId);
  }
}

function handleResponse(
  response: Notifications.NotificationResponse | null,
): void {
  if (!response) {
    return;
  }
  const id = response.notification.request.identifier;
  if (handledResponseIds.has(id)) {
    return;
  }
  handledResponseIds.add(id);
  navigateFromNotificationData(response.notification.request.content.data);
}

export function useNotificationOpenHandler() {
  const coldStartDone = useRef(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response);
      },
    );

    if (!coldStartDone.current) {
      coldStartDone.current = true;
      void Notifications.getLastNotificationResponseAsync().then(handleResponse);
    }

    return () => {
      sub.remove();
    };
  }, []);
}
