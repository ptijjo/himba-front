import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntityRatingTrigger } from '@/components/ratings/EntityRatingTrigger';
import { TrackRow } from '@/components/tracks/TrackRow';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import type { Track } from '@/schemas/tracks';
import { useGetAlbumQuery } from '@/store/api/albumsApi';
import {
  useAddAlbumFavoriteMutation,
  useGetAlbumFavoritesQuery,
  useRemoveAlbumFavoriteMutation,
} from '@/store/api/libraryApi';

/**
 * Détail album public — titres + favori album (cœur).
 */
export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const albumId = typeof id === 'string' ? id : '';
  const { playTrack } = usePlayTrack();

  const {
    data: album,
    isLoading,
    isError,
  } = useGetAlbumQuery(albumId, { skip: !albumId });
  const { data: albumFavorites = [] } = useGetAlbumFavoritesQuery();
  const [addFavorite, { isLoading: adding }] = useAddAlbumFavoriteMutation();
  const [removeFavorite, { isLoading: removing }] =
    useRemoveAlbumFavoriteMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  const isFavorite = useMemo(
    () => Boolean(albumId && albumFavorites.some((f) => f.albumId === albumId)),
    [albumFavorites, albumId],
  );

  const tracks = useMemo((): Track[] => {
    if (!album?.tracks) {
      return [];
    }
    return album.tracks.map(
      (t): Track => ({
        id: t.id,
        title: t.title,
        genre: t.genre ?? null,
        price: t.price ?? null,
        coverUrl: t.coverUrl ?? album.coverUrl ?? null,
        artistId: album.artistId,
        durationMs: t.durationMs ?? null,
        artist: album.artist
          ? { id: album.artist.id, displayName: album.artist.displayName }
          : undefined,
      }),
    );
  }, [album]);

  const onToggleFavorite = async () => {
    if (!albumId) {
      return;
    }
    setActionError(null);
    try {
      if (isFavorite) {
        await removeFavorite(albumId).unwrap();
      } else {
        await addFavorite(albumId).unwrap();
      }
    } catch (e) {
      setActionError(getErrorMessage(e, 'Action impossible'));
    }
  };

  const onPlayOne = (track: Track) => {
    void playTrack(track, { queue: tracks }).then(() => {
      openLecturePlayer();
    });
  };

  if (!albumId) {
    return (
      <SafeAreaView className="flex-1 bg-himba-night items-center justify-center">
        <Text className="text-himba-mist">Album introuvable.</Text>
      </SafeAreaView>
    );
  }

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

        {isLoading ? <ActivityIndicator color={himbaColors.ember} /> : null}
        {isError || (!isLoading && !album) ? (
          <Text className="text-himba-alert">Album introuvable.</Text>
        ) : null}

        {album ? (
          <>
            <View className="items-center gap-3">
              <View
                className="h-48 w-48 overflow-hidden rounded-2xl"
                style={{ backgroundColor: himbaColors.canopy }}
              >
                {album.coverUrl ? (
                  <Image
                    source={{ uri: album.coverUrl }}
                    style={{ width: 192, height: 192 }}
                    contentFit="cover"
                  />
                ) : null}
              </View>
              <Text className="text-center text-2xl font-bold text-himba-ink">
                {album.title}
              </Text>
              {album.artist ? (
                <Pressable
                  onPress={() => openArtistProfile(album.artistId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Profil de ${album.artist.displayName}`}
                >
                  <Text className="text-base text-himba-ember">
                    {album.artist.displayName}
                  </Text>
                </Pressable>
              ) : null}
              <Text className="text-sm text-himba-mist">
                {tracks.length} titre{tracks.length > 1 ? 's' : ''}
              </Text>
              <View className="w-full items-center">
                <EntityRatingTrigger
                  summary={album.ratingSummary}
                  target={{ albumId }}
                  sheetTitle={album.title}
                  align="center"
                />
              </View>
              <Pressable
                onPress={() => {
                  void onToggleFavorite();
                }}
                disabled={adding || removing}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite ? 'Retirer des albums aimés' : 'Aimer cet album'
                }
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4"
                style={{
                  backgroundColor: isFavorite
                    ? himbaColors.ember
                    : himbaColors.earth,
                }}
              >
                <Text
                  className="text-lg"
                  style={{
                    color: isFavorite ? himbaColors.white : himbaColors.ember,
                  }}
                >
                  {isFavorite ? '♥ Aimé' : '♡ Aimer'}
                </Text>
              </Pressable>
              {actionError ? (
                <Text className="text-sm text-himba-alert">{actionError}</Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Text className="text-lg font-bold text-himba-ink">Titres</Text>
              {tracks.length === 0 ? (
                <Text className="text-himba-mist">Aucun titre.</Text>
              ) : (
                tracks.map((track) => (
                  <TrackRow key={track.id} track={track} onPress={onPlayOne} />
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
