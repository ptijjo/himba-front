import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import type { Album } from '@/schemas/albums';
import { formatTrackPrice, type Track } from '@/schemas/tracks';
import {
  useDeleteAlbumMutation,
} from '@/store/api/albumsApi';
import { useDeleteTrackMutation } from '@/store/api/tracksApi';

type StudioLibrarySectionProps = {
  albums: Album[];
  tracks: Track[];
  loading?: boolean;
};

/**
 * Catalogue Studio de l’artiste — modifier / supprimer titres et albums
 * (routes API PATCH/DELETE, rôles ARTIST | ADMIN).
 */
export function StudioLibrarySection({
  albums,
  tracks,
  loading,
}: StudioLibrarySectionProps) {
  const [deleteTrack, { isLoading: deletingTrack }] = useDeleteTrackMutation();
  const [deleteAlbum, { isLoading: deletingAlbum }] = useDeleteAlbumMutation();
  const busy = deletingTrack || deletingAlbum;

  const confirmDeleteTrack = (track: Track) => {
    Alert.alert(
      'Supprimer le titre',
      `« ${track.title} » sera définitivement retiré du catalogue.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTrack(track.id).unwrap();
              } catch (e) {
                Alert.alert(
                  'Erreur',
                  getErrorMessage(e, 'Suppression impossible'),
                );
              }
            })();
          },
        },
      ],
    );
  };

  const confirmDeleteAlbum = (album: Album) => {
    Alert.alert(
      'Supprimer l’album',
      `« ${album.title} » sera supprimé. Les titres restent disponibles (détachés).`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteAlbum(album.id).unwrap();
              } catch (e) {
                Alert.alert(
                  'Erreur',
                  getErrorMessage(e, 'Suppression impossible'),
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View className="gap-4">
      <View>
        <Text className="text-lg font-bold text-himba-ink">Mes albums</Text>
        <Text className="mt-1 text-sm text-himba-mist">
          Modifier la fiche ou supprimer l’album.
        </Text>
      </View>

      {loading ? (
        <Text className="text-sm text-himba-mist">Chargement…</Text>
      ) : null}

      {!loading && albums.length === 0 ? (
        <Text className="text-sm text-himba-mist">Aucun album pour l’instant.</Text>
      ) : null}

      {albums.map((album) => (
        <View
          key={album.id}
          className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3"
        >
          <View
            className="h-14 w-14 overflow-hidden rounded-xl"
            style={{ backgroundColor: himbaColors.canopy }}
          >
            {album.coverUrl ? (
              <Image
                source={{ uri: album.coverUrl }}
                style={{ width: 56, height: 56 }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-himba-ink" numberOfLines={1}>
              {album.title}
            </Text>
            <Text className="text-sm text-himba-mist">
              {album._count?.tracks ?? 0} titre
              {(album._count?.tracks ?? 0) > 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${album.title}`}
            disabled={busy}
            onPress={() => router.push(`/(app)/(tabs)/edit-album/${album.id}`)}
            className="min-h-11 justify-center px-2"
          >
            <Text className="text-sm font-semibold text-himba-ember">
              Modifier
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Supprimer ${album.title}`}
            disabled={busy}
            onPress={() => confirmDeleteAlbum(album)}
            className="min-h-11 justify-center px-2"
          >
            <Text className="text-sm font-semibold text-himba-alert">
              Suppr.
            </Text>
          </Pressable>
        </View>
      ))}

      <View className="mt-2">
        <Text className="text-lg font-bold text-himba-ink">Mes titres</Text>
        <Text className="mt-1 text-sm text-himba-mist">
          Titre, cover, genre et prix — l’audio ne se remplace pas ici.
        </Text>
      </View>

      {!loading && tracks.length === 0 ? (
        <Text className="text-sm text-himba-mist">Aucun titre publié.</Text>
      ) : null}

      {tracks.map((track) => (
        <View
          key={track.id}
          className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3"
        >
          <View
            className="h-14 w-14 overflow-hidden rounded-xl"
            style={{ backgroundColor: himbaColors.canopy }}
          >
            {track.coverUrl ? (
              <Image
                source={{ uri: track.coverUrl }}
                style={{ width: 56, height: 56 }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-himba-ink" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-sm text-himba-mist" numberOfLines={1}>
              {track.genre ?? 'Titre'} · {formatTrackPrice(track.price)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${track.title}`}
            disabled={busy}
            onPress={() => router.push(`/(app)/(tabs)/edit-track/${track.id}`)}
            className="min-h-11 justify-center px-2"
          >
            <Text className="text-sm font-semibold text-himba-ember">
              Modifier
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Supprimer ${track.title}`}
            disabled={busy}
            onPress={() => confirmDeleteTrack(track)}
            className="min-h-11 justify-center px-2"
          >
            <Text className="text-sm font-semibold text-himba-alert">
              Suppr.
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
