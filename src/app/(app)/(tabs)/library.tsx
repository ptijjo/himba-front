import { useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
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
import { PurchaseGate } from '@/components/player/PurchaseGate';
import { RateEntitySheet } from '@/components/ratings/RateEntitySheet';
import { TrackRow } from '@/components/tracks/TrackRow';
import { himbaColors, homeMedia } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import {
  pickNextInQueue,
  pickPrevInQueue,
} from '@/lib/player/queueNavigation';
import { formatPublicAverageLabel } from '@/lib/ratings/formatPublicAverage';
import { useAudioPlayerControls } from '@/providers/AudioPlayerProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  useAddFavoriteMutation,
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/store/api/libraryApi';
import { useGetTrackQuery } from '@/store/api/tracksApi';
import {
  cycleRepeatMode,
  toggleShuffle,
  type RepeatMode,
} from '@/store/slices/playerSlice';

/**
 * Lecteur plein — agencement type Deezer :
 * cover → titre/artiste + actions (♥ + ★) → seek → transport → file.
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
  const { data: favorites = [] } = useGetFavoritesQuery();
  const [addFavorite, { isLoading: addingFav }] = useAddFavoriteMutation();
  const [removeFavorite, { isLoading: removingFav }] =
    useRemoveFavoriteMutation();

  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queueTracks = queue;
  const cover =
    track?.coverUrl ??
    queueTracks[0]?.coverUrl ??
    homeMedia.selectionAbstract;
  const titleCount = queueTracks.length;

  const isFavorite = useMemo(
    () => Boolean(trackId && favorites.some((f) => f.trackId === trackId)),
    [favorites, trackId],
  );

  const publicAvg = formatPublicAverageLabel(trackDetail?.ratingSummary);
  const myValue = trackDetail?.ratingSummary?.myValue ?? null;
  const rateChip =
    publicAvg ?? (myValue != null ? `★ ${myValue}` : '★');

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

  const onToggleFavorite = async () => {
    if (!trackId) {
      return;
    }
    setActionError(null);
    try {
      if (isFavorite) {
        await removeFavorite(trackId).unwrap();
      } else {
        await addFavorite(trackId).unwrap();
      }
    } catch (e) {
      setActionError(getErrorMessage(e, 'Favori impossible'));
    }
  };

  const artistName =
    track?.artist?.displayName ??
    trackDetail?.artist?.displayName ??
    null;
  const artistProfileId = track?.artistId || trackDetail?.artistId || null;

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <AddToPlaylistModal
        track={track ?? null}
        visible={playlistOpen && track != null}
        onClose={() => setPlaylistOpen(false)}
      />
      {trackId ? (
        <RateEntitySheet
          visible={rateOpen}
          onClose={() => setRateOpen(false)}
          title={track?.title}
          summary={trackDetail?.ratingSummary}
          target={{ trackId }}
        />
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-36 pt-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Barre slim type Deezer : fermer / file */}
        <View style={styles.topBar}>
          <Pressable
            onPress={openBibliotheque}
            accessibilityRole="button"
            accessibilityLabel="Fermer le lecteur"
            hitSlop={10}
            style={styles.topHit}
          >
            <Text style={styles.chevron}>∨</Text>
          </Pressable>
          <Text style={styles.topCenter} numberOfLines={1}>
            En cours de lecture
          </Text>
          <View style={styles.topHit}>
            <Text style={styles.queueCount}>
              {titleCount > 0 ? String(titleCount) : ''}
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

        {/* Titre + cœur (rangée Deezer) */}
        <View style={styles.metaRow}>
          <View style={styles.metaText}>
            <Text style={styles.nowTitle} numberOfLines={2}>
              {track?.title ?? 'Aucun morceau'}
            </Text>
            {track && artistName ? (
              <Pressable
                onPress={() => {
                  if (artistProfileId) {
                    openArtistProfile(artistProfileId);
                  }
                }}
                disabled={!artistProfileId}
                accessibilityRole="link"
                accessibilityLabel={`Artiste ${artistName}`}
              >
                <Text style={styles.nowArtist} numberOfLines={1}>
                  {artistName}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.nowSubtitle}>
                {track ? 'Artiste' : 'Ouvre une playlist ou choisis un titre'}
              </Text>
            )}
          </View>
          {trackId ? (
            <Pressable
              onPress={() => {
                void onToggleFavorite();
              }}
              disabled={addingFav || removingFav}
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
              }
              style={styles.heartHit}
            >
              <Text
                style={[
                  styles.heartIcon,
                  { color: isFavorite ? himbaColors.ember : himbaColors.mist },
                ]}
              >
                {isFavorite ? '♥' : '♡'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Actions secondaires : playlist + note */}
        {trackId ? (
          <View style={styles.secondaryActions}>
            <Pressable
              onPress={() => setPlaylistOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajouter à une playlist"
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryIcon}>＋</Text>
            </Pressable>
            <Pressable
              onPress={() => setRateOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={
                publicAvg
                  ? `Note moyenne ${publicAvg}. Noter ou modifier`
                  : myValue != null
                    ? `Ta note ${myValue} sur 5. Modifier`
                    : 'Noter ce titre'
              }
              style={styles.secondaryBtn}
            >
              <Text
                style={[
                  styles.rateChip,
                  {
                    color:
                      publicAvg || myValue != null
                        ? himbaColors.saffron
                        : himbaColors.mist,
                  },
                ]}
              >
                {rateChip}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {actionError ? (
          <Text style={styles.actionErr}>{actionError}</Text>
        ) : null}

        {needsPurchase && track ? <PurchaseGate track={track} /> : null}

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  topHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '600',
    color: himbaColors.ink,
  },
  topCenter: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: himbaColors.mist,
  },
  queueCount: {
    fontSize: 13,
    fontWeight: '600',
    color: himbaColors.mist,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  nowTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  nowArtist: {
    fontSize: 15,
    fontWeight: '500',
    color: himbaColors.ember,
  },
  nowSubtitle: {
    fontSize: 13,
    color: himbaColors.mist,
  },
  heartHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 26,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: himbaColors.earth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryIcon: {
    fontSize: 20,
    color: himbaColors.ink,
  },
  rateChip: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionErr: {
    fontSize: 12,
    color: himbaColors.alert,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 4,
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
    marginTop: 8,
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
