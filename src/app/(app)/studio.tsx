import { zodResolver } from '@hookform/resolvers/zod';
import * as DocumentPicker from 'expo-document-picker';
import { createAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaLogo } from '@/components/brand/HimbaWordmark';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { himbaColors } from '@/constants/theme';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  createAlbumSchema,
  type CreateAlbumValues,
} from '@/schemas/albums';
import { TRACK_GENRES, type TrackGenre } from '@/schemas/genres';
import {
  isAllowedAudioMime,
  isAllowedAudioName,
  studioTrackSchema,
  toPrice,
  type StudioTrackValues,
} from '@/schemas/studio';
import { useAppSelector } from '@/store';
import { useCreateAlbumMutation, useGetAlbumsQuery } from '@/store/api/albumsApi';
import { useGetMyArtistQuery } from '@/store/api/artistsApi';
import {
  useCreateTrackMutation,
  useGetTrackGenresQuery,
} from '@/store/api/tracksApi';

type StudioPanel = 'track' | 'album';

/**
 * Studio Himba — même route, deux panneaux :
 * 1. Publier un titre  2. Créer un album
 */
export default function StudioScreen() {
  const user = useAppSelector((s) => s.auth.user);

  if (!canPublishMusic(user?.role)) {
    return <Redirect href="/(app)/(tabs)/profile" />;
  }

  return (
    <StudioShell
      username={user?.username ?? ''}
      avatarUrl={user?.avatarUrl}
    />
  );
}

