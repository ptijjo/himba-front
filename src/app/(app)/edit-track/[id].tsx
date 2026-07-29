import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { getErrorMessage } from '@/lib/errors/apiError';
import { TRACK_GENRES, trackGenreSchema, type TrackGenre } from '@/schemas/genres';
import {
  toUpdateTrackPrice,
  updateTrackSchema,
  type UpdateTrackValues,
} from '@/schemas/studio';
import { useAppSelector } from '@/store';
import {
  useGetTrackGenresQuery,
  useGetTrackQuery,
  useUpdateTrackMutation,
} from '@/store/api/tracksApi';

/**
 * Édition titre — PATCH /tracks/:id (ARTIST owner ou ADMIN).
 */
export default function EditTrackScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { id } = useLocalSearchParams<{ id: string }>();
  const trackId = typeof id === 'string' ? id : '';

  if (!canPublishMusic(user?.role)) {
    return <Redirect href="/(app)/(tabs)/profile" />;
  }

  if (!trackId) {
    return <Redirect href="/(app)/studio" />;
  }

  return <EditTrackForm trackId={trackId} />;
}

function resolveGenre(raw: string | null | undefined): TrackGenre {
  const parsed = trackGenreSchema.safeParse(raw);
  return parsed.success ? parsed.data : 'AFRO';
}

function EditTrackForm({ trackId }: { trackId: string }) {
  const { data: track, isLoading, error } = useGetTrackQuery(trackId);
  const { data: genresFromApi } = useGetTrackGenresQuery();
  const genres = genresFromApi ?? TRACK_GENRES;
  const [updateTrack, { isLoading: saving }] = useUpdateTrackMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateTrackValues>({
    resolver: zodResolver(updateTrackSchema),
    defaultValues: {
      title: '',
      genre: 'AFRO',
      pricing: 'free',
      priceEuros: '',
    },
  });

  const selectedGenre = useWatch({ control, name: 'genre' });
  const pricing = useWatch({ control, name: 'pricing' });

  // 1. Hydrater depuis GET /tracks/:id (owner / ADMIN tranché par l’API).
  useEffect(() => {
    if (!track) {
      return;
    }
    const paid = track.price != null;
    reset({
      title: track.title,
      genre: resolveGenre(track.genre),
      pricing: paid ? 'paid' : 'free',
      priceEuros: paid && track.price != null ? String(track.price) : '',
    });
  }, [track, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setFeedback(null);
    try {
      await updateTrack({
        id: trackId,
        body: {
          title: values.title.trim(),
          genre: values.genre,
          price: toUpdateTrackPrice(values),
        },
      }).unwrap();
      setFeedback('Titre mis à jour.');
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

  if (error || !track) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-himba-night px-5 pt-8">
        <Text className="text-center text-himba-alert">Titre introuvable</Text>
        <Button label="Retour" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-16 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-himba-ink">Modifier le titre</Text>
        <Text className="text-sm text-himba-mist">
          Titre, genre et prix — l’audio d’origine est conservé.
        </Text>

        <View className="gap-4 rounded-2xl bg-himba-earth p-4">
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Titre"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />

          <View className="gap-2">
            <Text className="text-sm font-medium text-himba-mist">Genre</Text>
            <View className="flex-row flex-wrap gap-2">
              {genres.map((g) => {
                const selected = selectedGenre === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() =>
                      setValue('genre', g.id as TrackGenre, {
                        shouldValidate: true,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`min-h-11 rounded-full px-4 py-2 ${
                      selected ? 'bg-himba-ember' : 'bg-himba-night'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selected ? 'text-himba-ink' : 'text-himba-mist'
                      }`}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.genre?.message ? (
              <Text className="text-sm text-himba-alert">
                {errors.genre.message}
              </Text>
            ) : null}
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
                  label="Prix (€)"
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  error={errors.priceEuros?.message}
                  placeholder="1.99"
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
