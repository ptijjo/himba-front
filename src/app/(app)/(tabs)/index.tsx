import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaWordmark } from '@/components/brand/HimbaWordmark';
import { ExploreTab } from '@/components/home/ExploreTab';
import { FollowingTab } from '@/components/home/FollowingTab';
import { HomeHeroCarousel } from '@/components/home/HomeHeroCarousel';
import { HomeTabs } from '@/components/home/HomeTabs';
import { SelectionSection } from '@/components/home/SelectionSection';
import { AtmosphereBackdrop } from '@/components/media/AtmosphereBackdrop';
import { ReportModal } from '@/components/reports/ReportModal';
import { TrackActionsSheet } from '@/components/tracks/TrackActionsSheet';
import { TrackRow } from '@/components/tracks/TrackRow';
import { himbaColors, homeMedia } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import {
  useFilterHiddenTracks,
  useHiddenContentKeys,
} from '@/hooks/useHiddenContent';
import { isArtistHidden } from '@/lib/reports/hiddenContent';
import type { Track } from '@/schemas/tracks';
import { useAppSelector } from '@/store';
import { useGetFollowsQuery } from '@/store/api/libraryApi';
import {
  useGetRecommendationsQuery,
  useGetTracksQuery,
} from '@/store/api/tracksApi';

type HomeTabId = 'pour-toi' | 'suivis' | 'explorer';

/**
 * Accueil — Pour toi / Suivis / Explorer (onglet principal).
 * Fond = cover du slide « Musiques récentes » actif.
 *
 * Le catalogue est partagé entre appareils : on refetch au focus onglet +
 * pull-to-refresh, sinon le cache RTK (écran toujours monté) masque les nouveautés.
 */
export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<HomeTabId>('pour-toi');
  const [heroBackdropUri, setHeroBackdropUri] = useState<string>(
    homeMedia.heroConcert,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [reportTrack, setReportTrack] = useState<Track | null>(null);
  const { playTrack } = usePlayTrack();

  useEffect(() => {
    if (
      params.tab === 'explorer' ||
      params.tab === 'suivis' ||
      params.tab === 'pour-toi'
    ) {
      setTab(params.tab);
    }
  }, [params.tab]);

  const {
    data: recommendations = [],
    isLoading: loadingRecos,
    refetch: refetchRecos,
  } = useGetRecommendationsQuery(undefined, {
    skip: tab !== 'pour-toi',
    refetchOnMountOrArgChange: true,
  });
  const {
    data: tracksPage,
    isLoading: loadingTracks,
    refetch: refetchTracks,
  } = useGetTracksQuery(
    {
      limit: 40,
    },
    { refetchOnMountOrArgChange: true },
  );
  const {
    data: follows = [],
    isLoading: loadingFollows,
    refetch: refetchFollows,
  } = useGetFollowsQuery(undefined, {
    skip: tab !== 'suivis',
    refetchOnMountOrArgChange: true,
  });

  const catalogRaw = tracksPage?.items ?? [];
  const catalog = useFilterHiddenTracks(catalogRaw);
  const recommendationsVisible = useFilterHiddenTracks(recommendations);
  const hiddenKeys = useHiddenContentKeys();
  const followsVisible = useMemo(
    () => follows.filter((f) => !isArtistHidden(f.artistId, hiddenKeys)),
    [follows, hiddenKeys],
  );
  // Proposition artiste : reco si dispo ; hero = catalogue récent (API createdAt desc).
  const selectionTracks =
    tab === 'pour-toi' && recommendationsVisible.length > 0
      ? recommendationsVisible
      : catalog;

  const showCoverBackdrop = tab === 'pour-toi';

  // 1. Retour sur l’onglet Accueil → recharger catalogue (et reco / suivis selon onglet).
  useFocusEffect(
    useCallback(() => {
      void refetchTracks();
      if (tab === 'pour-toi') {
        void refetchRecos();
      }
      if (tab === 'suivis') {
        void refetchFollows();
      }
    }, [tab, refetchTracks, refetchRecos, refetchFollows]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 2. Pull-to-refresh : forcer un aller-retour API même si le cache est « frais ».
      const jobs: Array<Promise<unknown>> = [refetchTracks()];
      if (tab === 'pour-toi') {
        jobs.push(refetchRecos());
      }
      if (tab === 'suivis') {
        jobs.push(refetchFollows());
      }
      await Promise.all(jobs);
    } finally {
      setRefreshing(false);
    }
  }, [tab, refetchTracks, refetchRecos, refetchFollows]);

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      {showCoverBackdrop ? (
        <AtmosphereBackdrop
          variant="home"
          imageUri={heroBackdropUri}
          style={styles.backdrop}
        />
      ) : null}
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor={himbaColors.ember}
            colors={[himbaColors.ember]}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <HimbaWordmark compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
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
        </View>

        <HomeTabs active={tab} onChange={setTab} />

        {tab === 'pour-toi' ? (
          <>
            <HomeHeroCarousel
              tracks={catalog}
              onActiveImageChange={setHeroBackdropUri}
              onPlayTrack={(t) => {
                void playTrack(t);
              }}
            />
            <SelectionSection
              tracks={selectionTracks}
              loading={loadingRecos || loadingTracks}
              onPlayTrack={(t) => {
                void playTrack(t);
              }}
            />
            <View className="gap-2">
              <Text className="text-lg font-bold text-himba-ink">
                Catalogue
              </Text>
              {catalog.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPress={(t) => {
                    void playTrack(t);
                  }}
                  onMenuPress={setMenuTrack}
                />
              ))}
              {loadingTracks ? (
                <Text className="text-himba-mist">Chargement…</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {tab === 'suivis' ? (
          <FollowingTab
            follows={followsVisible}
            tracks={catalog}
            loading={loadingFollows || loadingTracks}
            onPlayTrack={(t) => {
              void playTrack(t);
            }}
          />
        ) : null}

        {tab === 'explorer' ? (
          <ExploreTab
            tracks={catalog}
            loading={loadingTracks}
            onPlayTrack={(t) => {
              void playTrack(t);
            }}
          />
        ) : null}
      </ScrollView>

      <TrackActionsSheet
        visible={menuTrack !== null}
        title={menuTrack?.title}
        subtitle={menuTrack?.artist?.displayName ?? menuTrack?.genre ?? undefined}
        onClose={() => setMenuTrack(null)}
        actions={
          menuTrack
            ? [
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 0,
  },
});
