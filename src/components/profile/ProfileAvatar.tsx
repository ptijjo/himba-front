import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import type { AuthUser } from '@/schemas/auth';
import { useAppDispatch } from '@/store';
import { useUpdateMyAvatarMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';

type ProfileAvatarProps = {
  user: AuthUser;
};

/**
 * Avatar profil — sélection galerie + PATCH /users/me (champ multipart `avatar`).
 */
export function ProfileAvatar({ user }: ProfileAvatarProps) {
  const dispatch = useAppDispatch();
  const [updateAvatar, { isLoading }] = useUpdateMyAvatarMutation();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUri = localPreview ?? user.avatarUrl;

  const onChangePhoto = async () => {
    setError(null);
    setOk(null);

    // 1. Permission galerie
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Autorise l’accès aux photos pour changer ton avatar.');
      return;
    }

    // 2. Choisir une image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (
      mime !== 'image/jpeg' &&
      mime !== 'image/png' &&
      mime !== 'image/webp'
    ) {
      setError('Format accepté : JPEG, PNG ou WebP.');
      return;
    }

    setLocalPreview(asset.uri);

    // 3. Envoyer multipart `avatar` → API convertit en WebP / R2
    const formData = new FormData();
    const filename =
      asset.fileName ??
      `avatar.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;

    formData.append(
      'avatar',
      {
        uri: asset.uri,
        name: filename,
        type: mime,
      } as unknown as Blob,
    );

    try {
      const updated = await updateAvatar(formData).unwrap();
      dispatch(setCredentials({ user: updated }));
      setLocalPreview(null);
      setOk('Photo de profil mise à jour.');
    } catch (e) {
      setLocalPreview(null);
      setError(getErrorMessage(e, 'Impossible de changer la photo'));
    }
  };

  return (
    <View className="items-center gap-3">
      <Pressable
        onPress={() => {
          void onChangePhoto();
        }}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Changer la photo de profil"
        className="relative"
      >
        <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-himba-earth border-2 border-himba-ember">
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={{ width: 112, height: 112 }}
              contentFit="cover"
            />
          ) : (
            <Text className="text-4xl font-bold text-himba-mist">
              {(user.username[0] ?? '?').toUpperCase()}
            </Text>
          )}
        </View>
        <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full bg-himba-ember">
          {isLoading ? (
            <ActivityIndicator color={himbaColors.ink} size="small" />
          ) : (
            <Text className="text-sm font-bold text-himba-ink">✎</Text>
          )}
        </View>
      </Pressable>
      <Pressable
        onPress={() => {
          void onChangePhoto();
        }}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Changer ma photo"
      >
        <Text className="font-semibold text-himba-ember">
          {isLoading ? 'Envoi…' : 'Changer ma photo'}
        </Text>
      </Pressable>
      {error ? (
        <Text className="text-center text-sm text-himba-alert">{error}</Text>
      ) : null}
      {ok ? (
        <Text className="text-center text-sm text-himba-saffron">{ok}</Text>
      ) : null}
    </View>
  );
}
