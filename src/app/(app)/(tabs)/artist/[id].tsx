import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackRow } from '@/components/tracks/TrackRow';
import { Button } from '@/components/ui/Button';
import { himbaColors } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openLecturePlayer } from '@/lib/navigation/openLecturePlayer';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { useGetAlbumsQuery } from '@/store/api/albumsApi';
import { useGetArtistQuery } from '@/store/api/artistsApi';
import {
  useFollowArtistMutation,
  useGetFollowsQuery,
  useUnfollowArtistMutation,
} from '@/store/api/libraryApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';
import {
  useGetPublicProfileQuery,
  useGetUserFollowsQuery,
  useGetUserPlaylistsQuery,
} from '@/store/api/usersApi';

/**
 * Profil public artiste — nom, bio, albums, titres, playlists, artistes suivis.
 * Aucune info personnelle (email, etc.).
 */
export default function ArtistPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const artistId = typeof id === 'string' ? id : '';
  const { playTrack } = usePlayTrack();

  const {
    data: artist,
    isLoading: loadingArtist,
    isError: artistError,
  } = useGetArtistQuery(artistId, { skip: !artistId });

  const userId = artist?.userId;
  const { data: publicUser } = useGetPublicProfileQuery(userId ?? '', {
    skip: !userId,
  });
  const { data: albumsPage, isLoading: loadingAlbums } = useGetAlbumsQuery(
    { artistId, limit: 50 },
    { skip: !artistId },
  );
  const { data: tracksPage, isLoading: loadingTracks } = useGetTracksQuery(
    { artistId, limit: 50 },
    { skip: !artistId },
  );
  const { data: playlists = [], isLoading: loadingPlaylists } =
    useGetUserPlaylistsQuery(userId ?? '', { skip: !userId });
  const { data: followedArtists = [], isLoading: loadingFollows } =
    useGetUserFollowsQuery(userId ?? '', { skip: !userId });

  const { data: myFollows = [] } = useGetFollowsQuery();
  const [followArtist, { isLoading: following }] = useFollowArtistMutation();
  const [unfollowArtist, { isLoading: unfollowing }] =
    useUnfollowArtistMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  const isFollowing = useMemo(
    () => Boolean(artistId && myFollows.some((f) => f.artistId === artistId)),
    [artistId, myFollows],
  );

  const albums = albumsPage?.items ?? [];
  const tracks = tracksPage?.items ?? [];
  const displayName = artist?.displayName ?? 'Artiste';
  const avatar = artist?.avatarUrl ?? publicUser?.avatarUrl ?? null;
  const cover = artist?.coverUrl ?? null;
  const bio = artist?.bio?.trim() || publicUser?.bio?.trim() || null;

  const onToggleFollow = async () => {
    if (!artistId) {
      return;
    }
    setActionError(null);
    try {
      if (isFollowing) {
        await unfollowArtist(artistId).unwrap();
      } else {
        await followArtist(artistId).unwrap();
      }
    } catch (e) {
      setActionError(getErrorMessage(e, 'Action impossible'));
    }
  };

  if (!artistId) {
    return (
      <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
        <Text className="p-4 text-himba-alert">Artiste introuvable</Text>
      </SafeAreaView>
    );
  }

  if (loadingArtist) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-himba-night">
        <ActivityIndicator color={himbaColors.ember} size="large" />
      </SafeAreaView>
    );
  }

  if (artistError || !artist) {
    return (
      <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
        <Pressable onPress={() => router.back()} className="p-4">
          <Text className="text-himba-ember">← Retour</Text>
        </Pressable>
        <Text className="px-4 text-himba-alert">Artiste introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="mb-2 self-start"
        >
          <Text className="text-base font-semibold text-himba-ember">
            ← Retour
          </Text>
        </Pressable>

        <View style={styles.hero}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              accessibilityLabel={`Bannière de ${displayName}`}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: himbaColors.canopy },
              ]}
            />
          )}
          <View style={styles.heroScrim} />
          <View style={styles.heroBody}>
            <View style={styles.avatarRing}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{displayName}</Text>
            {bio ? (
              <Text style={styles.bio} numberOfLines={4}>
                {bio}
              </Text>
            ) : null}
            <View className="mt-3 w-full max-w-[220px]">
              <Button
                label={isFollowing ? 'Suivi' : 'Suivre'}
                variant={isFollowing ? 'secondary' : 'primary'}
                loading={following || unfollowing}
                onPress={() => {
                  void onToggleFollow();
                }}
              />
            </View>
            {actionError ? (
              <Text className="mt-2 text-sm text-himba-alert">{actionError}</Text>
            ) : null}
          </View>
        </View>

        <Section title="Albums" loading={loadingAlbums} empty={albums.length === 0}>
          {albums.map((album) => (
            <View key={album.id} style={styles.albumRow}>
              <View style={styles.albumCover}>
                {album.coverUrl ? (
                  <Image
                    source={{ uri: album.coverUrl }}
                    style={styles.albumImage}
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
            </View>
          ))}
        </Section>

        <Section
          title="Titres"
          loading={loadingTracks}
          empty={tracks.length === 0}
        >
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              onPress={(t) => {
                void playTrack(t, { queue: tracks }).then(() => {
                  openLecturePlayer();
                });
              }}
            />
          ))}
        </Section>

        <Section
          title="Playlists"
          loading={loadingPlaylists}
          empty={playlists.length === 0}
        >
          {playlists.map((pl) => (
            <View key={pl.id} style={styles.plainRow}>
              <Text className="font-semibold text-himba-ink">{pl.name}</Text>
              <Text className="text-sm text-himba-mist">
                {pl.trackCount} titre{pl.trackCount > 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </Section>

        <Section
          title="Artistes suivis"
          loading={loadingFollows}
          empty={followedArtists.length === 0}
        >
          {followedArtists.map((f) => {
            const name = f.artist?.displayName ?? 'Artiste';
            const photo = f.artist?.avatarUrl ?? null;
            return (
              <Pressable
                key={f.id}
                onPress={() => openArtistProfile(f.artistId)}
                accessibilityRole="button"
                accessibilityLabel={`Voir ${name}`}
                style={styles.followRow}
              >
                <View style={styles.followAvatar}>
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.followAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.followInitial}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text className="flex-1 font-semibold text-himba-ink">
                  {name}
                </Text>
                <Text className="text-himba-ember">→</Text>
              </Pressable>
            );
          })}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  loading,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-himba-ink">{title}</Text>
      {loading ? <Text className="text-himba-mist">Chargement…</Text> : null}
      {!loading && empty ? (
        <Text className="text-himba-mist">Rien à afficher pour l’instant.</Text>
      ) : null}
      {!loading ? <View className="gap-2">{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 28,
  },
  hero: {
    minHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: himbaColors.earth,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 6, 24, 0.55)',
  },
  heroBody: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: himbaColors.ember,
    borderRadius: 48,
    padding: 2,
    marginBottom: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: himbaColors.night,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: himbaColors.ink,
    textAlign: 'center',
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: himbaColors.mist,
    textAlign: 'center',
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: himbaColors.earth,
    padding: 12,
  },
  albumCover: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: himbaColors.canopy,
  },
  albumImage: {
    width: 56,
    height: 56,
  },
  plainRow: {
    borderRadius: 16,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  followAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: himbaColors.ochre,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: himbaColors.night,
  },
  followAvatarImage: {
    width: 40,
    height: 40,
  },
  followInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: himbaColors.ink,
  },
});
