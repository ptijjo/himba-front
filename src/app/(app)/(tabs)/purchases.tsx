import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { openAlbum } from '@/lib/navigation/openProfile';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import type { UserPurchaseItem } from '@/schemas/payments';
import { formatTrackPrice } from '@/schemas/tracks';
import { useGetMyPurchasesQuery } from '@/store/api/paymentsApi';

/**
 * Catalogue d’achats — titres + albums, date et montant.
 * Entrée depuis Profil.
 */
export default function PurchasesScreen() {
  const { data, isLoading, isError, refetch, isFetching } =
    useGetMyPurchasesQuery();
  const items = data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-36 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="self-start"
        >
          <Text className="text-base font-semibold text-himba-ember">
            ← Retour
          </Text>
        </Pressable>

        <View className="gap-1">
          <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
            COMPTE
          </Text>
          <Text className="text-3xl font-bold text-himba-ink">Mes achats</Text>
          <Text className="text-himba-mist">
            {items.length} achat{items.length > 1 ? 's' : ''}
          </Text>
        </View>

        {isLoading ? <ActivityIndicator color={himbaColors.ember} /> : null}

        {isError ? (
          <View className="gap-3 rounded-2xl bg-himba-earth p-4">
            <Text className="text-himba-alert">
              Impossible de charger tes achats.
            </Text>
            <Pressable
              onPress={() => {
                void refetch();
              }}
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center rounded-2xl bg-himba-ember"
            >
              <Text className="font-semibold text-himba-ink">Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <Text className="text-himba-mist">
            Aucun achat pour l’instant. Les titres et albums payants apparaîtront
            ici après paiement.
          </Text>
        ) : null}

        <View className="gap-2">
          {items.map((item) => (
            <PurchaseRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </View>

        {isFetching && !isLoading ? (
          <ActivityIndicator color={himbaColors.ember} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PurchaseRow({ item }: { item: UserPurchaseItem }) {
  const { playTrack } = usePlayTrack();

  const title = item.kind === 'track' ? item.track.title : item.album.title;
  const coverUrl =
    item.kind === 'track' ? item.track.coverUrl : item.album.coverUrl;
  const artistName =
    item.kind === 'track'
      ? item.track.artist?.displayName
      : item.album.artist?.displayName;
  const kindLabel = item.kind === 'track' ? 'Titre' : 'Album';
  const dateLabel = formatPurchaseDate(item.createdAt);
  const amountLabel = formatTrackPrice(item.amount ?? null);

  const onPress = () => {
    if (item.kind === 'album') {
      openAlbum(item.album.id);
      return;
    }
    void playTrack({
      id: item.track.id,
      title: item.track.title,
      genre: null,
      price: item.amount,
      coverUrl: item.track.coverUrl,
      artistId: item.track.artist?.id ?? '',
      artist: item.track.artist,
    }).then(() => {
      openLecturePlayer();
    });
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Acheté · ${kindLabel} ${title}, le ${dateLabel}, ${amountLabel}`}
      className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3"
    >
      <View
        className="h-14 w-14 overflow-hidden rounded-xl"
        style={{ backgroundColor: himbaColors.canopy }}
      >
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-[11px] font-semibold text-himba-saffron">
          Acheté · {kindLabel}
        </Text>
        <Text className="font-semibold text-himba-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-sm text-himba-mist" numberOfLines={1}>
          {artistName ?? '—'} · {dateLabel}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-himba-ember">
          Acheté
        </Text>
        <Text className="text-sm font-semibold text-himba-ink">
          {amountLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function formatPurchaseDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
