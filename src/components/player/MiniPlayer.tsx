import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAudioPlayerControls } from '@/providers/AudioPlayerProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearPlayer, setPlaying } from '@/store/slices/playerSlice';

/** Mini-lecteur flottant au-dessus de la tab bar — tap → écran Lecture. */
export function MiniPlayer() {
  const dispatch = useAppDispatch();
  const { track, isPlaying, needsPurchase, error } = useAppSelector(
    (s) => s.player,
  );
  const { toggle } = useAudioPlayerControls();

  if (!track) {
    return null;
  }

  const openLecture = () => {
    router.push('/(app)/(tabs)/library');
  };

  return (
    <View className="absolute bottom-[88px] left-5 right-5 z-50 overflow-hidden rounded-2xl border border-himba-canopy bg-himba-earth px-3 py-2">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={openLecture}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la lecture"
          className="flex-1 flex-row items-center gap-3"
        >
          <View className="h-11 w-11 overflow-hidden rounded-lg bg-himba-canopy">
            {track.coverUrl ? (
              <Image
                source={{ uri: track.coverUrl }}
                style={{ width: 44, height: 44 }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-himba-ink" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-xs text-himba-mist" numberOfLines={1}>
              {needsPurchase
                ? 'Achat requis'
                : error ?? track.artist?.displayName ?? 'Himba'}
            </Text>
          </View>
        </Pressable>
        {!needsPurchase ? (
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
            className="h-10 w-10 items-center justify-center rounded-full bg-himba-ember"
          >
            <Text className="text-himba-ink">{isPlaying ? '❚❚' : '▶'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            dispatch(setPlaying(false));
            dispatch(clearPlayer());
          }}
          accessibilityRole="button"
          accessibilityLabel="Fermer le lecteur"
          className="px-2"
        >
          <Text className="text-himba-mist">✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
