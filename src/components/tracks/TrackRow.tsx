import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { formatTrackPrice, type Track } from '@/schemas/tracks';

type TrackRowProps = {
  track: Track;
  onPress: (track: Track) => void;
  trailing?: string;
};

export function TrackRow({ track, onPress, trailing }: TrackRowProps) {
  const price = formatTrackPrice(track.price);
  const artistName = track.artist?.displayName ?? track.genre ?? 'Titre';

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3">
      <Pressable
        onPress={() => onPress(track)}
        accessibilityRole="button"
        accessibilityLabel={`Écouter ${track.title}`}
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
      </Pressable>
      <View className="flex-1 gap-0.5">
        <Pressable
          onPress={() => onPress(track)}
          accessibilityRole="button"
          accessibilityLabel={`Écouter ${track.title}`}
        >
          <Text className="font-semibold text-himba-ink" numberOfLines={1}>
            {track.title}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (track.artistId) {
              openArtistProfile(track.artistId);
            }
          }}
          disabled={!track.artistId}
          accessibilityRole="button"
          accessibilityLabel={`Profil de ${artistName}`}
        >
          <Text className="text-sm text-himba-mist" numberOfLines={1}>
            {artistName} · {price}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => onPress(track)}
        accessibilityRole="button"
        accessibilityLabel={`Écouter ${track.title}`}
        hitSlop={8}
      >
        {trailing ? (
          <Text className="text-xs text-himba-ember">{trailing}</Text>
        ) : (
          <Text className="text-himba-ember">▶</Text>
        )}
      </Pressable>
    </View>
  );
}
