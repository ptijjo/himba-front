import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistTermsGate } from '@/components/artists/ArtistTermsGate';
import { ProfileAccordion } from '@/components/profile/ProfileAccordion';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  formatUserRoleLabel,
  formatUserStatusLabel,
} from '@/lib/profile/userFacingLabels';
import { useToast } from '@/providers/ToastProvider';
import {
  changePasswordFormSchema,
  changeUsernameFormSchema,
  type ChangePasswordFormValues,
  type ChangeUsernameFormValues,
} from '@/schemas/auth';
import {
  becomeArtistFormSchema,
  updateArtistDisplayNameFormSchema,
  type BecomeArtistFormValues,
  type UpdateArtistDisplayNameFormValues,
} from '@/schemas/artists';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  useBecomeArtistMutation,
  useGetMyArtistQuery,
  useUpdateArtistMutation,
} from '@/store/api/artistsApi';
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useLazyGetMeQuery,
  useUpdateMyUsernameMutation,
} from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';

type ProfileSection = 'username' | 'password' | 'artist' | null;

export default function ProfileScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { showToast } = useToast();
  const [logout, { isLoading }] = useLogoutMutation();
  const { data: myArtist, isLoading: loadingArtist } = useGetMyArtistQuery(
    undefined,
    { skip: !user },
  );
  const [openSection, setOpenSection] = useState<ProfileSection>(null);

  if (!user) {
    return null;
  }

  const canBecomeArtist =
    !loadingArtist &&
    !myArtist &&
    (user.role === 'LISTENER' || user.role === 'ADMIN');

  const roleLabel = formatUserRoleLabel(user.role);
  const statusLabel = formatUserStatusLabel(user.status);

  const toggle = (section: ProfileSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const onLogout = () => {
    Alert.alert('Se déconnecter', 'Tu vas quitter ton compte sur cet appareil.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          void logout().finally(() => {
            showToast({ message: 'À bientôt sur Himba', kind: 'info' });
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-himba-night">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="text-3xl text-himba-ink"
          style={{ fontFamily: 'Literata_700Bold' }}
        >
          Profil
        </Text>

        <ProfileAvatar user={user} />

        <View className="items-center gap-2">
          <Text className="text-lg font-semibold text-himba-ink">
            @{user.username}
          </Text>
          <Text className="text-himba-mist">{user.email}</Text>
          <View className="mt-1 flex-row flex-wrap items-center justify-center gap-2">
            <Badge label={roleLabel} />
            {statusLabel ? <Badge label={statusLabel} tone="alert" /> : null}
            {myArtist ? (
              <Badge label={myArtist.displayName} tone="ember" />
            ) : null}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
            COMPTE
          </Text>
          <ProfileAccordion
            title="Pseudo"
            subtitle={`@${user.username}`}
            open={openSection === 'username'}
            onToggle={() => toggle('username')}
          >
            <ChangeUsernameForm
              currentUsername={user.username}
              onDone={() => setOpenSection(null)}
            />
          </ProfileAccordion>

          <ProfileAccordion
            title="Mot de passe"
            subtitle="Modifier ton mot de passe"
            open={openSection === 'password'}
            onToggle={() => toggle('password')}
          >
            <ChangePasswordForm onDone={() => setOpenSection(null)} />
          </ProfileAccordion>
        </View>

        {myArtist || canBecomeArtist ? (
          <View className="gap-2">
            <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
              ARTISTE
            </Text>
            <ProfileAccordion
              title={
                myArtist ? 'Nom d’artiste' : 'Créer un profil artiste'
              }
              subtitle={
                myArtist
                  ? myArtist.displayName
                  : 'Publie des titres et albums'
              }
              open={openSection === 'artist'}
              onToggle={() => toggle('artist')}
            >
              {myArtist ? (
                <ChangeArtistNameForm
                  artistId={myArtist.id}
                  currentDisplayName={myArtist.displayName}
                  onDone={() => setOpenSection(null)}
                />
              ) : (
                <BecomeArtistForm onDone={() => setOpenSection(null)} />
              )}
            </ProfileAccordion>
          </View>
        ) : null}

        <Button
          label="Se déconnecter"
          variant="secondary"
          loading={isLoading}
          onPress={onLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'ember' | 'alert';
}) {
  const bg =
    tone === 'ember'
      ? himbaColors.ember
      : tone === 'alert'
        ? himbaColors.alert
        : himbaColors.canopy;
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: bg }}
    >
      <Text className="text-xs font-semibold text-himba-ink">{label}</Text>
    </View>
  );
}

