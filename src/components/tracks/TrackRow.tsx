import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { openArtistProfile } from '@/lib/navigation/openProfile';
import { formatTrackPrice, type Track } from '@/schemas/tracks';

type TrackRowProps = {
  track: Track;
  onPress: (track: Track) => void;
  /** Menu ⋮ (actions contextuelles). */
  onMenuPress?: (track: Track) => void;
  trailing?: string;
  /** Titre actuellement sélectionné dans le lecteur. */
  isActive?: boolean;
  /** En lecture (vs pause sur ce titre). */
  isPlaying?: boolean;
};

export function TrackRow({
  track,
  onPress,
  onMenuPress,
  trailing,
  isActive = false,
  isPlaying = false,
}: TrackRowProps) {
  const price = formatTrackPrice(track.price);
  const artistName = track.artist?.displayName ?? track.genre ?? 'Titre';

  return (
    <View
      className={`flex-row items-center rounded-2xl ${
        isActive
          ? 'border border-himba-ochre bg-himba-earth'
          : 'bg-himba-earth'
      }`}
    >
      <Pressable
        onPress={() => onPress(track)}
        accessibilityRole="button"
        accessibilityLabel={`Écouter ${track.title}`}
        accessibilityState={{ selected: isActive }}
        className="min-h-[44px] flex-1 flex-row items-center gap-3 p-3 pr-1"
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

      {onMenuPress ? (
        <Pressable
          onPress={() => onMenuPress(track)}
          accessibilityRole="button"
          accessibilityLabel={`Options pour ${track.title}`}
          hitSlop={8}
          className="min-h-[44px] min-w-[44px] items-center justify-center px-3"
        >
          <Text className="text-xl leading-none text-himba-mist">⋮</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
