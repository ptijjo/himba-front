import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AddToPlaylistModal } from '@/components/library/AddToPlaylistModal';
import { ReportModal } from '@/components/reports/ReportModal';
import { TrackActionsSheet } from '@/components/tracks/TrackActionsSheet';
import { himbaColors, homeMedia } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import type { Track } from '@/schemas/tracks';

const GENRE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'afro', label: 'Afro' },
  { id: 'rap', label: 'Rap' },
  { id: 'electro', label: 'Electro' },
] as const;

type GenreFilterId = (typeof GENRE_FILTERS)[number]['id'];

type ExploreTabProps = {
  tracks: Track[];
  loading?: boolean;
  onPlayTrack?: (track: Track) => void;
};

/**
 * Onglet Explorer — recherche locale, filtres genre, cartes catalogue (maquette).
 */
export function ExploreTab({
  tracks,
  loading,
  onPlayTrack,
}: ExploreTabProps) {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<GenreFilterId>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [reportTrack, setReportTrack] = useState<Track | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((track) => {
      const genre = (track.genre ?? '').toLowerCase();
      const matchesGenre =
        genreFilter === 'all' || genre.includes(genreFilter);
      if (!matchesGenre) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        track.title,
        track.artist?.displayName ?? '',
        track.genre ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [genreFilter, query, tracks]);

  return (
    <View className="gap-5">
      <AddToPlaylistModal
        track={playlistTrack}
        visible={playlistTrack != null}
        onClose={() => setPlaylistTrack(null)}
        onAdded={(playlistName) => {
          setFeedback(
            playlistTrack
              ? `« ${playlistTrack.title} » → ${playlistName}`
              : `Ajouté à ${playlistName}`,
          );
        }}
      />

      <TrackActionsSheet
        visible={menuTrack !== null}
        title={menuTrack?.title}
        subtitle={menuTrack?.artist?.displayName ?? menuTrack?.genre ?? undefined}
        onClose={() => setMenuTrack(null)}
        actions={
          menuTrack
            ? [
                {
                  key: 'playlist',
                  label: 'Ajouter à une playlist',
                  onPress: () => setPlaylistTrack(menuTrack),
                },
                {
                  key: 'report',
                  label: 'Signaler ce titre',
                  onPress: () => setReportTrack(menuTrack),
                },
              ]
            : []
        }
      />

      <ReportModal
        visible={reportTrack !== null}
        targetType="TRACK"
        targetId={reportTrack?.id ?? ''}
        targetLabel={reportTrack?.title}
        onClose={() => setReportTrack(null)}
      />

      <View className="gap-2">
        <Text style={styles.eyebrow}>TROUVER TON SON</Text>
        <Text style={styles.headline}>Explorer</Text>
        <Text style={styles.lede}>Rechercher une musique ou un artiste</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon} accessibilityElementsHidden>
          ⌕
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Titre, artiste ou genre…"
          placeholderTextColor={himbaColors.mist}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Rechercher une musique ou un artiste"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {GENRE_FILTERS.map((filter) => {
          const active = genreFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setGenreFilter(filter.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  active ? styles.chipLabelActive : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      {loading ? <Text className="text-himba-mist">Chargement…</Text> : null}

      {!loading && filtered.length === 0 ? (
        <View className="rounded-card bg-himba-earth p-5">
          <Text className="text-himba-mist">
            Aucun résultat pour cette recherche.
          </Text>
        </View>
      ) : null}

      <View className="gap-4">
        {filtered.map((track) => (
          <ExploreTrackCard
            key={track.id}
            track={track}
            onPlay={() => onPlayTrack?.(track)}
            onAdd={() => {
              setFeedback(null);
              setPlaylistTrack(track);
            }}
            onMenu={() => setMenuTrack(track)}
          />
        ))}
      </View>
    </View>
  );
}

function ExploreTrackCard({
  track,
  onPlay,
  onAdd,
  onMenu,
}: {
  track: Track;
  onPlay: () => void;
  onAdd: () => void;
  onMenu: () => void;
}) {
  const artist =
    track.artist?.displayName ?? track.genre ?? 'Artiste Himba';

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: track.coverUrl ?? homeMedia.selectionAbstract }}
        style={styles.cover}
        contentFit="cover"
        accessibilityLabel={track.title}
      />
      <View style={styles.cardFooter}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Pressable
            onPress={() => {
              if (track.artistId) {
                openArtistProfile(track.artistId);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Voir le profil de ${artist}`}
          >
            <Text style={styles.cardArtist} numberOfLines={1}>
              {artist}
            </Text>
          </Pressable>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={onMenu}
            accessibilityRole="button"
            accessibilityLabel={`Options pour ${track.title}`}
            style={styles.roundBtn}
          >
            <Text style={styles.roundBtnLabel}>⋮</Text>
          </Pressable>
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter ${track.title} à une playlist`}
            style={styles.roundBtn}
          >
            <Text style={styles.roundBtnLabel}>＋</Text>
          </Pressable>
          <Pressable
            onPress={onPlay}
            accessibilityRole="button"
            accessibilityLabel={`Écouter ${track.title}`}
            style={[styles.roundBtn, styles.playBtn]}
          >
            <Text style={styles.playBtnLabel}>▶</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  lede: {
    fontSize: 14,
    color: himbaColors.mist,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 18,
  },
  searchIcon: {
    fontSize: 20,
    color: himbaColors.mist,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: himbaColors.ink,
    paddingVertical: 12,
  },
  filtersRow: {
    gap: 10,
    paddingRight: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,240,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: himbaColors.ember,
    backgroundColor: himbaColors.ember,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: himbaColors.ink,
  },
  chipLabelActive: {
    color: himbaColors.night,
  },
  feedback: {
    fontSize: 12,
    color: himbaColors.saffron,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: himbaColors.earth,
  },
  cover: {
    width: '100%',
    height: 168,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  cardArtist: {
    fontSize: 13,
    color: himbaColors.mist,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnLabel: {
    fontSize: 20,
    color: himbaColors.ink,
  },
  playBtn: {
    backgroundColor: himbaColors.ink,
  },
  playBtnLabel: {
    marginLeft: 2,
    fontSize: 14,
    color: himbaColors.night,
  },
});
