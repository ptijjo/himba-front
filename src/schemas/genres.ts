/**
 * Genres catalogue — miroir enum Prisma TrackGenre / GET /tracks/genres.
 */
import { z } from 'zod';

export const trackGenreSchema = z.enum([
  'RAP',
  'AFRO',
  'ZOUK',
  'SHATTA',
  'COUPE_DECALE',
  'DANCEHALL',
  'RNB',
  'POP',
  'GOSPEL',
  'REGGAE',
  'KOMPA',
  'OTHER',
]);

export const trackGenreOptionSchema = z.object({
  id: trackGenreSchema,
  label: z.string(),
});

export const trackGenresListSchema = z.array(trackGenreOptionSchema);

export type TrackGenre = z.infer<typeof trackGenreSchema>;
export type TrackGenreOption = z.infer<typeof trackGenreOptionSchema>;

/** Libellés UI (fallback si GET /tracks/genres indispo). */
export const TRACK_GENRE_LABELS: Record<TrackGenre, string> = {
  RAP: 'Rap',
  AFRO: 'Afro',
  ZOUK: 'Zouk',
  SHATTA: 'Shatta',
  COUPE_DECALE: 'Coupé-décalé',
  DANCEHALL: 'Dancehall',
  RNB: 'R&B',
  POP: 'Pop',
  GOSPEL: 'Gospel',
  REGGAE: 'Reggae',
  KOMPA: 'Kompa',
  OTHER: 'Autre',
};

export const TRACK_GENRES: TrackGenreOption[] = trackGenreSchema.options.map(
  (id) => ({ id, label: TRACK_GENRE_LABELS[id] }),
);
