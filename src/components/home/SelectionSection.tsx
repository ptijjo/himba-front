import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
import { RatingAverageBadge } from '@/components/ratings/RatingAverageBadge';
import { ReportModal } from '@/components/reports/ReportModal';
import { himbaColors, homeMedia } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import type { Track } from '@/schemas/tracks';
import type { ReportTargetType } from '@/schemas/reports';
import { useGetArtistQuery } from '@/store/api/artistsApi';
import {
  useAddFavoriteMutation,
  useFollowArtistMutation,
  useGetFavoritesQuery,
  useGetFollowsQuery,
  useRemoveFavoriteMutation,
  useUnfollowArtistMutation,
} from '@/store/api/libraryApi';
import { useGetTrackQuery } from '@/store/api/tracksApi';

type SelectionSectionProps = {
  tracks: Track[];
  loading?: boolean;
  onPlayTrack?: (track: Track) => void;
};

/**
 * « Pour toi aujourd’hui » — proposition d’artiste (cover, bio, follow, favori, playlist).
 */
export function SelectionSection({
  tracks,
  loading,
  onPlayTrack,
}: SelectionSectionProps) {
  const featured = tracks[0] ?? null;
  const artistId = featured?.artistId;
  const { data: artist } = useGetArtistQuery(artistId ?? '', {
    skip: !artistId,
  });
  /** Détail pour ratingSummary (absent des listes / reco). */
  const { data: featuredDetail } = useGetTrackQuery(featured?.id ?? '', {
    skip: !featured?.id,
  });
  const { data: follows = [] } = useGetFollowsQuery();
  const { data: favorites = [] } = useGetFavoritesQuery();
  const [followArtist] = useFollowArtistMutation();
  const [unfollowArtist] = useUnfollowArtistMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
    label: string;
  } | null>(null);

  const isFollowing = useMemo(
    () => Boolean(artistId && follows.some((f) => f.artistId === artistId)),
    [artistId, follows],
  );
  const isFavorite = useMemo(
    () =>
      Boolean(featured && favorites.some((f) => f.trackId === featured.id)),
    [favorites, featured],
  );

  const cover =
    artist?.coverUrl ?? featured?.coverUrl ?? homeMedia.selectionAbstract;
  const artistName =
    artist?.displayName ?? featured?.artist?.displayName ?? 'Artiste Himba';
  const genre = featured?.genre?.trim() || null;
  const pitch =
    artist?.bio?.trim() ||
    (genre
      ? `Un voyage dans le ${genre} — découvre et soutiens cet artiste sur Himba.`
      : 'Découvre cette voix indépendante, écoute ses titres et ajoute-les à ta playlist.');

  const onToggleFollow = async () => {
    if (!artistId) {
      return;
    }
    setActionError(null);
    setActionOk(null);
    try {
      if (isFollowing) {
        await unfollowArtist(artistId).unwrap();
        setActionOk('Abonnement retiré');
      } else {
        await followArtist(artistId).unwrap();
        setActionOk('Artiste suivi');
      }
    } catch (e) {
      setActionError(getErrorMessage(e, 'Action impossible'));
    }
  };

  const onToggleFavorite = async () => {
    if (!featured) {
      return;
    }
    setActionError(null);
    setActionOk(null);
    try {
      if (isFavorite) {
        await removeFavorite(featured.id).unwrap();
      } else {
        await addFavorite(featured.id).unwrap();
        setActionOk('Ajouté aux favoris');
      }
    } catch (e) {
      setActionError(getErrorMessage(e, 'Favori impossible'));
    }
  };

  const onOpenPlaylist = () => {
    if (!featured) {
      return;
    }
    setActionError(null);
    setActionOk(null);
    setPlaylistOpen(true);
  };

  return (
    <View className="gap-3">
      <AddToPlaylistModal
        track={featured}
        visible={playlistOpen && featured != null}
        onClose={() => setPlaylistOpen(false)}
        onAdded={(playlistName) => {
          setActionOk(`Ajouté à « ${playlistName} »`);
        }}
      />
      <ReportModal
        visible={reportTarget !== null}
        targetType={reportTarget?.type ?? 'TRACK'}
        targetId={reportTarget?.id ?? ''}
        targetLabel={reportTarget?.label}
        onClose={() => setReportTarget(null)}
      />
      <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
        PROPOSITION ARTISTE
      </Text>
      <Text className="text-2xl font-bold text-himba-ink">
        Pour toi aujourd&apos;hui
      </Text>

      <View style={styles.card}>
        <View style={styles.media}>
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            accessibilityLabel={`Proposition : ${artistName}`}
          />
          {loading ? (
            <View style={styles.loadingChip}>
              <Text className="text-xs text-himba-ink">Chargement…</Text>
            </View>
          ) : featured ? (
            <Pressable
              onPress={() => onPlayTrack?.(featured)}
              accessibilityRole="button"
              accessibilityLabel={`Écouter ${featured.title}`}
              style={styles.play}
            >
              <Text style={styles.playIcon}>▶</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.titles}>
              <Text style={styles.title} numberOfLines={1}>
                {featured?.title ?? 'Titre à découvrir'}
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                onPress={() => {
                  if (artistId) {
                    openArtistProfile(artistId);
                  }
                }}
                accessibilityRole="link"
              >
                {artistName}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  if (artistId) {
                    openArtistProfile(artistId);
                  }
                }}
                disabled={!artistId}
                accessibilityRole="button"
                accessibilityLabel={`Voir le profil de ${artistName}`}
                style={styles.avatar}
              >
                {artist?.avatarUrl ? (
                  <Image
                    source={{ uri: artist.avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {artistName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  void onToggleFollow();
                }}
                disabled={!artistId}
                accessibilityRole="button"
                accessibilityLabel={
                  isFollowing ? 'Ne plus suivre' : 'Suivre l’artiste'
                }
                style={[
                  styles.followBtn,
                  isFollowing ? styles.followBtnActive : null,
                ]}
              >
                <Text style={styles.followLabel}>
                  {isFollowing ? 'Suivi' : '+ Suivre'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.pitch} numberOfLines={3}>
            {pitch}
          </Text>

          <View style={styles.actions}>
            <ActionButton
              label={isFavorite ? '♥' : '♡'}
              accessibilityLabel={
                isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
              }
              onPress={() => {
                void onToggleFavorite();
              }}
              disabled={!featured}
            />
            <ActionButton
              label="＋"
              accessibilityLabel="Ajouter à une playlist"
              onPress={onOpenPlaylist}
              disabled={!featured}
            />
            <View style={styles.ratingSlot}>
              <RatingAverageBadge
                summary={featuredDetail?.ratingSummary}
                showNewWhenEmpty={Boolean(featured)}
              />
            </View>
          </View>

          {actionOk ? (
            <Text style={styles.feedbackOk}>{actionOk}</Text>
          ) : null}
          {actionError ? (
            <Text style={styles.feedbackErr}>{actionError}</Text>
          ) : null}

          {featured || artistId ? (
            <View style={styles.reportRow}>
              {featured ? (
                <Pressable
                  onPress={() =>
                    setReportTarget({
                      type: 'TRACK',
                      id: featured.id,
                      label: featured.title,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Signaler ce titre"
                  hitSlop={8}
                >
                  <Text style={styles.reportLink}>Signaler le titre</Text>
                </Pressable>
              ) : null}
              {artistId ? (
                <Pressable
                  onPress={() =>
                    setReportTarget({
                      type: 'ARTIST',
                      id: artistId,
                      label: artistName,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Signaler cet artiste"
                  hitSlop={8}
                >
                  <Text style={styles.reportLink}>Signaler l’artiste</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  disabled,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.actionBtn}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: himbaColors.earth,
  },
  media: {
    height: 190,
    justifyContent: 'flex-end',
  },
  loadingChip: {
    alignSelf: 'flex-start',
    margin: 12,
    borderRadius: 999,
    backgroundColor: himbaColors.glass,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  play: {
    alignSelf: 'flex-start',
    margin: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
    fontSize: 15,
    color: himbaColors.night,
  },
  body: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titles: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: himbaColors.mist,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  followBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,240,255,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followBtnActive: {
    borderColor: himbaColors.ember,
    backgroundColor: 'rgba(255,102,0,0.18)',
  },
  followLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: himbaColors.ink,
  },
  pitch: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(245,240,255,0.82)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  ratingSlot: {
    flex: 1,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 2,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 18,
    color: himbaColors.ink,
  },
  feedbackOk: {
    fontSize: 12,
    color: himbaColors.saffron,
  },
  feedbackErr: {
    fontSize: 12,
    color: himbaColors.alert,
  },
  reportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  reportLink: {
    fontSize: 12,
    fontWeight: '600',
    color: himbaColors.mist,
    textDecorationLine: 'underline',
  },
});
