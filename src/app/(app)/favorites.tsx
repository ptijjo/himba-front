import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import type { Track } from '@/schemas/tracks';
import {
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';

/**
 * Favoris — détail : titres + file de lecture (comme une playlist).
 */
export default function FavoritesScreen() {
  const { playTrack } = usePlayTrack();
  const { data: favorites = [], isLoading } = useGetFavoritesQuery();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const tracks = useMemo((): Track[] => {
    return favorites
      .map((fav) => fav.track)
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map(
        (t): Track => ({
          id: t.id,
          title: t.title,
          genre: t.genre ?? null,
          price: t.price ?? null,
          coverUrl: t.coverUrl ?? null,
          artistId: t.artistId ?? '',
          durationMs: t.durationMs,
        }),
      );
  }, [favorites]);

  const onPlayAll = () => {
    const first = tracks[0];
    if (first) {
      void playTrack(first, { queue: tracks });
    }
  };

  const onPlayOne = (track: Track) => {
    void playTrack(track, { queue: tracks });
  };

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
          <Text className="text-3xl font-bold text-himba-ink">Favoris</Text>
          <Text className="text-himba-mist">
            {tracks.length} titre{tracks.length > 1 ? 's' : ''}
          </Text>
        </View>

        <Button
          label="Tout lire"
          disabled={tracks.length === 0}
          onPress={onPlayAll}
        />

        {isLoading ? (
          <ActivityIndicator color={himbaColors.ember} />
        ) : tracks.length === 0 ? (
          <Text className="text-himba-mist">Aucun favori pour l’instant.</Text>
        ) : (
          <View className="gap-2">
            {tracks.map((track) => {
              const fav = favorites.find((f) => f.trackId === track.id);
              return (
                <View key={track.id} className="gap-1">
                  <TrackRow track={track} onPress={onPlayOne} />
                  {fav ? (
                    <Pressable
                      onPress={() => {
                        void removeFavorite(fav.trackId);
                      }}
                      className="self-end px-2"
                      accessibilityRole="button"
                      accessibilityLabel="Retirer des favoris"
                    >
                      <Text className="text-xs text-himba-mist">Retirer</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
