import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaLogo } from '@/components/brand/HimbaWordmark';
import { LibrarySections } from '@/components/library/LibrarySections';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  ShuffleIcon,
} from '@/components/player/PlayerControlIcons';
import { PlayerSeekBar } from '@/components/player/PlayerSeekBar';
import { TrackRow } from '@/components/tracks/TrackRow';
import { himbaColors, homeMedia } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { useAudioPlayerControls } from '@/providers/AudioPlayerProvider';
import type { Track } from '@/schemas/tracks';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  useGetPlaylistQuery,
  useGetPlaylistsQuery,
} from '@/store/api/libraryApi';
import {
  cycleRepeatMode,
  toggleShuffle,
  type RepeatMode,
} from '@/store/slices/playerSlice';

/**
 * Onglet Musique — lecteur + playlists / favoris / suivis.
 */
export default function LectureScreen() {
  const dispatch = useAppDispatch();
  const { playTrack } = usePlayTrack();
  const { toggle } = useAudioPlayerControls();
  const { track, isPlaying, needsPurchase, shuffle, repeatMode } =
    useAppSelector((s) => s.player);

  const { data: playlistsData, isLoading: loadingList } =
    useGetPlaylistsQuery();
  const activePlaylistId = playlistsData?.items[0]?.id;
  const { data: playlistDetail, isLoading: loadingDetail } = useGetPlaylistQuery(
    activePlaylistId ?? '',
    { skip: !activePlaylistId },
  );

  const queueTracks = useMemo(() => {
    if (!playlistDetail?.tracks) {
      return [];
    }
    return playlistDetail.tracks
      .map((item) => item.track)
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map(
        (t): Track => ({
          id: t.id,
          title: t.title,
          genre: t.genre,
          price: t.price ?? null,
          coverUrl: t.coverUrl,
          artistId: t.artistId ?? '',
          durationMs: t.durationMs,
        }),
      );
  }, [playlistDetail]);

  const cover =
    track?.coverUrl ??
    queueTracks[0]?.coverUrl ??
    homeMedia.selectionAbstract;
  const titleCount = queueTracks.length;
  const loading = loadingList || loadingDetail;

  const onPlayPress = () => {
    if (track && !needsPurchase) {
      toggle();
      return;
    }
    const first = queueTracks[0];
    if (first) {
      void playTrack(first);
    }
  };

  const onPrev = () => {
    if (queueTracks.length === 0) {
      return;
    }
    if (repeatMode === 'one' && track) {
      void playTrack(track);
      return;
    }
    if (shuffle) {
      const next = pickRandomTrack(queueTracks, track?.id);
      if (next) {
        void playTrack(next);
      }
      return;
    }
    if (!track) {
      const last = queueTracks[queueTracks.length - 1];
      if (last) {
        void playTrack(last);
      }
      return;
    }
    const idx = queueTracks.findIndex((t) => t.id === track.id);
    const prev =
      idx <= 0
        ? repeatMode === 'all'
          ? queueTracks[queueTracks.length - 1]
          : null
        : queueTracks[idx - 1];
    if (prev) {
      void playTrack(prev);
    }
  };

  const onNext = () => {
    if (queueTracks.length === 0) {
      return;
    }
    if (repeatMode === 'one' && track) {
      void playTrack(track);
      return;
    }
    if (shuffle) {
      const next = pickRandomTrack(queueTracks, track?.id);
      if (next) {
        void playTrack(next);
      }
      return;
    }
    if (!track) {
      const first = queueTracks[0];
      if (first) {
        void playTrack(first);
      }
      return;
    }
    const idx = queueTracks.findIndex((t) => t.id === track.id);
    const nextIdx = idx + 1;
    if (nextIdx < queueTracks.length) {
      const next = queueTracks[nextIdx];
      if (next) {
        void playTrack(next);
      }
      return;
    }
    if (repeatMode === 'all') {
      const first = queueTracks[0];
      if (first) {
        void playTrack(first);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-36 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <HimbaLogo size={36} />
            <View>
              <Text style={styles.brandName}>HIMBA</Text>
              <Text style={styles.brandTag}>la musique nous relie</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>TA MUSIQUE</Text>
            <Text style={styles.headline}>Lecture</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countLabel}>
              {titleCount} titre{titleCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <Image
          source={{ uri: cover }}
          style={styles.heroCover}
          contentFit="cover"
          accessibilityLabel={track?.title ?? 'Aucun morceau'}
        />

        <View style={styles.nowPlaying}>
          <Text style={styles.wave}>▮▮▮</Text>
          <Text style={styles.nowTitle}>
            {track?.title ?? 'Aucun morceau'}
          </Text>
          <Text style={styles.nowSubtitle}>
            {track
              ? (track.artist?.displayName ?? track.genre ?? 'Himba')
              : 'Ajoutez un titre depuis Explorer'}
          </Text>
        </View>

        <PlayerSeekBar />

        <View style={styles.controls}>
          <Pressable
            onPress={() => dispatch(toggleShuffle())}
            accessibilityRole="button"
            accessibilityState={{ selected: shuffle }}
            accessibilityLabel={
              shuffle ? 'Désactiver lecture aléatoire' : 'Lecture aléatoire'
            }
            hitSlop={10}
            style={styles.iconHit}
          >
            <ShuffleIcon
              size={22}
              color={shuffle ? himbaColors.player : himbaColors.ink}
            />
          </Pressable>
          <Pressable
            onPress={onPrev}
            accessibilityRole="button"
            accessibilityLabel="Titre précédent"
            hitSlop={10}
            style={styles.iconHit}
          >
            <PreviousIcon size={22} color={himbaColors.ink} />
          </Pressable>
          <Pressable
            onPress={onPlayPress}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
            style={styles.playControl}
          >
            {isPlaying ? (
              <PauseIcon size={28} color={himbaColors.ink} />
            ) : (
              <PlayIcon size={28} color={himbaColors.ink} />
            )}
          </Pressable>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Titre suivant"
            hitSlop={10}
            style={styles.iconHit}
          >
            <NextIcon size={22} color={himbaColors.ink} />
          </Pressable>
          <Pressable
            onPress={() => dispatch(cycleRepeatMode())}
            accessibilityRole="button"
            accessibilityLabel={repeatAccessibilityLabel(repeatMode)}
            hitSlop={10}
            style={styles.iconHit}
          >
            <RepeatIcon
              size={22}
              mode={repeatMode === 'one' ? 'one' : 'all'}
              color={
                repeatMode === 'off' ? himbaColors.ink : himbaColors.player
              }
            />
          </Pressable>
        </View>

        <View style={styles.playlistHeader}>
          <Text style={styles.playlistTitle}>En cours</Text>
        </View>

        {loading ? (
          <Text className="text-himba-mist">Chargement…</Text>
        ) : null}

        {!loading && queueTracks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconLabel}>♪</Text>
            </View>
            <Text style={styles.emptyTitle}>Aucun morceau en lecture</Text>
            <Text style={styles.emptyBody}>
              Ajoute des morceaux depuis Explorer, ou choisis un favori plus bas.
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)',
                  params: { tab: 'explorer' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Explorer les morceaux"
              style={styles.cta}
            >
              <Text style={styles.ctaLabel}>Explorer les morceaux</Text>
            </Pressable>
          </View>
        ) : null}

        {queueTracks.length > 0 ? (
          <View className="gap-2">
            {queueTracks.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                onPress={(item) => {
                  void playTrack(item);
                }}
              />
            ))}
          </View>
        ) : null}

        <View className="mt-2 gap-2">
          <Text
            className="text-2xl text-himba-ink"
            style={{ fontFamily: 'Literata_700Bold' }}
          >
            Bibliothèque
          </Text>
          <LibrarySections />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function pickRandomTrack(tracks: Track[], excludeId?: string): Track | null {
  if (tracks.length === 0) {
    return null;
  }
  if (tracks.length === 1) {
    return tracks[0] ?? null;
  }
  const pool = excludeId
    ? tracks.filter((t) => t.id !== excludeId)
    : tracks;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick ?? tracks[0] ?? null;
}

