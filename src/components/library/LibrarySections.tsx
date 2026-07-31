import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlaylistCoverMosaic } from '@/components/library/PlaylistCoverMosaic';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import {
  isDiscoveryPlaylistName,
  openAlbum,
  openFavorites,
  openLibraryAlbums,
  openLibraryArtists,
  openPlaylist,
} from '@/lib/navigation/openProfile';
import {
  createPlaylistSchema,
  type CreatePlaylistValues,
} from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import { useAppSelector } from '@/store';
import {
  useAddPlaylistTrackMutation,
  useCreatePlaylistMutation,
  useDeletePlaylistMutation,
  useGetAlbumFavoritesQuery,
  useGetFavoritesQuery,
  useGetFollowsQuery,
  useGetPlaylistsQuery,
} from '@/store/api/libraryApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';

/**
 * Bibliothèque type Deezer — Coups de cœur, playlists horizontales, Albums / Artistes.
 */
export function LibrarySections() {
  const user = useAppSelector((s) => s.auth.user);
  const username = user?.username ?? 'toi';
  const { playTrack } = usePlayTrack();
  const { data: favorites = [], isLoading: loadingFav } =
    useGetFavoritesQuery();
  const { data: albumFavorites = [] } = useGetAlbumFavoritesQuery();
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

  const previewFavorites = useMemo(
    () => favorites.slice(0, 3).map((f) => f.track).filter(Boolean),
    [favorites],
  );

  const favoriteTracks = useMemo((): Track[] => {
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

  const onPlayAllFavorites = () => {
    const first = favoriteTracks[0];
    if (!first) {
      return;
    }
    void playTrack(first, { queue: favoriteTracks }).then(() => {
      openLecturePlayer();
    });
  };

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
  const albumCount = albumFavorites.length;
  const artistCount = follows.length;

  // Cover aléatoire parmi les albums aimés (stable tant que le set de covers ne change pas)
  const albumCoverUrls = useMemo(
    () =>
      albumFavorites
        .map((f) => f.album?.coverUrl)
        .filter((url): url is string => Boolean(url)),
    [albumFavorites],
  );
  const albumCoverKey = useMemo(
    () => [...albumCoverUrls].sort().join('\0'),
    [albumCoverUrls],
  );
  const randomAlbumCover = useMemo(() => {
    if (albumCoverUrls.length === 0) {
      return null;
    }
    return (
      albumCoverUrls[Math.floor(Math.random() * albumCoverUrls.length)] ?? null
    );
    // albumCoverKey = set de covers ; on re-tire seulement quand ce set change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volontaire
  }, [albumCoverKey]);

  const firstArtistAvatar =
    follows[0]?.artist?.avatarUrl ?? follows[0]?.artist?.coverUrl ?? null;

  return (
    <View className="gap-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
            onPress={() => router.push('/(app)/(tabs)/profile')}
            className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-himba-earth"
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 44, height: 44 }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-base font-bold text-himba-mist">
                {(user?.username?.[0] ?? '?').toUpperCase()}
              </Text>
            )}
          </Pressable>
          <Text
            className="shrink text-3xl text-himba-ink"
            style={{ fontFamily: 'Literata_700Bold' }}
          >
            Bibliothèque
          </Text>
        </View>
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
            showForm ? 'Annuler la création' : 'Créer une playlist'
          }
          hitSlop={8}
          style={styles.plusBtn}
        >
          <Text className="text-2xl font-light text-himba-ink">
            {showForm ? '×' : '+'}
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

      {/* Coups de cœur — carte entière cliquable */}
      <Pressable
        onPress={() => openFavorites()}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les coups de cœur"
        style={styles.coupsCard}
      >
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
          <View style={styles.heartBox}>
            <Text style={styles.heartIcon}>♥</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-himba-ink">
              Coups de cœur
            </Text>
            <Text className="text-sm text-himba-mist">
              {loadingFav
                ? 'Chargement…'
                : `${favCount} titre${favCount > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Pressable
            onPress={onPlayAllFavorites}
            disabled={favoriteTracks.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Lire tous les coups de cœur"
            hitSlop={8}
            style={[
              styles.playBtn,
              favoriteTracks.length === 0 ? styles.playBtnDisabled : null,
            ]}
          >
            <Text style={styles.playIcon}>▶</Text>
          </Pressable>
        </View>
        {previewFavorites.length > 0 ? (
          <View className="gap-2 border-t border-himba-ochre/30 px-4 pb-4 pt-3">
            {previewFavorites.map((track) => {
              if (!track) {
                return null;
              }
              return (
                <View key={track.id} className="flex-row items-center gap-3">
                  <View style={styles.previewCover}>
                    {track.coverUrl ? (
                      <Image
                        source={{ uri: track.coverUrl }}
                        style={styles.previewImage}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-medium text-himba-ink"
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text className="text-xs text-himba-mist" numberOfLines={1}>
                      Favori
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </Pressable>

      {/* Playlists — carrousel horizontal */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text style={styles.sectionHeart}>♥</Text>
            <Text className="text-lg font-bold text-himba-ink">Playlists</Text>
          </View>
          <Text className="text-sm text-himba-mist">{playlists.length}</Text>
        </View>

        {loadingPlaylists ? (
          <Text className="text-himba-mist">Chargement…</Text>
        ) : null}
        {!loadingPlaylists && playlists.length === 0 ? (
          <Text className="text-himba-mist">Aucune playlist pour l’instant.</Text>
        ) : null}

        {playlists.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playlistRow}
          >
            {playlists.map((playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => openPlaylist(playlist.id)}
                accessibilityRole="button"
                accessibilityLabel={`Playlist ${playlist.name}`}
                style={styles.playlistCard}
              >
                <PlaylistCoverMosaic
                  coverUrls={playlist.coverUrls ?? []}
                  fallbackLetter={playlist.name}
                  size={128}
                />
                <Text
                  className="mt-2 font-semibold text-himba-ink"
                  numberOfLines={1}
                >
                  {playlist.name}
                </Text>
                <Text className="text-xs text-himba-mist" numberOfLines={1}>
                  Par {username}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Lignes Albums / Artistes */}
      <View>
        <CategoryRow
          label="Albums"
          count={albumCount}
          coverUrl={randomAlbumCover}
          fallback="♪"
          onPress={() => openLibraryAlbums()}
        />
        <View style={styles.divider} />
        <CategoryRow
          label="Artistes"
          count={artistCount}
          coverUrl={firstArtistAvatar}
          fallback="♪"
          onPress={() => openLibraryArtists()}
        />
      </View>
    </View>
  );
}

function CategoryRow({
  label,
  count,
  coverUrl,
  fallback,
  onPress,
}: {
  label: string;
  count: number;
  coverUrl: string | null;
  fallback: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      className="flex-row items-center gap-3 py-3"
    >
      <View style={styles.categoryThumb}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.categoryImage}
            contentFit="cover"
          />
        ) : (
          <Text className="text-lg text-himba-mist">{fallback}</Text>
        )}
      </View>
      <Text className="flex-1 text-base font-semibold text-himba-ink">
        {label}
      </Text>
      <Text className="text-sm text-himba-mist">{count}</Text>
      <Text className="text-himba-mist">›</Text>
    </Pressable>
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

const styles = StyleSheet.create({
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: himbaColors.earth,
  },
  coupsCard: {
    borderRadius: 16,
    backgroundColor: himbaColors.earth,
    overflow: 'hidden',
  },
  heartBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: himbaColors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 24,
    color: himbaColors.white,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: himbaColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDisabled: {
    opacity: 0.35,
  },
  playIcon: {
    fontSize: 16,
    color: himbaColors.night,
    marginLeft: 2,
  },
  previewCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: himbaColors.canopy,
  },
  previewImage: {
    width: 40,
    height: 40,
  },
  sectionHeart: {
    color: himbaColors.ember,
    fontSize: 16,
  },
  playlistRow: {
    gap: 14,
    paddingRight: 8,
  },
  playlistCard: {
    width: 128,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: himbaColors.ochre,
    opacity: 0.35,
  },
  categoryThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 48,
    height: 48,
  },
});
