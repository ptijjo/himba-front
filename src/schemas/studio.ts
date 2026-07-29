import { z } from 'zod';

import { trackGenreSchema } from '@/schemas/genres';

export const trackPricingSchema = z.enum(['free', 'paid']);

/** Fichier audio local (DocumentPicker) — M4A AAC-LC recommandé (API sniffe le conteneur). */
export const audioFileSchema = z.object({
  uri: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().optional(),
  /** Durée lue localement (ms) → CreateTrackDto.durationMs */
  durationMs: z.number().int().positive().optional(),
});

/**
 * Formulaire Studio titre — CreateTrackDto + multipart audio.
 * Création d’album = panneau dédié (createAlbumSchema), pas ce formulaire.
 */
export const studioTrackSchema = z
  .object({
    title: z.string().min(1, 'Titre requis').max(200),
    artistName: z.string().min(1, 'Nom d’artiste requis').max(80),
    description: z.string().max(1000).optional(),
    genre: trackGenreSchema,
    albumMode: z.enum(['none', 'existing']),
    albumId: z.string().optional(),
    pricing: trackPricingSchema,
    priceEuros: z.string().optional(),
    audio: audioFileSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.audio) {
      ctx.addIssue({
        code: 'custom',
        message: 'Fichier audio AAC / M4A requis',
        path: ['audio'],
      });
    }

    if (data.albumMode === 'existing' && !data.albumId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Choisis un album',
        path: ['albumId'],
      });
    }

    if (data.pricing !== 'paid') {
      return;
    }
    const raw = data.priceEuros?.trim() ?? '';
    if (!raw) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique un prix',
        path: ['priceEuros'],
      });
      return;
    }
    const euros = Number(raw.replace(',', '.'));
    if (!Number.isFinite(euros) || euros <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Prix invalide',
        path: ['priceEuros'],
      });
      return;
    }
    const cents = Math.round(euros * 100);
    if (cents < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Prix trop bas',
        path: ['priceEuros'],
      });
    }
  });

/**
 * Formulaire édition titre — UpdateTrackDto (JSON, pas de remplacement audio).
 */
export const updateTrackSchema = z
  .object({
    title: z.string().min(1, 'Titre requis').max(200),
    genre: trackGenreSchema,
    pricing: trackPricingSchema,
    priceEuros: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricing !== 'paid') {
      return;
    }
    const raw = data.priceEuros?.trim() ?? '';
    if (!raw) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique un prix',
        path: ['priceEuros'],
      });
      return;
    }
    const euros = Number(raw.replace(',', '.'));
    if (!Number.isFinite(euros) || euros <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Prix invalide',
        path: ['priceEuros'],
      });
    }
  });

export type StudioTrackValues = z.infer<typeof studioTrackSchema>;
export type UpdateTrackValues = z.infer<typeof updateTrackSchema>;
export type TrackPricing = z.infer<typeof trackPricingSchema>;
export type AudioFileValue = z.infer<typeof audioFileSchema>;

export function toPrice(values: StudioTrackValues): number | null {
  if (values.pricing === 'free') {
    return null;
  }
  const euros = Number((values.priceEuros ?? '').replace(',', '.'));
  return Math.round(euros * 100) / 100;
}

export function toUpdateTrackPrice(values: UpdateTrackValues): number | null {
  if (values.pricing === 'free') {
    return null;
  }
  const euros = Number((values.priceEuros ?? '').replace(',', '.'));
  return Math.round(euros * 100) / 100;
}

const ALLOWED_AUDIO_MIME = new Set([
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
]);

export function isAllowedAudioMime(mime: string | undefined): boolean {
  if (!mime) {
    return false;
  }
  // octet-stream : ne pas faire confiance au MIME — l’extension doit valider
  return ALLOWED_AUDIO_MIME.has(mime.toLowerCase());
}

export function isAllowedAudioName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith('.aac') ||
    lower.endsWith('.m4a') ||
    lower.endsWith('.mp4')
  );
}
