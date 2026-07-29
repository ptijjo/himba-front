import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
import { himbaColors, homeMedia } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import type { Follow } from '@/schemas/library';
import type { Track } from '@/schemas/tracks';
import {
  useAddFavoriteMutation,
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';

type FollowingTabProps = {
  follows: Follow[];
  tracks: Track[];
  loading?: boolean;
  onPlayTrack?: (track: Track) => void;
};

type ArtistRelease = {
  follow: Follow;
  track: Track | null;
};

/**
 * Onglet Suivis — avatars défilables (thème maquette) + sorties.
 */
export function FollowingTab({
  follows,
  tracks,
  loading,
  onPlayTrack,
}: FollowingTabProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.min(windowWidth - 56, 340);
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const { data: favorites = [] } = useGetFavoritesQuery();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const artistReleases = useMemo<ArtistRelease[]>(() => {
    return follows.map((follow) => {
      const artistTracks = tracks
        .filter((t) => t.artistId === follow.artistId)
        .slice()
        .sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
      return { follow, track: artistTracks[0] ?? null };
    });
  }, [follows, tracks]);

  const releasesWithTrack = useMemo(
    () => artistReleases.filter((item) => item.track != null),
    [artistReleases],
  );

  const visibleReleases = useMemo(() => {
    if (!activeArtistId) {
      return releasesWithTrack;
    }
    const filtered = releasesWithTrack.filter(
      (r) => r.follow.artistId === activeArtistId,
    );
    return filtered.length > 0 ? filtered : releasesWithTrack;
  }, [activeArtistId, releasesWithTrack]);

  const onToggleFavorite = async (track: Track) => {
    setFeedback(null);
    const isFavorite = favorites.some((f) => f.trackId === track.id);
    try {
      if (isFavorite) {
        await removeFavorite(track.id).unwrap();
      } else {
        await addFavorite(track.id).unwrap();
        setFeedback('Ajouté aux favoris');
      }
    } catch (e) {
      setFeedback(getErrorMessage(e, 'Favori impossible'));
    }
  };

  return (
    <View className="gap-5">
      <AddToPlaylistModal
        track={playlistTrack}
        visible={playlistTrack != null}
        onClose={() => setPlaylistTrack(null)}
        onAdded={(playlistName) => {
          setFeedback(`Ajouté à « ${playlistName} »`);
        }}
      />
      <View className="gap-2">
        <Text style={styles.eyebrow}>TON RÉSEAU</Text>
        <Text style={styles.headline}>Les artistes que tu suis</Text>
        <Text style={styles.lede}>
          Retrouve leurs nouvelles sorties et leurs dernières actualités.
        </Text>
      </View>

      {loading ? (
        <Text className="text-himba-mist">Chargement…</Text>
      ) : null}

      {!loading && follows.length === 0 ? (
        <View className="rounded-card bg-himba-earth p-5">
          <Text className="mb-1 font-semibold text-himba-ink">
            Aucun artiste suivi
          </Text>
          <Text className="text-himba-mist">
            Suis un artiste depuis « Pour toi » pour voir son actualité ici.
          </Text>
        </View>
      ) : null}

      {follows.length > 0 ? (
        <View style={styles.carouselBleed}>
          <FlatList
            data={follows}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            decelerationRate="fast"
            snapToInterval={AVATAR_STEP}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.avatarsRow}
            renderItem={({ item }) => {
              const name = item.artist?.displayName ?? 'Artiste';
              const cover = item.artist?.coverUrl;
              const selected =
                activeArtistId != null
                  ? activeArtistId === item.artistId
                  : false;
              return (
                <Pressable
                  onPress={() => setActiveArtistId(item.artistId)}
                  accessibilityRole="button"
                  accessibilityLabel={name}
                  accessibilityState={{ selected }}
                  style={styles.avatarItem}
                >
                  <View
                    style={[
                      styles.avatarRing,
                      selected ? styles.avatarRingActive : null,
                    ]}
                  >
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.avatarName} numberOfLines={1}>
                    {name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}

      {releasesWithTrack.length > 0 ? (
        <View style={styles.carouselBleed}>
          <FlatList
            data={visibleReleases}
            keyExtractor={(item) => item.follow.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            decelerationRate="fast"
            snapToInterval={cardWidth + 12}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.releasesRow}
            renderItem={({ item }) => {
              const track = item.track;
              if (!track) {
                return null;
              }
              const artistName =
                item.follow.artist?.displayName ??
                track.artist?.displayName ??
                'Artiste';
              const isFavorite = favorites.some((f) => f.trackId === track.id);
              return (
                <View style={[styles.releaseCard, { width: cardWidth }]}>
                  <View style={styles.releaseTop}>
                    <Image
                      source={{
                        uri: track.coverUrl ?? homeMedia.selectionAbstract,
                      }}
                      style={styles.releaseCover}
                      contentFit="cover"
                      accessibilityLabel={track.title}
                    />
                    <View style={styles.releaseCopy}>
                      <Text style={styles.releaseEyebrow}>NOUVELLE SORTIE</Text>
                      <Text style={styles.releaseTitle} numberOfLines={2}>
                        {track.title}
                      </Text>
                      <Text style={styles.releaseMeta} numberOfLines={1}>
                        {artistName} • {formatReleaseLabel(track.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.releaseActions}>
                    <Pressable
                      onPress={() => onPlayTrack?.(track)}
                      accessibilityRole="button"
                      accessibilityLabel={`Écouter ${track.title}`}
                      style={styles.playPill}
                    >
                      <Text style={styles.playIcon}>▶</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        void onToggleFavorite(track);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFavorite
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                      style={styles.iconBtn}
                    >
                      <Text style={styles.iconLabel}>
                        {isFavorite ? '♥' : '♡'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setFeedback(null);
                        setPlaylistTrack(track);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Ajouter à une playlist"
                      style={styles.iconBtn}
                    >
                      <Text style={styles.iconLabel}>＋</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
          {feedback ? (
            <Text style={styles.feedback}>{feedback}</Text>
          ) : null}
        </View>
      ) : null}

      {!loading && follows.length > 0 && releasesWithTrack.length === 0 ? (
        <View className="rounded-card bg-himba-earth p-5">
          <Text className="text-himba-mist">
            Pas encore de sortie récente de tes artistes.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const AVATAR_STEP = 84;

function formatReleaseLabel(createdAt: string | Date | undefined): string {
  if (!createdAt) {
    return 'nouvelle sortie';
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return 'nouvelle sortie';
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date >= startOfToday) {
    return 'publié aujourd’hui';
  }
  const yesterday = new Date(startOfToday);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= yesterday) {
    return 'publié hier';
  }
  return `publié le ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })}`;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: himbaColors.ember,
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    color: himbaColors.ink,
    fontFamily: 'Literata_700Bold',
  },
  lede: {
    fontSize: 13,
    lineHeight: 19,
    color: himbaColors.mist,
    maxWidth: 320,
  },
  carouselBleed: {
    marginHorizontal: -4,
  },
  avatarsRow: {
    gap: 14,
    paddingVertical: 6,
    paddingRight: 28,
  },
  avatarItem: {
    width: 70,
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: himbaColors.canopy,
    borderWidth: 2,
    borderColor: 'rgba(255,102,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRingActive: {
    borderColor: himbaColors.ember,
    borderWidth: 2.5,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: himbaColors.earth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '600',
    color: himbaColors.ink,
    textAlign: 'center',
    width: '100%',
  },
  releasesRow: {
    gap: 12,
    paddingVertical: 2,
    paddingRight: 28,
  },
  releaseCard: {
    borderRadius: 20,
    backgroundColor: himbaColors.earth,
    padding: 14,
    gap: 14,
  },
  releaseTop: {
    flexDirection: 'row',
    gap: 14,
  },
  releaseCover: {
    width: 88,
    height: 88,
    borderRadius: 14,
  },
  releaseCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
    minWidth: 0,
  },
  releaseEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: himbaColors.ember,
  },
  releaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  releaseMeta: {
    fontSize: 12,
    color: himbaColors.mist,
  },
  releaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playPill: {
    width: 48,
    height: 36,
    borderRadius: 999,
    backgroundColor: himbaColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
    fontSize: 13,
    color: himbaColors.night,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 16,
    color: himbaColors.ink,
  },
  feedback: {
    marginTop: 8,
    fontSize: 12,
    color: himbaColors.saffron,
  },
});
