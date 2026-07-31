import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { useGetFollowsQuery } from '@/store/api/libraryApi';

/**
 * Artistes suivis — liste bibliothèque.
 */
export default function LibraryArtistsScreen() {
  const { data: follows = [], isLoading } = useGetFollowsQuery();

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-36 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="self-start"
        >
          <Text className="text-base font-semibold text-himba-ember">
            ← Retour
          </Text>
        </Pressable>

        <View className="gap-1">
          <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
            BIBLIOTHÈQUE
          </Text>
          <Text className="text-3xl font-bold text-himba-ink">Artistes</Text>
          <Text className="text-himba-mist">
            {follows.length} artiste{follows.length > 1 ? 's' : ''}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={himbaColors.ember} />
        ) : follows.length === 0 ? (
          <Text className="text-himba-mist">Aucun abonnement pour l’instant.</Text>
        ) : (
          <View className="gap-2">
            {follows.map((f) => {
              const name = f.artist?.displayName ?? 'Artiste';
              const avatar =
                f.artist?.avatarUrl ?? f.artist?.coverUrl ?? null;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => openArtistProfile(f.artistId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Profil de ${name}`}
                  className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3"
                >
                  <View
                    className="h-14 w-14 overflow-hidden rounded-full"
                    style={{ backgroundColor: himbaColors.canopy }}
                  >
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={{ width: 56, height: 56 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Text className="text-xl font-bold text-himba-ink">
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="flex-1 font-semibold text-himba-ink">
                    {name}
                  </Text>
                  <Text className="text-himba-mist">›</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
