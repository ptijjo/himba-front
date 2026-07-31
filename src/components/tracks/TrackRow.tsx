import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { formatTrackPrice, type Track } from '@/schemas/tracks';

type TrackRowProps = {
  track: Track;
  onPress: (track: Track) => void;
  trailing?: string;
  /** Titre actuellement sélectionné dans le lecteur. */
  isActive?: boolean;
  /** En lecture (vs pause sur ce titre). */
  isPlaying?: boolean;
};

export function TrackRow({
  track,
  onPress,
  trailing,
  isActive = false,
  isPlaying = false,
}: TrackRowProps) {
  const price = formatTrackPrice(track.price);
  const artistName = track.artist?.displayName ?? track.genre ?? 'Titre';

  return (
    <Pressable
      onPress={() => onPress(track)}
      accessibilityRole="button"
      accessibilityLabel={`Écouter ${track.title}`}
      accessibilityState={{ selected: isActive }}
      className={`flex-row items-center gap-3 rounded-2xl p-3 ${
        isActive
          ? 'border border-himba-ochre bg-himba-earth'
          : 'bg-himba-earth'
      }`}
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
      <View className="flex-1 gap-0.5">
        <Text
          className={`font-semibold ${
            isActive ? 'text-himba-ember' : 'text-himba-ink'
          }`}
          numberOfLines={1}
        >
          {track.title}
        </Text>
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
            {isActive
              ? isPlaying
                ? 'En lecture'
                : 'En pause'
              : `${artistName} · ${price}`}
          </Text>
        </Pressable>
      </View>
      {trailing ? (
        <Text className="text-xs text-himba-ember">{trailing}</Text>
      ) : null}
    </Pressable>
  );
}
