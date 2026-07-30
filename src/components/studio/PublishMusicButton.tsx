import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { useAppSelector } from '@/store';

type PublishMusicButtonProps = {
  /** Compact = pastille header ; full = bouton large */
  variant?: 'compact' | 'full';
};

/**
 * CTA publication — visible seulement pour ARTIST / ADMIN.
 */
export function PublishMusicButton({
  variant = 'full',
}: PublishMusicButtonProps) {
  const role = useAppSelector((s) => s.auth.user?.role);

  if (!canPublishMusic(role)) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/studio')}
        accessibilityRole="button"
        accessibilityLabel="Publier une musique"
        className="h-10 min-w-[44px] items-center justify-center rounded-full bg-himba-ember px-3"
      >
        <Text className="text-lg font-bold text-himba-ink">＋</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push('/(app)/(tabs)/studio')}
      accessibilityRole="button"
      accessibilityLabel="Publier une musique"
      className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-pill bg-himba-ember px-6"
    >
      <Text className="text-base font-bold text-himba-ink">
        Publier une musique
      </Text>
    </Pressable>
  );
}

/** Carte rappel Studio — ARTIST / ADMIN. */
export function PublishMusicCard() {
  const role = useAppSelector((s) => s.auth.user?.role);

  if (!canPublishMusic(role)) {
    return null;
  }

  return (
    <View className="gap-3 rounded-card bg-himba-earth p-4">
      <Text className="text-[11px] font-bold tracking-[2px] text-himba-ember">
        STUDIO HIMBA
      </Text>
      <Text className="text-lg font-bold text-himba-ink">
        Publie ton prochain son
      </Text>
      <Text className="text-sm text-himba-mist">
        Titre gratuit ou payant — réservé aux artistes et admins.
      </Text>
      <PublishMusicButton />
    </View>
  );
}
