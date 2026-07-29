import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  createPlaylistSchema,
  type CreatePlaylistValues,
} from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import {
  useCreatePlaylistMutation,
  useGetFavoritesQuery,
  useGetFollowsQuery,
  useGetPlaylistsQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';

/**
 * Sections bibliothèque — playlists, favoris, abonnements (fusionnées dans Lecture).
 */
export function LibrarySections() {
  const { playTrack } = usePlayTrack();
  const { data: favorites = [], isLoading: loadingFav } =
    useGetFavoritesQuery();
  const { data: follows = [] } = useGetFollowsQuery();
  const { data: playlistsData, isLoading: loadingPlaylists } =
    useGetPlaylistsQuery();
  const [createPlaylist, { isLoading: creating }] = useCreatePlaylistMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlaylistValues>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: { name: '' },
  });

  const onCreate = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createPlaylist(values).unwrap();
      reset();
      setShowForm(false);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Création impossible'));
    }
  });

  return (
    <View className="gap-5">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-himba-ink">Playlists</Text>
          <Pressable
            onPress={() => setShowForm((v) => !v)}
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
                />
              )}
            />
            {formError ? (
              <Text className="text-sm text-himba-alert">{formError}</Text>
            ) : null}
            <Button label="Créer" loading={creating} onPress={onCreate} />
          </View>
        ) : null}
        {(playlistsData?.items ?? []).map((playlist) => (
          <View
            key={playlist.id}
            className="rounded-2xl bg-himba-earth/90 px-4 py-3"
          >
            <Text className="font-semibold text-himba-ink">{playlist.name}</Text>
          </View>
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
