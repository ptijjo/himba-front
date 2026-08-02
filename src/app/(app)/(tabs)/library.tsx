import { useMemo } from 'react';
import { router, type Href } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaLogo } from '@/components/brand/HimbaWordmark';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  ShuffleIcon,
} from '@/components/player/PlayerControlIcons';
import { PlayerCoverSwipe } from '@/components/player/PlayerCoverSwipe';
import { PlayerSeekBar } from '@/components/player/PlayerSeekBar';
import { EntityRatingBlock } from '@/components/ratings/EntityRatingBlock';
import { TrackRow } from '@/components/tracks/TrackRow';
import { himbaColors, homeMedia } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { useAudioPlayerControls } from '@/providers/AudioPlayerProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { useGetTrackQuery } from '@/store/api/tracksApi';
import {
  cycleRepeatMode,
  toggleShuffle,
  type RepeatMode,
} from '@/store/slices/playerSlice';

/**
 * Lecteur plein (cover + contrôles + file).
 * Accès via mini-lecteur / lecture playlist — pas l’entrée de l’onglet Musique.
 */
export default function LectureScreen() {
  const dispatch = useAppDispatch();
  const { playTrack } = usePlayTrack();
  const { toggle } = useAudioPlayerControls();
  const { track, isPlaying, needsPurchase, shuffle, repeatMode, queue } =
    useAppSelector((s) => s.player);

  const trackId = track?.id ?? '';
  const { data: trackDetail } = useGetTrackQuery(trackId, {
    skip: !trackId,
  });

  const queueTracks = queue;
  const cover =
    track?.coverUrl ??
    queueTracks[0]?.coverUrl ??
    homeMedia.selectionAbstract;
  const titleCount = queueTracks.length;

  const canSwipeCover = useMemo(() => {
    if (queueTracks.length <= 1 && repeatMode !== 'all' && !shuffle) {
      return false;
    }
    const next = pickNextInQueue(queueTracks, track?.id, {
      shuffle,
      repeatMode,
    });
    const prev = pickPrevInQueue(queueTracks, track?.id, {
      shuffle,
      repeatMode,
    });
    return next != null || prev != null;
  }, [queueTracks, track?.id, shuffle, repeatMode]);

  const openBibliotheque = () => {
    router.replace('/(app)/(tabs)/bibliotheque' as Href);
  };

  const onPlayPress = () => {
    if (track && !needsPurchase) {
      toggle();
      return;
    }
    const first = queueTracks[0];
    if (first) {
      void playTrack(first, { queue: queueTracks });
    }
  };

  const onPrev = () => {
    const prev = pickPrevInQueue(queueTracks, track?.id, {
      shuffle,
      repeatMode,
    });
    if (prev) {
      void playTrack(prev, { queue: queueTracks });
    }
  };

  const onNext = () => {
    const next = pickNextInQueue(queueTracks, track?.id, {
      shuffle,
      repeatMode,
    });
    if (next) {
      void playTrack(next, { queue: queueTracks });
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
          <Pressable
            onPress={openBibliotheque}
            accessibilityRole="button"
            accessibilityLabel="Retour à la bibliothèque"
            hitSlop={8}
            style={styles.libraryLink}
          >
            <Text style={styles.libraryLinkLabel}>← Bibliothèque</Text>
          </Pressable>
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

        <PlayerCoverSwipe
          coverUri={cover}
          accessibilityLabel={track?.title ?? 'Aucun morceau'}
          canSwipe={canSwipeCover}
          onSwipeNext={onNext}
          onSwipePrev={onPrev}
        />

        <View style={styles.nowPlaying}>
          <Text style={styles.nowTitle}>
            {track?.title ?? 'Aucun morceau'}
          </Text>
          <Text style={styles.nowSubtitle}>
            {track
              ? (track.artist?.displayName ?? track.genre ?? 'Himba')
              : 'Ouvre une playlist ou choisis un titre'}
          </Text>
          {trackId ? (
            <View className="mt-3 items-center">
              <EntityRatingBlock
                summary={trackDetail?.ratingSummary}
                target={{ trackId }}
              />
            </View>
          ) : null}
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
          <Text style={styles.playlistTitle}>
            {queueTracks.length > 0 ? 'File de lecture' : 'En cours'}
          </Text>
          {queueTracks.length > 1 ? (
            <Text style={styles.playlistHint}>
              Appuie sur un titre pour le lire
            </Text>
          ) : null}
        </View>

        {queueTracks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconLabel}>♪</Text>
            </View>
            <Text style={styles.emptyTitle}>Aucun morceau en lecture</Text>
            <Text style={styles.emptyBody}>
              Ouvre une playlist dans Bibliothèque, ou choisis un titre dans
              Explorer.
            </Text>
            <Pressable
              onPress={openBibliotheque}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir la bibliothèque"
              style={styles.cta}
            >
              <Text style={styles.ctaLabel}>Ma bibliothèque</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-2">
            {queueTracks.map((t) => {
              const active = t.id === track?.id;
              return (
                <TrackRow
                  key={t.id}
                  track={t}
                  isActive={active}
                  isPlaying={active && isPlaying}
                  onPress={(item) => {
                    if (active && !needsPurchase) {
                      toggle();
                      return;
                    }
                    void playTrack(item, { queue: queueTracks });
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  libraryLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  libraryLinkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: himbaColors.ember,
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
  nowPlaying: {
    alignItems: 'center',
    gap: 4,
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
    gap: 4,
  },
  playlistTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  playlistHint: {
    fontSize: 13,
    color: himbaColors.mist,
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
