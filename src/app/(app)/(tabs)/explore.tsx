import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackActionsSheet } from '@/components/tracks/TrackActionsSheet';
import { himbaColors } from '@/constants/theme';
import { openArtistProfile, openUserProfile } from '@/lib/navigation/openProfile';
import type { AppNotification } from '@/schemas/notifications';
import {
  useDeleteAllNotificationsMutation,
  useDeleteNotificationMutation,
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
 * Onglet Actus — sorties + followers.
 * Non-lues : pastille + gras. Menu ⋮ : supprimer. Header : tout lire / tout effacer.
 */
export default function ActusScreen() {
  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    limit: 50,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();
  const [deleteOne] = useDeleteNotificationMutation();
  const [deleteAll, { isLoading: clearing }] =
    useDeleteAllNotificationsMutation();

  const [menuItem, setMenuItem] = useState<AppNotification | null>(null);

  const items = data?.items ?? [];
  const hasUnread = items.some(isUnread);
  const hasItems = items.length > 0;

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

  const onConfirmClearAll = () => {
    Alert.alert(
      'Tout effacer',
      'Supprimer toutes les actualités ? Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            void deleteAll();
          },
        },
      ],
    );
  };

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
          <View className="flex-row items-center gap-4">
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
            {hasItems ? (
              <Pressable
                onPress={onConfirmClearAll}
                disabled={clearing}
                accessibilityRole="button"
                accessibilityLabel="Tout effacer"
                className="min-h-[44px] justify-center"
              >
                <Text className="text-sm font-semibold text-himba-alert">
                  Tout effacer
                </Text>
              </Pressable>
            ) : null}
          </View>
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
                <View
                  className={`min-h-[72px] flex-row items-stretch rounded-2xl ${
                    unread ? 'bg-himba-earth' : 'bg-himba-earth/55'
                  }`}
                >
                  <Pressable
                    onPress={() => onPressItem(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unread }}
                    accessibilityLabel={`${unread ? 'Non lue. ' : ''}${item.title}. ${item.body}`}
                    className="min-h-[72px] flex-1 flex-row items-start gap-3 px-3 py-3 pr-1"
                  >
                    <View className="w-3 items-center pt-2">
                      {unread ? (
                        <View
                          className="h-2.5 w-2.5 rounded-full bg-himba-ember"
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      ) : null}
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                        className={`text-himba-ink ${
                          unread ? 'font-bold' : 'font-normal'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className={`text-himba-mist ${
                          unread ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {item.body}
                      </Text>
                      <Text className="text-xs text-himba-mist">
                        {formatNotifDate(item.createdAt)}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setMenuItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Options pour ${item.title}`}
                    hitSlop={8}
                    className="min-h-[44px] min-w-[44px] items-center justify-center px-3"
                  >
                    <Text className="text-xl leading-none text-himba-mist">
                      ⋮
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>

      <TrackActionsSheet
        visible={menuItem !== null}
        title={menuItem?.title}
        subtitle={menuItem?.body}
        onClose={() => setMenuItem(null)}
        actions={
          menuItem
            ? [
                ...(isUnread(menuItem)
                  ? [
                      {
                        key: 'read',
                        label: 'Marquer comme lu',
                        onPress: () => {
                          void markRead(menuItem.id);
                        },
                      },
                    ]
                  : []),
                {
                  key: 'delete',
                  label: 'Supprimer',
                  destructive: true,
                  onPress: () => {
                    void deleteOne(menuItem.id);
                  },
                },
              ]
            : []
        }
      />
    </SafeAreaView>
  );
}