function StudioShell({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null | undefined;
}) {
  const { data: myArtist, isLoading: loadingArtist } = useGetMyArtistQuery();
  const artistId = myArtist?.id;
  const { data: albumsData, isLoading: loadingAlbums } = useGetAlbumsQuery(
    { artistId, limit: 50 },
    { skip: !artistId },
  );

  const [panel, setPanel] = useState<StudioPanel>('track');
  /** Après création d’album → pré-sélection sur le formulaire titre. */
  const [pendingAlbumId, setPendingAlbumId] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-40 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StudioHeader username={username} avatarUrl={avatarUrl} />

        {loadingArtist ? (
          <ActivityIndicator color={himbaColors.ember} />
        ) : null}

        {!loadingArtist && !myArtist ? (
          <Text className="text-center text-sm text-himba-alert">
            Aucun profil artiste. Passe par Profil → Devenir artiste.
          </Text>
        ) : null}

        {panel === 'track' ? (
          <TrackPublishPanel
            username={username}
            myArtistDisplayName={myArtist?.displayName}
            hasArtist={Boolean(myArtist)}
            albums={albumsData?.items ?? []}
            loadingAlbums={loadingAlbums}
            pendingAlbumId={pendingAlbumId}
            onPendingAlbumConsumed={() => setPendingAlbumId(null)}
            onOpenCreateAlbum={() => setPanel('album')}
          />
        ) : (
          <AlbumCreatePanel
            hasArtist={Boolean(myArtist)}
            onCancel={() => setPanel('track')}
            onCreated={(albumId) => {
              setPendingAlbumId(albumId);
              setPanel('track');
            }}
          />
        )}

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Text className="text-center font-semibold text-himba-ember">
            Retour
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StudioHeader({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null | undefined;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <HimbaLogo size={36} />
        <View>
          <Text className="text-base font-bold text-himba-ink">HIMBA</Text>
          <Text className="text-[11px] text-himba-mist">
            la musique nous relie
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/profile')}
        accessibilityRole="button"
        accessibilityLabel="Profil"
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-himba-earth"
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 40, height: 40 }}
            contentFit="cover"
          />
        ) : (
          <Text className="font-bold text-himba-mist">
            {(username[0] ?? '?').toUpperCase()}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function TrackPublishPanel({
  username,
  myArtistDisplayName,
  hasArtist,
  albums,
  loadingAlbums,
  pendingAlbumId,
  onPendingAlbumConsumed,
  onOpenCreateAlbum,
}: {
  username: string;
  myArtistDisplayName: string | undefined;
  hasArtist: boolean;
  albums: { id: string; title: string }[];
  loadingAlbums: boolean;
  pendingAlbumId: string | null;
  onPendingAlbumConsumed: () => void;
  onOpenCreateAlbum: () => void;
}) {
  const { data: genresFromApi } = useGetTrackGenresQuery();
  const genres = genresFromApi ?? TRACK_GENRES;
  const [createTrack, { isLoading: publishing }] = useCreateTrackMutation();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudioTrackValues>({
    resolver: zodResolver(studioTrackSchema),
    defaultValues: {
      title: '',
      artistName: myArtistDisplayName ?? username,
      description: '',
      genre: 'AFRO',
      albumMode: 'none',
      albumId: undefined,
      pricing: 'free',
      priceEuros: '',
      audio: null,
    },
  });

  const albumMode = useWatch({ control, name: 'albumMode' });
  const selectedGenre = useWatch({ control, name: 'genre' });
  const audio = useWatch({ control, name: 'audio' });
  const selectedAlbumId = useWatch({ control, name: 'albumId' });

  useEffect(() => {
    if (myArtistDisplayName) {
      setValue('artistName', myArtistDisplayName);
    }
  }, [myArtistDisplayName, setValue]);

  // 1. Retour depuis panneau album → rattacher le nouvel album
  useEffect(() => {
    if (!pendingAlbumId) {
      return;
    }
    setValue('albumMode', 'existing', { shouldValidate: true });
    setValue('albumId', pendingAlbumId, { shouldValidate: true });
    onPendingAlbumConsumed();
  }, [pendingAlbumId, setValue, onPendingAlbumConsumed]);

  const pickAudio = async () => {
    setFormError(null);
    // `audio/*` : sur Android/iOS le MIME réel d’un .m4a varie (souvent grisé
    // si on filtre trop étroit). Validation stricte après sélection.
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    const mime = asset.mimeType ?? '';
    const name = asset.name || 'audio.m4a';
    if (!isAllowedAudioMime(mime) && !isAllowedAudioName(name)) {
      setFormError(
        'Format accepté : fichier .m4a ou .aac (AAC-LC). Pas de MP3 / WAV.',
      );
      setValue('audio', null, { shouldValidate: true });
      return;
    }

    // Lire la durée locale pour CreateTrackDto.durationMs (timeline lecture)
    let durationMs: number | undefined;
    try {
      const probe = createAudioPlayer({ uri: asset.uri });
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000);
        const sub = probe.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded && status.duration > 0) {
            clearTimeout(timeout);
            sub.remove();
            durationMs = Math.round(status.duration * 1000);
            resolve();
          }
        });
      });
      probe.remove();
    } catch {
      durationMs = undefined;
    }

    // MIME client souvent wrong (octet-stream) — normaliser selon extension
    const lower = name.toLowerCase();
    const normalizedMime =
      lower.endsWith('.m4a') || lower.endsWith('.mp4')
        ? 'audio/mp4'
        : lower.endsWith('.aac')
          ? 'audio/aac'
          : mime || 'audio/mp4';

    setValue(
      'audio',
      {
        uri: asset.uri,
        name,
        mimeType: normalizedMime,
        size: asset.size,
        durationMs,
      },
      { shouldValidate: true },
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);
    setFormError(null);
    if (!hasArtist) {
      setFormError('Crée ton profil artiste avant de publier.');
      return;
    }
    if (!values.audio) {
      setFormError('Fichier audio M4A (AAC-LC) requis.');
      return;
    }

    try {
      const albumId =
        values.albumMode === 'existing' ? values.albumId : undefined;

      const formData = new FormData();
      formData.append('title', values.title.trim());
      formData.append('genre', values.genre);
      formData.append(
        'audio',
        {
          uri: values.audio.uri,
          name: values.audio.name,
          type: values.audio.mimeType,
        } as unknown as Blob,
      );
      if (albumId) {
        formData.append('albumId', albumId);
      }
      if (values.audio.durationMs) {
        formData.append('durationMs', String(values.audio.durationMs));
      }
      const price = toPrice(values);
      if (price != null) {
        formData.append('price', String(price));
      }

      const track = await createTrack(formData).unwrap();
      setFeedback(`« ${track.title} » publié.`);
      setValue('title', '');
      setValue('description', '');
      setValue('audio', null);
      setValue('albumMode', 'none');
      setValue('albumId', undefined);
    } catch (e) {
      setFormError(getErrorMessage(e, 'Publication impossible'));
    }
  });

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>☁︎↑</Text>
        <Text style={styles.heroEyebrow}>STUDIO HIMBA</Text>
        <Text style={styles.heroTitle}>Publie ton prochain son.</Text>
        <Text style={styles.heroLede}>
          Audio M4A (AAC-LC), genre, album optionnel — synchronisé avec l’API.
        </Text>
      </View>

      <View style={styles.formCard}>
        <View className="gap-2">
          <Text className="text-sm font-medium text-himba-mist">
            Fichier audio (M4A / AAC-LC)
          </Text>
          <Pressable
            onPress={() => {
              void pickAudio();
            }}
            accessibilityRole="button"
            accessibilityLabel="Choisir un fichier audio"
            style={styles.uploadBtn}
          >
            <Text style={styles.uploadIcon}>♪</Text>
            <Text style={styles.uploadLabel}>
              {audio ? audio.name : 'Choisir un fichier'}
            </Text>
          </Pressable>
          {errors.audio?.message ? (
            <Text className="text-sm text-himba-alert">
              {errors.audio.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Titre de la chanson"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.title?.message}
              placeholder="Rebelle"
            />
          )}
        />

        <Controller
          control={control}
          name="artistName"
          render={({ field: { value } }) => (
            <Input
              label="Nom de l’artiste"
              value={value}
              editable={false}
              error={errors.artistName?.message}
              placeholder="Ton nom d’artiste"
            />
          )}
        />

        <View className="gap-2">
          <Text className="text-sm font-medium text-himba-mist">Genre</Text>
          <View style={styles.chipWrap}>
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
                  accessibilityLabel={g.label}
                  style={[styles.chip, selected ? styles.chipOn : null]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      selected ? styles.chipLabelOn : null,
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
                placeholder="Raconte l’histoire de ce morceau…"
                placeholderTextColor={himbaColors.mist}
                multiline
                textAlignVertical="top"
                style={styles.description}
                accessibilityLabel="Description"
              />
            )}
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-himba-mist">Album</Text>
          <View className="flex-row flex-wrap gap-2">
            <ChoiceChip
              label="Sans album"
              selected={albumMode === 'none'}
              onPress={() => {
                setValue('albumMode', 'none', { shouldValidate: true });
                setValue('albumId', undefined);
              }}
            />
            <ChoiceChip
              label="Album existant"
              selected={albumMode === 'existing'}
              onPress={() =>
                setValue('albumMode', 'existing', { shouldValidate: true })
              }
            />
          </View>

          <Pressable
            onPress={onOpenCreateAlbum}
            accessibilityRole="button"
            accessibilityLabel="Créer un nouvel album"
          >
            <Text className="text-sm font-semibold text-himba-ember">
              + Créer un album
            </Text>
          </Pressable>

          {albumMode === 'existing' ? (
            <View className="gap-2">
              {loadingAlbums ? (
                <Text className="text-himba-mist">Chargement…</Text>
              ) : null}
              {!loadingAlbums && albums.length === 0 ? (
                <Text className="text-sm text-himba-mist">
                  Aucun album pour l’instant.
                </Text>
              ) : null}
              <View style={styles.chipWrap}>
                {albums.map((album) => {
                  const selected = selectedAlbumId === album.id;
                  return (
                    <Pressable
                      key={album.id}
                      onPress={() =>
                        setValue('albumId', album.id, {
                          shouldValidate: true,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.chip, selected ? styles.chipOn : null]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          selected ? styles.chipLabelOn : null,
                        ]}
                      >
                        {album.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.albumId?.message ? (
                <Text className="text-sm text-himba-alert">
                  {errors.albumId.message}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-himba-mist">
            Tarification
          </Text>
          <View className="flex-row gap-3">
            <ChoiceChip
              label="Gratuit"
              selected
              onPress={() =>
                setValue('pricing', 'free', { shouldValidate: true })
              }
              grow
            />
            <ChoiceChip
              label="Payant"
              selected={false}
              disabled
              onPress={() => undefined}
              grow
            />
          </View>
          <Text className="text-xs text-himba-mist">
            Le mode payant n’est pas encore disponible.
          </Text>
        </View>

        <Button
          label="Publier une musique"
          onPress={onSubmit}
          loading={publishing}
          disabled={!hasArtist || publishing}
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
      </View>
    </>
  );
}

/**
 * Panneau dédié création d’album — couverture obligatoire (multipart API).
 */
function AlbumCreatePanel({
  hasArtist,
  onCancel,
  onCreated,
}: {
  hasArtist: boolean;
  onCancel: () => void;
  onCreated: (albumId: string) => void;
}) {
  const [createAlbum, { isLoading }] = useCreateAlbumMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateAlbumValues>({
    resolver: zodResolver(createAlbumSchema),
    defaultValues: { title: '', description: '', cover: null },
  });

  const cover = useWatch({ control, name: 'cover' });

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
    if (!hasArtist) {
      setFormError('Profil artiste requis.');
      return;
    }
    if (!values.cover) {
      setFormError('Couverture requise.');
      return;
    }
    try {
      // Multipart POST /albums — champ `cover` + title / description
      const formData = new FormData();
      formData.append('title', values.title.trim());
      if (values.description?.trim()) {
        formData.append('description', values.description.trim());
      }
      formData.append(
        'cover',
        {
          uri: values.cover.uri,
          name: values.cover.name,
          type: values.cover.mimeType,
        } as unknown as Blob,
      );
      const album = await createAlbum(formData).unwrap();
      onCreated(album.id);
    } catch (e) {
      setFormError(getErrorMessage(e, 'Création d’album impossible'));
    }
  });

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>▣</Text>
        <Text style={styles.heroEyebrow}>STUDIO HIMBA</Text>
        <Text style={styles.heroTitle}>Créer un album.</Text>
        <Text style={styles.heroLede}>
          Couverture obligatoire — ensuite rattache tes titres à l’album.
        </Text>
      </View>

      <View style={styles.formCard}>
        <View className="gap-2">
          <Text className="text-sm font-medium text-himba-mist">
            Couverture
          </Text>
          <Pressable
            onPress={() => {
              void pickCover();
            }}
            accessibilityRole="button"
            accessibilityLabel="Choisir une couverture"
            style={styles.coverBtn}
          >
            {cover ? (
              <Image
                source={{ uri: cover.uri }}
                style={styles.coverPreview}
                contentFit="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderIcon}>＋</Text>
                <Text style={styles.coverPlaceholderLabel}>
                  Ajouter une couverture
                </Text>
              </View>
            )}
          </Pressable>
          {errors.cover?.message ? (
            <Text className="text-sm text-himba-alert">
              {errors.cover.message}
            </Text>
          ) : null}
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
              placeholder="Premier EP"
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
                style={styles.description}
                accessibilityLabel="Description de l’album"
              />
            )}
          />
        </View>

        <Button
          label="Créer l’album"
          onPress={onSubmit}
          loading={isLoading}
          disabled={!hasArtist || isLoading}
        />

        {formError ? (
          <Text className="text-center text-sm text-himba-alert">
            {formError}
          </Text>
        ) : null}

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Retour à la publication"
        >
          <Text className="text-center font-semibold text-himba-mist">
            Retour au titre
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
  grow = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  grow?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[
        grow ? styles.pricingBtn : styles.modeBtn,
        selected ? styles.pricingBtnOn : null,
        disabled ? styles.pricingBtnDisabled : null,
      ]}
    >
      <Text
        style={[
          grow ? styles.pricingLabel : styles.modeLabel,
          selected ? styles.pricingLabelOn : null,
          disabled ? styles.pricingLabelDisabled : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    backgroundColor: himbaColors.ember,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 8,
  },
  heroIcon: {
    fontSize: 22,
    color: himbaColors.ink,
    marginBottom: 4,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(245,240,255,0.9)',
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  heroLede: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(245,240,255,0.88)',
  },
  formCard: {
    gap: 16,
    borderRadius: 24,
    backgroundColor: himbaColors.earth,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  uploadBtn: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: himbaColors.ember,
    borderStyle: 'dashed',
    backgroundColor: himbaColors.night,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    fontSize: 22,
    color: himbaColors.ember,
  },
  uploadLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: himbaColors.ink,
  },
  coverBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: himbaColors.ember,
    borderStyle: 'dashed',
    backgroundColor: himbaColors.night,
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 1,
  },
  coverPlaceholder: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  coverPlaceholderIcon: {
    fontSize: 28,
    color: himbaColors.ember,
  },
  coverPlaceholderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: himbaColors.mist,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,240,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    borderColor: himbaColors.ember,
    backgroundColor: 'rgba(255,102,0,0.2)',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: himbaColors.mist,
  },
  chipLabelOn: {
    color: himbaColors.ink,
  },
  description: {
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: himbaColors.canopy,
    backgroundColor: himbaColors.night,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: himbaColors.ink,
  },
  modeBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,240,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: himbaColors.mist,
  },
  pricingBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,240,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pricingBtnOn: {
    borderColor: himbaColors.ember,
    backgroundColor: 'rgba(255,102,0,0.2)',
  },
  pricingBtnDisabled: {
    opacity: 0.4,
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: himbaColors.mist,
  },
  pricingLabelOn: {
    color: himbaColors.ink,
  },
  pricingLabelDisabled: {
    color: himbaColors.mist,
  },
});
