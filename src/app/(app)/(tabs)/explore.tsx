import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile, openUserProfile } from '@/lib/navigation/openProfile';
import type { AppNotification } from '@/schemas/notifications';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/api/notificationsApi';

function formatNotifDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUnread(n: AppNotification): boolean {
  return n.readAt == null;
}

/**
 * Onglet Actus — sorties des artistes suivis + nouveaux followers (in-app + push).
 */
export default function ActusScreen() {
  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    limit: 50,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  const items = data?.items ?? [];
  const hasUnread = items.some(isUnread);

  const onPressItem = useCallback(
    (item: AppNotification) => {
      if (isUnread(item)) {
        void markRead(item.id);
      }
      if (item.type === 'NEW_FOLLOWER' && item.data.followerId) {
        openUserProfile(item.data.followerId);
        return;
      }
      openArtistProfile(item.data.artistId);
    },
    [markRead],
  );

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <View className="flex-1 px-5 pb-2 pt-4">
        <View className="mb-4 flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-[11px] font-bold tracking-[2px] text-himba-ember">
              ACTIVITÉ
            </Text>
            <Text
              className="text-3xl text-himba-ink"
              style={{ fontFamily: 'Literata_700Bold' }}
            >
              Actus
            </Text>
          </View>
          {hasUnread ? (
            <Pressable
              onPress={() => void markAllRead()}
              disabled={markingAll}
              accessibilityRole="button"
              accessibilityLabel="Tout marquer comme lu"
              className="min-h-[44px] justify-center"
            >
              <Text className="text-sm font-semibold text-himba-saffron">
                Tout lire
              </Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <ActivityIndicator color={himbaColors.ember} className="mt-8" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-3 pb-8"
            ListEmptyComponent={
              <View className="mt-2 rounded-2xl bg-himba-earth p-5">
                <Text className="font-semibold text-himba-ink">
                  Aucune alerte
                </Text>
                <Text className="mt-1 text-himba-mist">
                  Suis des artistes pour leurs sorties — et reçois une alerte
                  quand quelqu’un te suit.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const unread = isUnread(item);
              return (
                <Pressable
                  onPress={() => onPressItem(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.body}`}
                  className={`min-h-[72px] rounded-2xl border px-4 py-3 ${
                    unread
                      ? 'border-himba-ochre bg-himba-earth'
                      : 'border-transparent bg-himba-earth/70'
                  }`}
                >
                  <View className="flex-row items-start gap-2">
                    {unread ? (
                      <View className="mt-1.5 h-2 w-2 rounded-full bg-himba-pulse" />
                    ) : (
                      <View className="mt-1.5 h-2 w-2" />
                    )}
                    <View className="flex-1 gap-1">
                      <Text className="font-semibold text-himba-ink">
                        {item.title}
                      </Text>
                      <Text className="text-himba-mist">{item.body}</Text>
                      <Text className="text-xs text-himba-mist">
                        {formatNotifDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
