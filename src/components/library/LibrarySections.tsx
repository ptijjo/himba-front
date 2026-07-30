import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  isDiscoveryPlaylistName,
  openArtistProfile,
  openFavorites,
  openPlaylist,
} from '@/lib/navigation/openProfile';
import {
  createPlaylistSchema,
  type CreatePlaylistValues,
} from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import {
  useAddPlaylistTrackMutation,
  useCreatePlaylistMutation,
  useDeletePlaylistMutation,
  useGetFavoritesQuery,
  useGetFollowsQuery,
  useGetPlaylistsQuery,
} from '@/store/api/libraryApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';

/**
 * Sections bibliothèque — playlists / favoris (compacts) / suivis.
 */
export function LibrarySections() {
  const { data: favorites = [], isLoading: loadingFav } =
    useGetFavoritesQuery();
  const { data: follows = [] } = useGetFollowsQuery();
  const { data: playlistsData, isLoading: loadingPlaylists } =
    useGetPlaylistsQuery();
  const { data: tracksPage, isLoading: loadingCatalog } = useGetTracksQuery({
    limit: 50,
  });
  const catalog = tracksPage?.items ?? [];

  const [createPlaylist, { isLoading: creating }] = useCreatePlaylistMutation();
  const [addPlaylistTrack, { isLoading: adding }] =
    useAddPlaylistTrackMutation();
  const [deletePlaylist] = useDeletePlaylistMutation();

  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const cleanedDiscoveries = useRef(false);

  const playlists = useMemo(
    () =>
      (playlistsData?.items ?? []).filter(
        (p) => !isDiscoveryPlaylistName(p.name),
      ),
    [playlistsData?.items],
  );

  // Supprime les anciennes playlists « Découverte … » (plus utilisées)
  useEffect(() => {
    if (cleanedDiscoveries.current || !playlistsData?.items) {
      return;
    }
    const discoveries = playlistsData.items.filter((p) =>
      isDiscoveryPlaylistName(p.name),
    );
    if (discoveries.length === 0) {
      cleanedDiscoveries.current = true;
      return;
    }
    cleanedDiscoveries.current = true;
    for (const pl of discoveries) {
      void deletePlaylist(pl.id);
    }
  }, [playlistsData?.items, deletePlaylist]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlaylistValues>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: { name: '' },
  });

  const toggleTrack = (trackId: string) => {
    setSelectedIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId],
    );
  };

  const resetCreateUi = () => {
    reset();
    setSelectedIds([]);
    setShowForm(false);
    setFormError(null);
  };

  const onCreate = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const playlist = await createPlaylist(values).unwrap();
      for (const trackId of selectedIds) {
        await addPlaylistTrack({
          playlistId: playlist.id,
          trackId,
        }).unwrap();
      }
      resetCreateUi();
      openPlaylist(playlist.id);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Création impossible'));
    }
  });

  const busy = creating || adding;
  const favCount = favorites.length;

  return (
    <View className="gap-5">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-himba-ink">Playlists</Text>
          <Pressable
            onPress={() => {
              if (showForm) {
                resetCreateUi();
                return;
              }
              setSelectedIds([]);
              setShowForm(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              showForm ? 'Annuler' : 'Créer une nouvelle playlist'
            }
          >
            <Text className="font-semibold text-himba-ember">
              {showForm ? 'Annuler' : '+ Nouvelle'}
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <View className="gap-3 rounded-2xl bg-himba-earth/90 p-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nom"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
                  placeholder="Soirée afro"
                />
              )}
            />

            <TrackPicker
              catalog={catalog}
              loading={loadingCatalog}
              selectedIds={selectedIds}
              onToggle={toggleTrack}
              title="Ajouter des sons"
              hint="Optionnel — tu pourras en ajouter plus tard."
            />

            {formError ? (
              <Text className="text-sm text-himba-alert">{formError}</Text>
            ) : null}

            <Button
              label={
                selectedIds.length > 0
                  ? `Créer · ${selectedIds.length} titre${selectedIds.length > 1 ? 's' : ''}`
                  : 'Créer'
              }
              loading={busy}
              disabled={busy}
              onPress={onCreate}
            />
          </View>
        ) : null}

        {playlists.map((playlist) => {
          const count = playlist.trackCount ?? 0;
          return (
            <Pressable
              key={playlist.id}
              onPress={() => openPlaylist(playlist.id)}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir la playlist ${playlist.name}`}
              className="rounded-2xl bg-himba-earth/90 px-4 py-3"
            >
              <Text className="font-semibold text-himba-ink">
                {playlist.name}
              </Text>
              <Text className="mt-1 text-xs text-himba-mist">
                {count} titre{count > 1 ? 's' : ''}
              </Text>
            </Pressable>
          );
        })}

        {loadingPlaylists ? (
          <Text className="text-himba-mist">Chargement…</Text>
        ) : null}
        {!loadingPlaylists && playlists.length === 0 ? (
          <Text className="text-himba-mist">Aucune playlist pour l’instant.</Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-lg font-bold text-himba-ink">Favoris</Text>
        <Pressable
          onPress={() => openFavorites()}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les favoris"
          className="rounded-2xl bg-himba-earth/90 px-4 py-3"
        >
          <Text className="font-semibold text-himba-ink">Mes favoris</Text>
          <Text className="mt-1 text-xs text-himba-mist">
            {loadingFav
              ? 'Chargement…'
              : `${favCount} titre${favCount > 1 ? 's' : ''}`}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-lg font-bold text-himba-ink">Artistes suivis</Text>
        {follows.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => openArtistProfile(f.artistId)}
            accessibilityRole="button"
            accessibilityLabel={`Voir ${f.artist?.displayName ?? 'artiste'}`}
            className="rounded-2xl bg-himba-earth/90 px-4 py-3"
          >
            <Text className="font-semibold text-himba-ink">
              {f.artist?.displayName ?? f.artistId}
            </Text>
          </Pressable>
        ))}
        {follows.length === 0 ? (
          <Text className="text-himba-mist">Aucun abonnement.</Text>
        ) : null}
      </View>
    </View>
  );
}

function TrackPicker({
  catalog,
  loading,
  selectedIds,
  onToggle,
  title,
  hint,
}: {
  catalog: Track[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (trackId: string) => void;
  title: string;
  hint?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="font-semibold text-himba-ink">{title}</Text>
      {hint ? <Text className="text-xs text-himba-mist">{hint}</Text> : null}
      {loading ? <Text className="text-himba-mist">Chargement…</Text> : null}
      {catalog.map((track) => {
        const selected = selectedIds.includes(track.id);
        return (
          <Pressable
            key={track.id}
            onPress={() => onToggle(track.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            className="flex-row items-center gap-3 rounded-xl p-2"
            style={{
              backgroundColor: selected
                ? `${himbaColors.ember}22`
                : 'transparent',
            }}
          >
            <View
              className="h-12 w-12 overflow-hidden rounded-lg"
              style={{ backgroundColor: himbaColors.canopy }}
            >
              {track.coverUrl ? (
                <Image
                  source={{ uri: track.coverUrl }}
                  style={{ width: 48, height: 48 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <Text className="flex-1 font-medium text-himba-ink" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-himba-ember">{selected ? '✓' : '+'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
