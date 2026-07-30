import { router, type Href } from 'expo-router';

/** Ouvre l’onglet Musique (lecteur cover + file). */
export function openLecturePlayer(): void {
  router.push('/(app)/(tabs)/library' as Href);
}
