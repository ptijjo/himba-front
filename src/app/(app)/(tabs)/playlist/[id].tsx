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

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
import { ReportModal } from '@/components/reports/ReportModal';
import { TrackActionsSheet } from '@/components/tracks/TrackActionsSheet';
import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import type { Track } from '@/schemas/tracks';
import {
  useAddPlaylistTrackMutation,
  useGetPlaylistQuery,
  useRemovePlaylistTrackMutation,
} from '@/store/api/libraryApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';

/**
 * Détail playlist — clic titre → lecteur + file ; menu ⋮ → retirer / autre playlist.
 */
export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = typeof id === 'string' ? id : '';
  const { playTrack } = usePlayTrack();

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetPlaylistQuery(playlistId, { skip: !playlistId });

  const tracks = useMemo((): Track[] => {
    if (!detail?.tracks) {
      return [];
    }
    return detail.tracks
      .map((item) => item.track)
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
  }, [detail]);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);
  const [reportTrack, setReportTrack] = useState<Track | null>(null);

  const { data: catalogPage, isLoading: loadingCatalog } = useGetTracksQuery({
    limit: 50,
  });
  const catalog = catalogPage?.items ?? [];
  const [addPlaylistTrack, { isLoading: adding }] =
    useAddPlaylistTrackMutation();
  const [removePlaylistTrack] = useRemovePlaylistTrackMutation();

  const alreadyIn = useMemo(() => {
    const ids = new Set<string>();
    for (const item of detail?.tracks ?? []) {
      ids.add(item.trackId);
    }
    return ids;
  }, [detail]);

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

  const onConfirmAdd = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    setFormError(null);
    try {
      for (const trackId of selectedIds) {
        await addPlaylistTrack({ playlistId, trackId }).unwrap();
      }
      setSelectedIds([]);
      setShowAdd(false);
    } catch (e) {
      setFormError(getErrorMessage(e, 'Ajout impossible'));
    }
  };

  if (!playlistId || isError) {
    return (
      <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
        <Pressable onPress={() => router.back()} className="p-4">
          <Text className="text-himba-ember">← Retour</Text>
        </Pressable>
        <Text className="px-4 text-himba-alert">Playlist introuvable</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !detail) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-himba-night">
        <ActivityIndicator color={himbaColors.ember} size="large" />
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

        <View className="gap-1">
          <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
            PLAYLIST
          </Text>
          <Text className="text-3xl font-bold text-himba-ink">{detail.name}</Text>
          <Text className="text-himba-mist">
            {tracks.length} titre{tracks.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Tout lire"
              disabled={tracks.length === 0}
              onPress={onPlayAll}
            />
          </View>
          <View className="flex-1">
            <Button
              label={showAdd ? 'Fermer' : '+ Sons'}
              variant="secondary"
              onPress={() => {
                setShowAdd((v) => !v);
                setSelectedIds([]);
                setFormError(null);
              }}
            />
          </View>
        </View>

        {showAdd ? (
          <View className="gap-3 rounded-2xl bg-himba-earth/90 p-4">
            <Text className="font-semibold text-himba-ink">Ajouter des titres</Text>
            {loadingCatalog ? (
              <Text className="text-himba-mist">Chargement…</Text>
            ) : (
              catalog
                .filter((t) => !alreadyIn.has(t.id))
                .map((track) => {
                  const selected = selectedIds.includes(track.id);
                  return (
                    <Pressable
                      key={track.id}
                      onPress={() =>
                        setSelectedIds((prev) =>
                          selected
                            ? prev.filter((x) => x !== track.id)
                            : [...prev, track.id],
                        )
                      }
                      className="flex-row items-center gap-3 rounded-xl bg-himba-night/50 p-2"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View className="h-12 w-12 overflow-hidden rounded-lg bg-himba-canopy">
                        {track.coverUrl ? (
                          <Image
                            source={{ uri: track.coverUrl }}
                            style={{ width: 48, height: 48 }}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                      <Text
                        className="flex-1 font-medium text-himba-ink"
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text className="text-himba-ember">
                        {selected ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })
            )}
            {formError ? (
              <Text className="text-sm text-himba-alert">{formError}</Text>
            ) : null}
            <Button
              label={
                selectedIds.length > 0
                  ? `Ajouter ${selectedIds.length}`
                  : 'Sélectionne des titres'
              }
              loading={adding}
              disabled={adding || selectedIds.length === 0}
              onPress={() => {
                void onConfirmAdd();
              }}
            />
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-lg font-bold text-himba-ink">Titres</Text>
          {tracks.length === 0 ? (
            <Text className="text-himba-mist">
              Aucun titre — ajoute des sons avec « + Sons ».
            </Text>
          ) : (
            tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onPress={onPlayOne}
                onMenuPress={setMenuTrack}
              />
            ))
          )}
        </View>
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
                  key: 'add-other',
                  label: 'Ajouter à une autre playlist',
                  onPress: () => setPlaylistTrack(menuTrack),
                },
                {
                  key: 'report',
                  label: 'Signaler',
                  onPress: () => setReportTrack(menuTrack),
                },
                {
                  key: 'remove',
                  label: 'Supprimer de la playlist',
                  destructive: true,
                  onPress: () => {
                    void removePlaylistTrack({
                      playlistId,
                      trackId: menuTrack.id,
                    });
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
