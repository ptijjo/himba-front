import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  becomeArtistSchema,
  type BecomeArtistValues,
} from '@/schemas/artists';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  useBecomeArtistMutation,
  useGetMyArtistQuery,
} from '@/store/api/artistsApi';
import { useLogoutMutation, useLazyGetMeQuery } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';

export default function ProfileScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();
  const { data: myArtist, isLoading: loadingArtist } = useGetMyArtistQuery(
    undefined,
    { skip: !user },
  );

  if (!user) {
    return null;
  }

  // LISTENER ou ADMIN sans profil Artist → formulaire (Studio exige un Artist)
  const canBecomeArtist =
    !loadingArtist &&
    !myArtist &&
    (user.role === 'LISTENER' || user.role === 'ADMIN');

  return (
    <SafeAreaView className="flex-1 bg-himba-night">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4"
      >
        <Text
          className="text-3xl text-himba-ink"
          style={{ fontFamily: 'Literata_700Bold' }}
        >
          Profil
        </Text>

        <ProfileAvatar user={user} />

        <View className="items-center gap-1">
          <Text className="text-lg text-himba-ink">@{user.username}</Text>
          <Text className="text-himba-mist">{user.email}</Text>
          <Text className="text-sm text-himba-mist">
            Rôle : {user.role} · Statut : {user.status}
          </Text>
          {myArtist ? (
            <Text className="text-sm text-himba-ember">
              Artiste : {myArtist.displayName}
            </Text>
          ) : null}
        </View>

        {canBecomeArtist ? <BecomeArtistForm /> : null}

        <Button
          label="Se déconnecter"
          variant="secondary"
          loading={isLoading}
          onPress={() => {
            void logout();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function BecomeArtistForm() {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [becomeArtist, { isLoading }] = useBecomeArtistMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BecomeArtistValues>({
    resolver: zodResolver(becomeArtistSchema),
    defaultValues: { displayName: '', bio: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setOk(null);
    try {
      // 1. POST /artists/become  2. Recharger /users/me
      await becomeArtist(values).unwrap();
      const me = await fetchMe(undefined).unwrap();
      dispatch(setCredentials({ user: me }));
      setOk('Profil artiste créé — tu peux publier depuis le Studio.');
    } catch (e) {
      setError(getErrorMessage(e, 'Impossible de créer le profil artiste'));
    }
  });

  return (
    <View className="gap-3 rounded-2xl bg-himba-earth p-4">
      <Text className="text-lg font-bold text-himba-ink">
        Créer un profil artiste
      </Text>
      <Text className="text-sm text-himba-mist">
        Gratuit — indispensable pour publier des titres et des albums (même en
        ADMIN).
      </Text>
      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nom d’artiste"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.displayName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Bio (optionnel)"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.bio?.message}
          />
        )}
      />
      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
      {ok ? <Text className="text-sm text-himba-ember">{ok}</Text> : null}
      <Button
        label="Créer mon profil artiste"
        loading={isLoading}
        onPress={onSubmit}
      />
    </View>
  );
}
