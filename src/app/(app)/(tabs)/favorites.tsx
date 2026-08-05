import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
import { ReportModal } from '@/components/reports/ReportModal';
import { TrackActionsSheet } from '@/components/tracks/TrackActionsSheet';
import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import type { Track } from '@/schemas/tracks';
import {
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';

/**
 * Favoris — détail : titres + file de lecture (comme une playlist).
 * Clic titre → lecteur + file ; menu ⋮ → retirer / ajouter à une playlist.
 */
export default function FavoritesScreen() {
  const { playTrack } = usePlayTrack();
  const { data: favorites = [], isLoading } = useGetFavoritesQuery();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);
  const [reportTrack, setReportTrack] = useState<Track | null>(null);

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
          artist: t.artist
            ? { id: t.artist.id, displayName: t.artist.displayName }
            : undefined,
        }),
      );
  }, [favorites]);

  const onPlayAll = () => {
    const first = tracks[0];
    if (first) {
      void playTrack(first, { queue: tracks }).then(() => {
        openLecturePlayer();
      });
    }
  };

  const onPlayOne = (track: Track) => {
    void playTrack(track, { queue: tracks }).then(() => {
      openLecturePlayer();
    });
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
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onPress={onPlayOne}
                onMenuPress={setMenuTrack}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TrackActionsSheet
        visible={menuTrack !== null}
        title={menuTrack?.title}
        subtitle={menuTrack?.artist?.displayName ?? menuTrack?.genre ?? undefined}
        onClose={() => setMenuTrack(null)}
        actions={
          menuTrack
            ? [
                {
                  key: 'add-playlist',
                  label: 'Ajouter à une playlist',
                  onPress: () => setPlaylistTrack(menuTrack),
                },
                {
                  key: 'report',
                  label: 'Signaler',
                  onPress: () => setReportTrack(menuTrack),
                },
                {
                  key: 'remove-fav',
                  label: 'Retirer des favoris',
                  destructive: true,
                  onPress: () => {
                    void removeFavorite(menuTrack.id);
                  },
                },
              ]
            : []
        }
      />

      <AddToPlaylistModal
        track={playlistTrack}
        visible={playlistTrack !== null}
        onClose={() => setPlaylistTrack(null)}
      />

      <ReportModal
        visible={reportTrack !== null}
        targetType="TRACK"
        targetId={reportTrack?.id ?? ''}
        targetLabel={reportTrack?.title}
        onClose={() => setReportTrack(null)}
      />
    </SafeAreaView>
  );
}
