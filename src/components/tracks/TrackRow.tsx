import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { formatTrackPrice, type Track } from '@/schemas/tracks';

type TrackRowProps = {
  track: Track;
  onPress: (track: Track) => void;
  trailing?: string;
};

export function TrackRow({ track, onPress, trailing }: TrackRowProps) {
  const price = formatTrackPrice(track.price);

  return (
    <Pressable
      onPress={() => onPress(track)}
      accessibilityRole="button"
      accessibilityLabel={`Écouter ${track.title}`}
      className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3"
    >
      <View
        className="h-14 w-14 overflow-hidden rounded-xl"
        style={{ backgroundColor: himbaColors.canopy }}
      >
        {track.coverUrl ? (
          <Image
            source={{ uri: track.coverUrl }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-himba-ink" numberOfLines={1}>
          {track.title}
        </Text>
        <Text className="text-sm text-himba-mist" numberOfLines={1}>
          {track.artist?.displayName ?? track.genre ?? 'Titre'} · {price}
        </Text>
      </View>
      {trailing ? (
        <Text className="text-xs text-himba-ember">{trailing}</Text>
      ) : (
        <Text className="text-himba-ember">▶</Text>
      )}
    </Pressable>
  );
}
