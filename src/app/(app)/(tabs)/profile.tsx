import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistKycCard } from '@/components/artists/ArtistKycCard';
import { ArtistTermsGate } from '@/components/artists/ArtistTermsGate';
import { ProfileAccordion } from '@/components/profile/ProfileAccordion';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { StudioLibrarySection } from '@/components/studio/StudioLibrarySection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { useArtistStripeOnboarding } from '@/hooks/useArtistStripeOnboarding';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { getErrorMessage } from '@/lib/errors/apiError';
import { openPurchases } from '@/lib/navigation/openProfile';
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
  updateArtistDisplayNameFormSchema,
  type UpdateArtistDisplayNameFormValues,
} from '@/schemas/artists';
import { useAppDispatch, useAppSelector } from '@/store';
import { useGetAlbumsQuery } from '@/store/api/albumsApi';
import {
  useGetMyArtistQuery,
  useUpdateArtistMutation,
} from '@/store/api/artistsApi';
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateMyUsernameMutation,
} from '@/store/api/authApi';
import { useGetTracksQuery } from '@/store/api/tracksApi';
import { setCredentials } from '@/store/slices/authSlice';

type ProfileSection = 'username' | 'password' | 'artist' | 'catalog' | null;

export default function ProfileScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { showToast } = useToast();
  const [logout, { isLoading }] = useLogoutMutation();
  const { data: myArtist } = useGetMyArtistQuery(undefined, {
    skip: !user,
  });
  const {
    startOnboarding,
    isLoading: kycLoading,
    error: kycError,
    clearError: clearKycError,
  } = useArtistStripeOnboarding();
  const [openSection, setOpenSection] = useState<ProfileSection>(null);

  if (!user) {
    return null;
  }

  const roleLabel = formatUserRoleLabel(user.role);
  const statusLabel = formatUserStatusLabel(user.status);
  const showKycCard = Boolean(myArtist?.needsOnboarding);

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

          <Pressable
            onPress={openPurchases}
            accessibilityRole="button"
            accessibilityLabel="Mes achats"
            className="min-h-[52px] flex-row items-center gap-3 rounded-2xl bg-himba-earth px-4 py-3"
          >
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-bold text-himba-ink">
                Mes achats
              </Text>
              <Text className="text-sm text-himba-mist" numberOfLines={1}>
                Titres et albums achetés, avec la date
              </Text>
            </View>
            <Text className="text-lg text-himba-ember">›</Text>
          </Pressable>
        </View>

        {myArtist ? (
          <View className="gap-2">
            <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
              ARTISTE
            </Text>
            {showKycCard ? (
              <ArtistKycCard
                artist={myArtist}
                loading={kycLoading}
                error={kycError}
                onStart={() => {
                  clearKycError();
                  void startOnboarding().then((ok) => {
                    if (ok) {
                      showToast({
                        message:
                          'Si Stripe a validé ton compte, tu pourras publier sous peu.',
                        kind: 'info',
                      });
                    }
                  });
                }}
              />
            ) : null}
            <ProfileAccordion
              title="Nom d’artiste"
              subtitle={myArtist.displayName}
              open={openSection === 'artist'}
              onToggle={() => toggle('artist')}
            >
              <ChangeArtistNameForm
                artistId={myArtist.id}
                currentDisplayName={myArtist.displayName}
                onDone={() => setOpenSection(null)}
              />
            </ProfileAccordion>
          </View>
        ) : null}

        {myArtist && canPublishMusic(user.role) ? (
          <ArtistCatalogSection
            artistId={myArtist.id}
            open={openSection === 'catalog'}
            onToggle={() => toggle('catalog')}
          />
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

/**
 * Gestion titres / albums depuis le profil — modif nom, cover, gratuit/payant.
 */
function ArtistCatalogSection({
  artistId,
  open,
  onToggle,
}: {
  artistId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { data: albumsData, isLoading: loadingAlbums } = useGetAlbumsQuery({
    artistId,
    limit: 50,
  });
  const { data: tracksPage, isLoading: loadingTracks } = useGetTracksQuery({
    artistId,
    limit: 50,
  });

  const albums = albumsData?.items ?? [];
  const tracks = tracksPage?.items ?? [];
  const loading = loadingAlbums || loadingTracks;

  return (
    <View className="gap-2">
      <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
        CATALOGUE
      </Text>
      <ProfileAccordion
        title="Mes musiques & albums"
        subtitle={
          loading
            ? 'Chargement…'
            : `${tracks.length} titre${tracks.length > 1 ? 's' : ''} · ${albums.length} album${albums.length > 1 ? 's' : ''}`
        }
        open={open}
        onToggle={onToggle}
      >
        <View className="gap-4">
          <Text className="text-sm text-himba-mist">
            Change le nom, la cover, le mode gratuit / payant et le prix.
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/studio')}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le Studio pour publier"
            className="min-h-11 items-center justify-center rounded-2xl bg-himba-ember px-4"
          >
            <Text className="font-semibold text-himba-ink">
              Publier une musique
            </Text>
          </Pressable>
          <StudioLibrarySection
            albums={albums}
            tracks={tracks}
            loading={loading}
          />
        </View>
      </ProfileAccordion>
    </View>
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
