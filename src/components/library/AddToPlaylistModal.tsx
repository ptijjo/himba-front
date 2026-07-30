import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  createPlaylistSchema,
  type CreatePlaylistValues,
} from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import {
  useAddPlaylistTrackMutation,
  useCreatePlaylistMutation,
  useGetPlaylistsQuery,
  useLazyGetPlaylistQuery,
} from '@/store/api/libraryApi';

type AddToPlaylistModalProps = {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
  /** Callback après ajout réussi (nom de la playlist cible). */
  onAdded?: (playlistName: string) => void;
};

/**
 * Fenêtre « Ajouter à une playlist » — liste des playlists + création.
 * 1. Charger le détail de chaque playlist pour savoir si le titre y est déjà
 * 2. Afficher ✓ (désactivé) si présent, ＋ sinon → POST /playlists/:id/tracks
 * 3. Ou créer une nouvelle → POST /playlists puis ajout du titre
 */
export function AddToPlaylistModal({
  track,
  visible,
  onClose,
  onAdded,
}: AddToPlaylistModalProps) {
  const { data: playlistsData, isLoading: loadingList } =
    useGetPlaylistsQuery();
  const [fetchPlaylist] = useLazyGetPlaylistQuery();
  const [createPlaylist, { isLoading: creating }] = useCreatePlaylistMutation();
  const [addPlaylistTrack, { isLoading: adding }] =
    useAddPlaylistTrackMutation();

  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  /** Playlists qui contiennent déjà le titre courant. */
  const [containingIds, setContainingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [checkingMembership, setCheckingMembership] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlaylistValues>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: { name: '' },
  });

  const playlists = useMemo(
    () => playlistsData?.items ?? [],
    [playlistsData?.items],
  );
  const playlistIdsKey = playlists.map((p) => p.id).join(',');

  useEffect(() => {
    if (!visible) {
      setError(null);
      setShowCreate(false);
      setContainingIds(new Set());
      setCheckingMembership(false);
      reset({ name: '' });
    }
  }, [visible, reset]);

  // 1. Pour chaque playlist, GET détail → savoir si le titre est déjà dedans
  useEffect(() => {
    const trackId = track?.id;
    if (!visible || !trackId || playlists.length === 0) {
      return;
    }

    let cancelled = false;
    const playlistsSnapshot = playlists;

    async function loadMembership() {
      setCheckingMembership(true);
      const next = new Set<string>();
      await Promise.all(
        playlistsSnapshot.map(async (playlist) => {
          try {
            const detail = await fetchPlaylist(playlist.id).unwrap();
            const hasTrack = detail.tracks.some(
              (row) => row.trackId === trackId,
            );
            if (hasTrack) {
              next.add(playlist.id);
            }
          } catch {
            // Détail indispo : on laisse le ＋ (l’API renverra 409 si besoin)
          }
        }),
      );
      if (!cancelled) {
        setContainingIds(next);
        setCheckingMembership(false);
      }
    }

    void loadMembership();
    return () => {
      cancelled = true;
    };
  }, [visible, track?.id, playlistIdsKey, playlists, fetchPlaylist]);

  const busy = creating || adding;
  const listBusy = loadingList || checkingMembership;

  const addToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!track || containingIds.has(playlistId)) {
      return;
    }
    setError(null);
    try {
      await addPlaylistTrack({
        playlistId,
        trackId: track.id,
      }).unwrap();
      setContainingIds((prev) => new Set(prev).add(playlistId));
      onAdded?.(playlistName);
      onClose();
    } catch (e) {
      const message = getErrorMessage(e, 'Ajout impossible');
      // 409 : synchroniser l’UI (coche) au lieu d’afficher seulement l’erreur
      if (message.toLowerCase().includes('déjà')) {
        setContainingIds((prev) => new Set(prev).add(playlistId));
        setError(null);
        return;
      }
      setError(message);
    }
  };

  const onCreateAndAdd = handleSubmit(async (values) => {
    if (!track) {
      return;
    }
    setError(null);
    try {
      // 1. Créer la playlist  2. Y coller le titre immédiatement
      const playlist = await createPlaylist(values).unwrap();
      await addPlaylistTrack({
        playlistId: playlist.id,
        trackId: track.id,
      }).unwrap();
      onAdded?.(playlist.name);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'Création impossible'));
    }
  });

  return (
    <Modal
      visible={visible && track != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/60"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[80%] rounded-t-3xl bg-himba-night px-5 pb-10 pt-4"
          accessibilityViewIsModal
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-himba-mist/40" />
          </View>

          <Text className="text-lg font-bold text-himba-ink">
            Ajouter à une playlist
          </Text>
          {track ? (
            <Text className="mt-1 text-sm text-himba-mist" numberOfLines={1}>
              « {track.title} »
            </Text>
          ) : null}

          <ScrollView
            className="mt-4"
            contentContainerClassName="gap-2 pb-4"
            keyboardShouldPersistTaps="handled"
          >
            {listBusy ? (
              <ActivityIndicator color={himbaColors.ember} />
            ) : null}

            {!listBusy && playlists.length === 0 && !showCreate ? (
              <Text className="text-sm text-himba-mist">
                Aucune playlist pour l’instant — crée-en une ci-dessous.
              </Text>
            ) : null}

            {!listBusy
              ? playlists.map((playlist) => {
                  const alreadyIn = containingIds.has(playlist.id);
                  return (
                    <Pressable
                      key={playlist.id}
                      disabled={busy || alreadyIn}
                      onPress={() => {
                        void addToPlaylist(playlist.id, playlist.name);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: alreadyIn }}
                      accessibilityLabel={
                        alreadyIn
                          ? `Déjà dans ${playlist.name}`
                          : `Ajouter à ${playlist.name}`
                      }
                      className={`min-h-14 flex-row items-center justify-between rounded-2xl px-4 py-3 ${
                        alreadyIn
                          ? 'bg-himba-earth/60 opacity-80'
                          : 'bg-himba-earth'
                      }`}
                    >
                      <View className="flex-1 gap-0.5 pr-3">
                        <Text className="font-semibold text-himba-ink">
                          {playlist.name}
                        </Text>
                        {alreadyIn ? (
                          <Text className="text-xs text-himba-mist">
                            Déjà ajouté
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        className={
                          alreadyIn
                            ? 'text-lg font-bold text-himba-pulse'
                            : 'text-himba-ember'
                        }
                      >
                        {alreadyIn ? '✓' : '＋'}
                      </Text>
                    </Pressable>
                  );
                })
              : null}

            {!showCreate ? (
              <Pressable
                disabled={busy}
                onPress={() => setShowCreate(true)}
                accessibilityRole="button"
                accessibilityLabel="Créer une nouvelle playlist"
                className="min-h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-himba-ember px-4 py-3"
              >
                <Text className="font-semibold text-himba-ember">
                  + Nouvelle playlist
                </Text>
              </Pressable>
            ) : (
              <View className="gap-3 rounded-2xl bg-himba-earth p-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Nom de la playlist"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.name?.message}
                      placeholder="Soirée afro"
                      autoFocus
                    />
                  )}
                />
                <Button
                  label="Créer et y ajouter"
                  loading={busy}
                  disabled={busy}
                  onPress={onCreateAndAdd}
                />
                <Pressable
                  onPress={() => {
                    setShowCreate(false);
                    reset({ name: '' });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler la création"
                >
                  <Text className="text-center font-semibold text-himba-mist">
                    Annuler
                  </Text>
                </Pressable>
              </View>
            )}

            {error ? (
              <Text className="text-sm text-himba-alert">{error}</Text>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="mt-2 min-h-11 items-center justify-center"
          >
            <Text className="font-semibold text-himba-mist">Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
