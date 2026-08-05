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
import { Button } from '@/components/ui/Button';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { useToast } from '@/providers/ToastProvider';
import type { Track } from '@/schemas/tracks';
import { useGetAlbumQuery } from '@/store/api/albumsApi';
import {
  useAddAlbumFavoriteMutation,
  useGetAlbumFavoritesQuery,
  useRemoveAlbumFavoriteMutation,
} from '@/store/api/libraryApi';

/**
 * Détail album public — lecture de l’album + favori (cœur).
 */
export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const albumId = typeof id === 'string' ? id : '';
  const { playTrack } = usePlayTrack();
  const { showToast } = useToast();

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
        showToast({ message: 'Album retiré de ta bibliothèque', kind: 'info' });
      } else {
        await addFavorite(albumId).unwrap();
        showToast({ message: 'Album ajouté à ta bibliothèque' });
      }
    } catch (e) {
      const msg = getErrorMessage(e, 'Action impossible');
      setActionError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  };

  // Lance l’album depuis le 1er titre, file = tous les titres de l’album
  const onPlayAll = () => {
    const first = tracks[0];
    if (!first) {
      showToast({ message: 'Aucun titre dans cet album', kind: 'info' });
      return;
    }
    void playTrack(first, { queue: tracks }).then(() => {
      showToast({
        message: `Lecture · ${album?.title ?? 'album'}`,
        kind: 'info',
      });
      openLecturePlayer();
    });
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
              <View className="w-full flex-row items-center gap-3">
                <View className="flex-1">
                  <Button
                    label="▶  Tout lire"
                    disabled={tracks.length === 0}
                    onPress={onPlayAll}
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
                  className="min-h-[52px] min-w-[52px] items-center justify-center rounded-full px-4"
                  style={{
                    backgroundColor: isFavorite
                      ? himbaColors.ember
                      : himbaColors.earth,
                    borderWidth: isFavorite ? 0 : 1,
                    borderColor: himbaColors.copper,
                  }}
                >
                  <Text
                    className="text-xl"
                    style={{
                      color: isFavorite ? himbaColors.white : himbaColors.ember,
                    }}
                  >
                    {isFavorite ? '♥' : '♡'}
                  </Text>
                </Pressable>
              </View>
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
