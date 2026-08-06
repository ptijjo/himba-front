import { z } from 'zod';

import {
  isPriceInAllowedRange,
  parsePriceEurosInput,
  TRACK_PRICE_MAX_EUROS,
  TRACK_PRICE_MIN_EUROS,
} from '@/constants/pricing';
import { trackGenreSchema } from '@/schemas/genres';

function refinePaidPrice(
  priceEuros: string | undefined,
  ctx: z.RefinementCtx,
): void {
  const raw = priceEuros?.trim() ?? '';
  if (!raw) {
    ctx.addIssue({
      code: 'custom',
      message: 'Indique un prix',
      path: ['priceEuros'],
    });
    return;
  }
  const euros = parsePriceEurosInput(raw);
  if (euros == null || euros <= 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Prix invalide',
      path: ['priceEuros'],
    });
    return;
  }
  if (!isPriceInAllowedRange(euros)) {
    ctx.addIssue({
      code: 'custom',
      message: `Prix entre ${TRACK_PRICE_MIN_EUROS.toFixed(2)} et ${TRACK_PRICE_MAX_EUROS.toFixed(2)} €`,
      path: ['priceEuros'],
    });
  }
}

export const trackPricingSchema = z.enum(['free', 'paid']);

/** Image locale (ImagePicker) — JPEG / PNG / WebP. */
export const trackCoverFileSchema = z.object({
  uri: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
});

/** Fichier audio local (DocumentPicker) — M4A / AAC / MP3 (API sniffe le conteneur). */
export const audioFileSchema = z.object({
  uri: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().optional(),
  /** Durée lue localement (ms) → CreateTrackDto.durationMs */
  durationMs: z.number().int().positive().optional(),
});

/**
 * Formulaire Studio titre — CreateTrackDto + multipart audio (+ cover si hors album).
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
    /** Cover titre — obligatoire si hors album (API). */
    cover: trackCoverFileSchema.nullable(),
    pricing: trackPricingSchema,
    priceEuros: z.string().optional(),
    audio: audioFileSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.audio) {
      ctx.addIssue({
        code: 'custom',
        message: 'Fichier audio M4A / AAC / MP3 requis',
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

    // Single hors album : cover obligatoire (miroir tracks.service API)
    if (data.albumMode === 'none' && !data.cover) {
      ctx.addIssue({
        code: 'custom',
        message: 'Image de couverture requise',
        path: ['cover'],
      });
    }

    if (data.pricing === 'paid') {
      refinePaidPrice(data.priceEuros, ctx);
    }
  });

/**
 * Formulaire édition titre — UpdateTrackDto (+ cover multipart optionnelle).
 */
export const updateTrackSchema = z
  .object({
    title: z.string().min(1, 'Titre requis').max(200),
    genre: trackGenreSchema,
    pricing: trackPricingSchema,
    priceEuros: z.string().optional(),
    /** Nouvelle cover locale — omit / null = conserver l’existante. */
    cover: trackCoverFileSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricing === 'paid') {
      refinePaidPrice(data.priceEuros, ctx);
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
  return parsePriceEurosInput(values.priceEuros ?? '');
}

export function toUpdateTrackPrice(values: UpdateTrackValues): number | null {
  if (values.pricing === 'free') {
    return null;
  }
  return parsePriceEurosInput(values.priceEuros ?? '');
}

/** Aligné sur himba-api `ALLOWED_AUDIO_MIME` (+ sniffe magic bytes côté serveur). */
const ALLOWED_AUDIO_MIME = new Set([
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mpeg',
  'audio/mp3',
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
    lower.endsWith('.mp4') ||
    lower.endsWith('.mp3')
  );
}

/** MIME multipart à envoyer — miroir normalisations API / storage. */
export function normalizeAudioUploadMime(
  name: string,
  mime: string | undefined,
): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) {
    return 'audio/mp4';
  }
  if (lower.endsWith('.aac')) {
    return 'audio/aac';
  }
  if (lower.endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  const normalized = (mime ?? '').toLowerCase();
  if (ALLOWED_AUDIO_MIME.has(normalized)) {
    return normalized;
  }
  return 'audio/mp4';
}
