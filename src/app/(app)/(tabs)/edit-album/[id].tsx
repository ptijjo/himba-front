import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  toAlbumPrice,
  updateAlbumSchema,
  type UpdateAlbumValues,
} from '@/schemas/albums';
import { useAppSelector } from '@/store';
import {
  useGetAlbumQuery,
  useUpdateAlbumMutation,
} from '@/store/api/albumsApi';

/**
 * Édition album — PATCH /albums/:id multipart (ARTIST owner ou ADMIN).
 */
export default function EditAlbumScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { id } = useLocalSearchParams<{ id: string }>();
  const albumId = typeof id === 'string' ? id : '';

  if (!canPublishMusic(user?.role)) {
    return <Redirect href="/(app)/(tabs)/profile" />;
  }

  if (!albumId) {
    return <Redirect href="/(app)/(tabs)/profile" />;
  }

  return <EditAlbumForm albumId={albumId} />;
}

function EditAlbumForm({ albumId }: { albumId: string }) {
  const { data: album, isLoading, error } = useGetAlbumQuery(albumId);
  const [updateAlbum, { isLoading: saving }] = useUpdateAlbumMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateAlbumValues>({
    resolver: zodResolver(updateAlbumSchema),
    defaultValues: {
      title: '',
      description: '',
      cover: null,
      pricing: 'free',
      priceEuros: '',
    },
  });

  const cover = useWatch({ control, name: 'cover' });
  const pricing = useWatch({ control, name: 'pricing' });

  useEffect(() => {
    if (!album) {
      return;
    }
    const paid = album.price != null;
    reset({
      title: album.title,
      description: album.description ?? '',
      cover: null,
      pricing: paid ? 'paid' : 'free',
      priceEuros: paid && album.price != null ? String(album.price) : '',
    });
  }, [album, reset]);

  const pickCover = async () => {
    setFormError(null);
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Autorise l’accès aux photos pour la couverture.');
      return;
    }
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
      setFormError('Couverture : JPEG, PNG ou WebP.');
      setValue('cover', null, { shouldValidate: true });
      return;
    }
    const filename =
      asset.fileName ??
      `cover.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;
    setValue(
      'cover',
      { uri: asset.uri, name: filename, mimeType: mime },
      { shouldValidate: true },
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setFeedback(null);
    try {
      const price = toAlbumPrice(values);
      const description = values.description?.trim() ?? '';

      // 1. Nouvelle cover → multipart ; sinon JSON (price: null fiable).
      if (values.cover) {
        const formData = new FormData();
        formData.append('title', values.title.trim());
        formData.append('description', description);
        if (price != null) {
          formData.append('price', String(price));
        }
        formData.append(
          'cover',
          {
            uri: values.cover.uri,
            name: values.cover.name,
            type: values.cover.mimeType,
          } as unknown as Blob,
        );
        await updateAlbum({ id: albumId, formData }).unwrap();
        // 2. Multipart ne gère pas bien price null → second PATCH JSON si gratuit.
        if (price === null) {
          await updateAlbum({
            id: albumId,
            body: { price: null },
          }).unwrap();
        }
      } else {
        await updateAlbum({
          id: albumId,
          body: {
            title: values.title.trim(),
            description,
            price,
          },
        }).unwrap();
      }
      setFeedback('Album mis à jour.');
    } catch (e) {
      setFormError(getErrorMessage(e, 'Modification impossible'));
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-himba-night">
        <ActivityIndicator color={himbaColors.ember} />
      </SafeAreaView>
    );
  }

  if (error || !album) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-himba-night px-5 pt-8">
        <Text className="text-center text-himba-alert">Album introuvable</Text>
        <Button label="Retour" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const previewUri = cover?.uri ?? album.coverUrl ?? null;

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-16 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-himba-ink">
          Modifier l’album
        </Text>
        <Text className="text-sm text-himba-mist">
          {(album.tracks?.length ?? album._count?.tracks ?? 0)} titre(s)
          rattaché(s)
        </Text>

        <View className="gap-4 rounded-2xl bg-himba-earth p-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-himba-mist">
              Couverture
            </Text>
            <Pressable
              onPress={() => {
                void pickCover();
              }}
              accessibilityRole="button"
              accessibilityLabel="Changer la couverture"
              className="h-40 items-center justify-center overflow-hidden rounded-2xl bg-himba-night"
            >
              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-himba-mist">Ajouter une couverture</Text>
              )}
            </Pressable>
            <Text className="text-xs text-himba-mist">
              Laisse tel quel pour conserver l’image actuelle.
            </Text>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Titre de l’album"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />

          <View className="gap-2">
            <Text className="text-sm font-medium text-himba-mist">
              Description
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Présente l’album…"
                  placeholderTextColor={himbaColors.mist}
                  multiline
                  textAlignVertical="top"
                  className="min-h-[100px] rounded-2xl bg-himba-night px-4 py-3 text-himba-ink"
                  accessibilityLabel="Description de l’album"
                />
              )}
            />
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                setValue('pricing', 'free', { shouldValidate: true })
              }
              accessibilityRole="button"
              accessibilityState={{ selected: pricing === 'free' }}
              className={`min-h-11 flex-1 items-center justify-center rounded-2xl ${
                pricing === 'free' ? 'bg-himba-ember' : 'bg-himba-night'
              }`}
            >
              <Text className="font-semibold text-himba-ink">Gratuit</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setValue('pricing', 'paid', { shouldValidate: true })
              }
              accessibilityRole="button"
              accessibilityState={{ selected: pricing === 'paid' }}
              className={`min-h-11 flex-1 items-center justify-center rounded-2xl ${
                pricing === 'paid' ? 'bg-himba-ember' : 'bg-himba-night'
              }`}
            >
              <Text className="font-semibold text-himba-ink">Payant</Text>
            </Pressable>
          </View>

          {pricing === 'paid' ? (
            <Controller
              control={control}
              name="priceEuros"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Prix album (€)"
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  error={errors.priceEuros?.message}
                  placeholder="0.50 — 99.99"
                />
              )}
            />
          ) : null}

          <Button
            label="Enregistrer"
            onPress={onSubmit}
            loading={saving}
            disabled={saving}
          />

          {formError ? (
            <Text className="text-center text-sm text-himba-alert">
              {formError}
            </Text>
          ) : null}
          {feedback ? (
            <Text className="text-center text-sm text-himba-saffron">
              {feedback}
            </Text>
          ) : null}

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text className="text-center font-semibold text-himba-mist">
              Retour
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
