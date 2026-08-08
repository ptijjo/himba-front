import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import { useToast } from '@/providers/ToastProvider';
import {
  useAddAlbumFavoriteMutation,
  useGetAlbumFavoritesQuery,
  useRemoveAlbumFavoriteMutation,
} from '@/store/api/libraryApi';

type AlbumRowProps = {
  albumId: string;
  title: string;
  coverUrl?: string | null;
  /** Sous-titre (ex. « 2 titres » ou « Artiste · 2 titres »). */
  subtitle: string;
  onPress: () => void;
  /** Affiche le cœur favori (défaut true). */
  showFavorite?: boolean;
  /** Menu ⋮ (ex. signaler). */
  onMenuPress?: () => void;
};

/**
 * Ligne album — ouverture + cœur bibliothèque (POST/DELETE album-favorites).
 */
export function AlbumRow({
  albumId,
  title,
  coverUrl,
  subtitle,
  onPress,
  showFavorite = true,
  onMenuPress,
}: AlbumRowProps) {
  const { showToast } = useToast();
  const { data: albumFavorites = [] } = useGetAlbumFavoritesQuery(undefined, {
    skip: !showFavorite,
  });
  const [addFavorite, { isLoading: adding }] = useAddAlbumFavoriteMutation();
  const [removeFavorite, { isLoading: removing }] =
    useRemoveAlbumFavoriteMutation();
  const [error, setError] = useState<string | null>(null);

  const isFavorite = albumFavorites.some((f) => f.albumId === albumId);
  const busy = adding || removing;

  const onToggleFavorite = async () => {
    setError(null);
    try {
      if (isFavorite) {
        await removeFavorite(albumId).unwrap();
        showToast({ message: 'Album retiré de ta bibliothèque', kind: 'info' });
      } else {
        await addFavorite(albumId).unwrap();
        showToast({ message: 'Album ajouté à ta bibliothèque' });
      }
    } catch (e) {
      const msg = getErrorMessage(e, 'Action impossible');
      setError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  };

  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-3 rounded-2xl bg-himba-earth p-3">
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Album ${title}`}
          className="min-h-[44px] flex-1 flex-row items-center gap-3"
        >
          <View
            className="h-14 w-14 overflow-hidden rounded-xl"
            style={{ backgroundColor: himbaColors.canopy }}
          >
            {coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                style={{ width: 56, height: 56 }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-himba-ink" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-sm text-himba-mist" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </Pressable>

        {onMenuPress ? (
          <Pressable
            onPress={onMenuPress}
            accessibilityRole="button"
            accessibilityLabel={`Options pour l’album ${title}`}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            hitSlop={8}
          >
            <Text className="text-xl text-himba-mist">⋮</Text>
          </Pressable>
        ) : null}

        {showFavorite ? (
          <Pressable
            onPress={() => {
              void onToggleFavorite();
            }}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? 'Retirer des albums aimés' : 'Aimer cet album'
            }
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            hitSlop={8}
          >
            <Text
              className="text-xl"
              style={{
                color: isFavorite ? himbaColors.ember : himbaColors.mist,
              }}
            >
              {isFavorite ? '♥' : '♡'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="px-1 text-sm text-himba-alert">{error}</Text>
      ) : null}
    </View>
  );
}
