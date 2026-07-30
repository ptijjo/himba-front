import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LibrarySections } from '@/components/library/LibrarySections';

/**
 * Bibliothèque — playlists, favoris, artistes suivis.
 * Onglet caché (href: null) pour garder footer + mini-lecteur.
 * Accès depuis Lecture → « Bibliothèque ».
 */
export default function BibliothequeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] font-semibold tracking-[2px] text-himba-mist">
          TA MUSIQUE
        </Text>
        <Text
          className="text-3xl text-himba-ink"
          style={{ fontFamily: 'Literata_700Bold' }}
        >
          Bibliothèque
        </Text>
        <Text className="text-himba-mist">
          Playlists, favoris et artistes suivis.
        </Text>

        <LibrarySections />
      </ScrollView>
    </SafeAreaView>
  );
}