function ChangeUsernameForm({
  currentUsername,
  onDone,
}: {
  currentUsername: string;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [updateUsername, { isLoading }] = useUpdateMyUsernameMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeUsernameFormValues>({
    resolver: zodResolver(changeUsernameFormSchema),
    defaultValues: { username: currentUsername },
  });

  useEffect(() => {
    reset({ username: currentUsername });
  }, [currentUsername, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    if (values.username === currentUsername) {
      setError('Choisis un pseudo différent');
      return;
    }
    try {
      const me = await updateUsername(values.username).unwrap();
      dispatch(setCredentials({ user: me }));
      showToast({ message: 'Pseudo mis à jour' });
      onDone();
    } catch (e) {
      const msg = getErrorMessage(e, 'Pseudo déjà pris ou invalide');
      setError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  });

  return (
    <View className="gap-3">
      <Text className="text-sm text-himba-mist">
        Unique sur Himba — lettres, chiffres et underscore (3–30).
      </Text>
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nouveau pseudo"
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.username?.message}
          />
        )}
      />
      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
      <Button
        label="Enregistrer"
        loading={isLoading}
        onPress={onSubmit}
      />
    </View>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const applyChange = async (values: ChangePasswordFormValues) => {
    setError(null);
    try {
      const res = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      reset();
      showToast({ message: res.message || 'Mot de passe mis à jour' });
      onDone();
    } catch (e) {
      const msg = getErrorMessage(e, 'Impossible de changer le mot de passe');
      setError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  };

  // 1. Valider le formulaire · 2. Confirmer · 3. Appeler l’API
  const onPress = handleSubmit((values) => {
    Alert.alert(
      'Changer le mot de passe',
      'Les autres appareils connectés seront déconnectés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            void applyChange(values);
          },
        },
      ],
    );
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="currentPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Mot de passe actuel"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.currentPassword?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nouveau mot de passe"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.newPassword?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirmer"
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
      <Button label="Mettre à jour" loading={isLoading} onPress={onPress} />
    </View>
  );
}

function ChangeArtistNameForm({
  artistId,
  currentDisplayName,
  onDone,
}: {
  artistId: string;
  currentDisplayName: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [updateArtist, { isLoading }] = useUpdateArtistMutation();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateArtistDisplayNameFormValues>({
    resolver: zodResolver(updateArtistDisplayNameFormSchema),
    defaultValues: {
      displayName: currentDisplayName,
      acceptArtistTerms: false,
    },
  });

  useEffect(() => {
    reset({
      displayName: currentDisplayName,
      acceptArtistTerms: false,
    });
  }, [currentDisplayName, reset]);

  const accepted = watch('acceptArtistTerms');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    if (values.displayName.trim() === currentDisplayName) {
      setError('Choisis un nom d’artiste différent');
      return;
    }
    try {
      await updateArtist({
        artistId,
        displayName: values.displayName.trim(),
        acceptArtistTerms: true,
      }).unwrap();
      setValue('acceptArtistTerms', false);
      showToast({ message: 'Nom d’artiste mis à jour' });
      onDone();
    } catch (e) {
      const msg = getErrorMessage(e, 'Impossible de changer le nom d’artiste');
      setError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  });

  return (
    <View className="gap-3">
      <Text className="text-sm text-himba-mist">
        Relis et accepte les conditions artiste pour valider le nouveau nom.
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
      <ArtistTermsGate
        key={`terms-${currentDisplayName}`}
        accepted={accepted}
        onAcceptedChange={(v) => {
          setValue('acceptArtistTerms', v, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
        error={errors.acceptArtistTerms?.message}
      />
      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
      <Button
        label="Enregistrer"
        loading={isLoading}
        disabled={!accepted}
        onPress={onSubmit}
      />
    </View>
  );
}

function BecomeArtistForm({ onDone }: { onDone: () => void }) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [becomeArtist, { isLoading }] = useBecomeArtistMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BecomeArtistFormValues>({
    resolver: zodResolver(becomeArtistFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      acceptArtistTerms: false,
    },
  });

  const accepted = watch('acceptArtistTerms');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await becomeArtist({
        displayName: values.displayName,
        bio: values.bio?.trim() ? values.bio : undefined,
      }).unwrap();
      const me = await fetchMe(undefined).unwrap();
      dispatch(setCredentials({ user: me }));
      showToast({ message: 'Profil artiste créé — ouvre le Studio' });
      onDone();
    } catch (e) {
      const msg = getErrorMessage(e, 'Impossible de créer le profil artiste');
      setError(msg);
      showToast({ message: msg, kind: 'error' });
    }
  });

  return (
    <View className="gap-3">
      <Text className="text-sm text-himba-mist">
        Gratuit — indispensable pour publier. L’encaissement Stripe viendra
        plus tard.
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
      <ArtistTermsGate
        accepted={accepted}
        onAcceptedChange={(v) => {
          setValue('acceptArtistTerms', v, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
        error={errors.acceptArtistTerms?.message}
      />
      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
      <Button
        label="Créer mon profil artiste"
        loading={isLoading}
        disabled={!accepted}
        onPress={onSubmit}
      />
    </View>
  );
}
