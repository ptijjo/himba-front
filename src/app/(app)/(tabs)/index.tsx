import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaWordmark } from '@/components/brand/HimbaWordmark';
import { ExploreTab } from '@/components/home/ExploreTab';
import { FollowingTab } from '@/components/home/FollowingTab';
import { HomeHeroCarousel } from '@/components/home/HomeHeroCarousel';
import { HomeTabs } from '@/components/home/HomeTabs';
import { SelectionSection } from '@/components/home/SelectionSection';
import { AtmosphereBackdrop } from '@/components/media/AtmosphereBackdrop';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { TrackRow } from '@/components/tracks/TrackRow';
import { homeMedia } from '@/constants/theme';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { useAppSelector } from '@/store';
import { useGetFollowsQuery } from '@/store/api/libraryApi';
import {
  useGetRecommendationsQuery,
  useGetTracksQuery,
} from '@/store/api/tracksApi';

type HomeTabId = 'pour-toi' | 'suivis' | 'explorer';

/**
 * Accueil — Pour toi / Suivis / Explorer (onglet principal).
 * Fond = cover du slide « À la une » actif.
 */
export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<HomeTabId>('pour-toi');
  const [heroBackdropUri, setHeroBackdropUri] = useState<string>(
    homeMedia.heroConcert,
  );
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

  const { data: recommendations = [], isLoading: loadingRecos } =
    useGetRecommendationsQuery(undefined, { skip: tab !== 'pour-toi' });
  const { data: tracksPage, isLoading: loadingTracks } = useGetTracksQuery({
    limit: 40,
  });
  const { data: follows = [], isLoading: loadingFollows } = useGetFollowsQuery(
    undefined,
    { skip: tab !== 'suivis' },
  );

  const catalog = tracksPage?.items ?? [];
  const selectionTracks =
    tab === 'pour-toi' && recommendations.length > 0
      ? recommendations
      : catalog;

  const showCoverBackdrop = tab === 'pour-toi';

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
        contentContainerClassName="gap-5 px-5 pb-40 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              tracks={selectionTracks}
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
                Suggestions
              </Text>
              {selectionTracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPress={(t) => {
                    void playTrack(t);
                  }}
                />
              ))}
              {loadingRecos || loadingTracks ? (
                <Text className="text-himba-mist">Chargement…</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {tab === 'suivis' ? (
          <FollowingTab
            follows={follows}
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
      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 0,
  },
});
