import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import {
  useGetPublicProfileQuery,
  useGetUserFollowsQuery,
  useGetUserPlaylistsQuery,
} from '@/store/api/usersApi';

/**
 * Profil public auditeur — pseudo, bio, playlists, artistes suivis.
 * Pas d’email ni données personnelles.
 */
export default function UserPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === 'string' ? id : '';

  const {
    data: profile,
    isLoading,
    isError,
  } = useGetPublicProfileQuery(userId, { skip: !userId });
  const { data: playlists = [], isLoading: loadingPlaylists } =
    useGetUserPlaylistsQuery(userId, { skip: !userId || Boolean(profile?.artistId) });
  const { data: followedArtists = [], isLoading: loadingFollows } =
    useGetUserFollowsQuery(userId, { skip: !userId || Boolean(profile?.artistId) });

  // Compte artiste → vitrine albums / titres
  useEffect(() => {
    if (profile?.artistId) {
      router.replace(`/(app)/artist/${profile.artistId}` as Href);
    }
  }, [profile?.artistId]);

  if (!userId || isError) {
    return (
      <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
        <Pressable onPress={() => router.back()} className="p-4">
          <Text className="text-himba-ember">← Retour</Text>
        </Pressable>
        <Text className="px-4 text-himba-alert">Profil introuvable</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !profile || profile.artistId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-himba-night">
        <ActivityIndicator color={himbaColors.ember} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} className="mb-2 self-start">
          <Text className="text-base font-semibold text-himba-ember">
            ← Retour
          </Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.avatarRing}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {profile.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-himba-ink">Playlists</Text>
          {loadingPlaylists ? (
            <Text className="text-himba-mist">Chargement…</Text>
          ) : playlists.length === 0 ? (
            <Text className="text-himba-mist">Aucune playlist.</Text>
          ) : (
            playlists.map((pl) => (
              <View key={pl.id} style={styles.plainRow}>
                <Text className="font-semibold text-himba-ink">{pl.name}</Text>
                <Text className="text-sm text-himba-mist">
                  {pl.trackCount} titre{pl.trackCount > 1 ? 's' : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-himba-ink">
            Artistes suivis
          </Text>
          {loadingFollows ? (
            <Text className="text-himba-mist">Chargement…</Text>
          ) : followedArtists.length === 0 ? (
            <Text className="text-himba-mist">Aucun abonnement.</Text>
          ) : (
            followedArtists.map((f) => {
              const name = f.artist?.displayName ?? 'Artiste';
              return (
                <Pressable
                  key={f.id}
                  onPress={() => openArtistProfile(f.artistId)}
                  style={styles.plainRow}
                  accessibilityRole="button"
                >
                  <Text className="font-semibold text-himba-ink">{name}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: himbaColors.ember,
    borderRadius: 48,
    padding: 2,
    marginBottom: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: himbaColors.earth,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: himbaColors.mist,
    textAlign: 'center',
  },
  plainRow: {
    borderRadius: 16,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
});
