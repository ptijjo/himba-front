import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  createPlaylistSchema,
  type CreatePlaylistValues,
} from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import {
  useAddPlaylistTrackMutation,
  useCreatePlaylistMutation,
  useGetFavoritesQuery,
  useGetFollowsQuery,
  useGetPlaylistQuery,
  useGetPlaylistsQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';

/**
 * Sections bibliothèque — playlists (création + ajout de titres), favoris, suivis.
 */
export function LibrarySections() {
  const { playTrack } = usePlayTrack();
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
  const [removeFavorite] = useRemoveFavoriteMutation();

  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  /** Titres cochés pour la création (ou pour l’ajout sur une playlist existante). */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /** Playlist ouverte pour y ajouter des sons après coup. */
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(
    null,
  );

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

  /**
   * 1. POST /playlists { name }
   * 2. Pour chaque titre sélectionné : POST /playlists/:id/tracks { trackId }
   */
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
    } catch (error) {
      setFormError(getErrorMessage(error, 'Création impossible'));
    }
  });

  const onAddToExisting = async () => {
    if (!addingToPlaylistId || selectedIds.length === 0) {
      return;
    }
    setFormError(null);
    try {
      for (const trackId of selectedIds) {
        await addPlaylistTrack({
          playlistId: addingToPlaylistId,
          trackId,
        }).unwrap();
      }
      setSelectedIds([]);
      setAddingToPlaylistId(null);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Ajout impossible'));
    }
  };

  const busy = creating || adding;

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
              setAddingToPlaylistId(null);
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

        {(playlistsData?.items ?? []).map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlistId={playlist.id}
            name={playlist.name}
            isAdding={addingToPlaylistId === playlist.id}
            catalog={catalog}
            loadingCatalog={loadingCatalog}
            selectedIds={selectedIds}
            busy={busy}
            formError={
              addingToPlaylistId === playlist.id ? formError : null
            }
            onToggleAdd={() => {
              if (addingToPlaylistId === playlist.id) {
                setAddingToPlaylistId(null);
                setSelectedIds([]);
                setFormError(null);
                return;
              }
              setShowForm(false);
              setSelectedIds([]);
              setFormError(null);
              setAddingToPlaylistId(playlist.id);
            }}
            onToggleTrack={toggleTrack}
            onConfirmAdd={() => {
              void onAddToExisting();
            }}
            onPlayTrack={(t) => {
              void playTrack(t);
            }}
          />
        ))}

        {loadingPlaylists ? (
          <Text className="text-himba-mist">Chargement…</Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-lg font-bold text-himba-ink">Favoris</Text>
        {favorites.map((fav) => {
          if (!fav.track) {
            return null;
          }
          const track: Track = {
            id: fav.track.id,
            title: fav.track.title,
            genre: fav.track.genre ?? null,
            price: fav.track.price ?? null,
            coverUrl: fav.track.coverUrl ?? null,
            artistId: fav.track.artistId ?? '',
            durationMs: fav.track.durationMs,
          };
          return (
            <View key={fav.id} className="gap-1">
              <TrackRow
                track={track}
                onPress={(t) => {
                  void playTrack(t);
                }}
              />
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
            </View>
          );
        })}
        {loadingFav ? (
          <Text className="text-himba-mist">Chargement…</Text>
        ) : null}
        {!loadingFav && favorites.length === 0 ? (
          <Text className="text-himba-mist">Aucun favori pour l’instant.</Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-lg font-bold text-himba-ink">Artistes suivis</Text>
        {follows.map((f) => (
          <View
            key={f.id}
            className="rounded-2xl bg-himba-earth/90 px-4 py-3"
          >
            <Text className="font-semibold text-himba-ink">
              {f.artist?.displayName ?? f.artistId}
            </Text>
          </View>
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
  excludeIds,
}: {
  catalog: Track[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (trackId: string) => void;
  title: string;
  hint?: string;
  excludeIds?: Set<string>;
}) {
  const visible = useMemo(() => {
    if (!excludeIds || excludeIds.size === 0) {
      return catalog;
    }
    return catalog.filter((t) => !excludeIds.has(t.id));
  }, [catalog, excludeIds]);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-himba-mist">{title}</Text>
      {hint ? <Text className="text-xs text-himba-mist">{hint}</Text> : null}
      {loading ? (
        <Text className="text-sm text-himba-mist">Catalogue…</Text>
      ) : null}
      {!loading && visible.length === 0 ? (
        <Text className="text-sm text-himba-mist">Aucun titre disponible.</Text>
      ) : null}
      {visible.map((track) => {
        const selected = selectedIds.includes(track.id);
        return (
          <Pressable
            key={track.id}
            onPress={() => onToggle(track.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${selected ? 'Retirer' : 'Ajouter'} ${track.title}`}
            className={`min-h-14 flex-row items-center gap-3 rounded-2xl px-3 py-2 ${
              selected ? 'bg-himba-ember/25' : 'bg-himba-night'
            }`}
          >
            <View
              className="h-11 w-11 overflow-hidden rounded-xl"
              style={{ backgroundColor: himbaColors.canopy }}
            >
              {track.coverUrl ? (
                <Image
                  source={{ uri: track.coverUrl }}
                  style={{ width: 44, height: 44 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-himba-ink" numberOfLines={1}>
                {track.title}
              </Text>
              <Text className="text-xs text-himba-mist" numberOfLines={1}>
                {track.artist?.displayName ?? track.genre ?? 'Titre'}
              </Text>
            </View>
            <Text
              className={`text-base font-bold ${
                selected ? 'text-himba-ember' : 'text-himba-mist'
              }`}
            >
              {selected ? '✓' : '+'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlaylistCard({
  playlistId,
  name,
  isAdding,
  catalog,
  loadingCatalog,
  selectedIds,
  busy,
  formError,
  onToggleAdd,
  onToggleTrack,
  onConfirmAdd,
  onPlayTrack,
}: {
  playlistId: string;
  name: string;
  isAdding: boolean;
  catalog: Track[];
  loadingCatalog: boolean;
  selectedIds: string[];
  busy: boolean;
  formError: string | null;
  onToggleAdd: () => void;
  onToggleTrack: (trackId: string) => void;
  onConfirmAdd: () => void;
  onPlayTrack: (track: Track) => void;
}) {
  const { data: detail } = useGetPlaylistQuery(playlistId);
  const alreadyIn = useMemo(() => {
    const ids = new Set<string>();
    for (const item of detail?.tracks ?? []) {
      ids.add(item.trackId);
    }
    return ids;
  }, [detail]);

  const trackCount = detail?.tracks?.length ?? 0;

  return (
    <View className="gap-2 rounded-2xl bg-himba-earth/90 px-4 py-3">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text className="font-semibold text-himba-ink">{name}</Text>
          <Text className="text-xs text-himba-mist">
            {trackCount} titre{trackCount > 1 ? 's' : ''}
          </Text>
        </View>
        <Pressable
          onPress={onToggleAdd}
          accessibilityRole="button"
          accessibilityLabel={
            isAdding ? 'Fermer l’ajout' : `Ajouter des sons à ${name}`
          }
          className="min-h-11 justify-center px-2"
        >
          <Text className="font-semibold text-himba-ember">
            {isAdding ? 'Fermer' : '+ Sons'}
          </Text>
        </Pressable>
      </View>

      {(detail?.tracks ?? []).slice(0, 5).map((item) => {
        if (!item.track) {
          return null;
        }
        const track: Track = {
          id: item.track.id,
          title: item.track.title,
          genre: item.track.genre ?? null,
          price: item.track.price ?? null,
          coverUrl: item.track.coverUrl ?? null,
          artistId: item.track.artistId ?? '',
          durationMs: item.track.durationMs,
        };
        return (
          <TrackRow
            key={item.id}
            track={track}
            onPress={onPlayTrack}
          />
        );
      })}

      {isAdding ? (
        <View className="gap-3 border-t border-himba-ochre/40 pt-3">
          <TrackPicker
            catalog={catalog}
            loading={loadingCatalog}
            selectedIds={selectedIds}
            onToggle={onToggleTrack}
            excludeIds={alreadyIn}
            title="Choisir des titres"
          />
          {formError ? (
            <Text className="text-sm text-himba-alert">{formError}</Text>
          ) : null}
          <Button
            label={
              selectedIds.length > 0
                ? `Ajouter ${selectedIds.length} titre${selectedIds.length > 1 ? 's' : ''}`
                : 'Sélectionne des titres'
            }
            loading={busy}
            disabled={busy || selectedIds.length === 0}
            onPress={onConfirmAdd}
          />
        </View>
      ) : null}
    </View>
  );
}
