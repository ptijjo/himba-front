import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LibrarySections } from '@/components/library/LibrarySections';

/**
 * Bibliothèque — Coups de cœur, playlists, albums aimés, artistes suivis.
 * Point d’entrée de l’onglet Musique ; le lecteur s’ouvre via le mini-lecteur.
 */
export default function BibliothequeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <LibrarySections />
      </ScrollView>
    </SafeAreaView>
  );
}