function repeatAccessibilityLabel(mode: RepeatMode): string {
  switch (mode) {
    case 'off':
      return 'Répétition désactivée — activer boucle playlist';
    case 'all':
      return 'Boucle playlist — passer en repeat 1';
    case 'one':
      return 'Repeat 1 — désactiver la répétition';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: himbaColors.ink,
    letterSpacing: 0.4,
  },
  brandTag: {
    fontSize: 11,
    color: himbaColors.mist,
  },
  roundHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: himbaColors.earth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundHeaderLabel: {
    fontSize: 14,
    color: himbaColors.ink,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: himbaColors.ember,
  },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    color: himbaColors.ink,
    fontFamily: 'Literata_700Bold',
  },
  countBadge: {
    borderRadius: 999,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: himbaColors.mist,
  },
  heroCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: himbaColors.earth,
  },
  nowPlaying: {
    alignItems: 'center',
    gap: 4,
  },
  wave: {
    fontSize: 12,
    letterSpacing: 2,
    color: himbaColors.ember,
  },
  nowTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: himbaColors.ink,
    textAlign: 'center',
  },
  nowSubtitle: {
    fontSize: 13,
    color: himbaColors.mist,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playControl: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: himbaColors.player,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playlistTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconLabel: {
    fontSize: 24,
    color: himbaColors.ink,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: himbaColors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: himbaColors.mist,
    textAlign: 'center',
  },
  cta: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: himbaColors.ember,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: himbaColors.ink,
  },
});
