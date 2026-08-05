import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlbumRow } from '@/components/albums/AlbumRow';
import { himbaColors } from '@/constants/theme';
import { openAlbum } from '@/lib/navigation/openProfile';
import { useGetAlbumFavoritesQuery } from '@/store/api/libraryApi';

/**
 * Albums aimés — liste bibliothèque.
 */
export default function LibraryAlbumsScreen() {
  const { data: albumFavorites = [], isLoading } = useGetAlbumFavoritesQuery();

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
            BIBLIOTHÈQUE
          </Text>
          <Text className="text-3xl font-bold text-himba-ink">Albums</Text>
          <Text className="text-himba-mist">
            {albumFavorites.length} album
            {albumFavorites.length > 1 ? 's' : ''}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={himbaColors.ember} />
        ) : albumFavorites.length === 0 ? (
          <Text className="text-himba-mist">
            Aucun album aimé pour l’instant. Ouvre un album et appuie sur le
            cœur.
          </Text>
        ) : (
          <View className="gap-2">
            {albumFavorites.map((fav) => {
              const album = fav.album;
              if (!album) {
                return null;
              }
              const trackCount = album._count?.tracks ?? 0;
              const artistName = album.artist?.displayName ?? 'Album';
              const countLabel =
                trackCount > 0
                  ? ` · ${trackCount} titre${trackCount > 1 ? 's' : ''}`
                  : '';
              return (
                <AlbumRow
                  key={fav.id}
                  albumId={album.id}
                  title={album.title}
                  coverUrl={album.coverUrl}
                  subtitle={`${artistName}${countLabel}`}
                  onPress={() => openAlbum(album.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
