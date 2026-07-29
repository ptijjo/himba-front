import {
  isAllowedAudioMime,
  isAllowedAudioName,
  normalizeAudioUploadMime,
  studioTrackSchema,
  toPrice,
  toUpdateTrackPrice,
  updateTrackSchema,
} from '@/schemas/studio';

const baseAudio = {
  uri: 'file:///tmp/song.m4a',
  name: 'song.m4a',
  mimeType: 'audio/mp4',
};

describe('studioTrackSchema', () => {
  it('accepte un titre gratuit avec audio et genre', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      description: 'Une histoire',
      genre: 'AFRO',
      albumMode: 'none',
      pricing: 'free',
      audio: baseAudio,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toPrice(parsed.data)).toBeNull();
    }
  });

  it('refuse sans fichier audio', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'RAP',
      albumMode: 'none',
      pricing: 'free',
      audio: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('exige un albumId en mode existing', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'RAP',
      albumMode: 'existing',
      pricing: 'free',
      audio: baseAudio,
    });
    expect(parsed.success).toBe(false);
  });

  it('refuse le mode new (création album hors formulaire titre)', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'ZOUK',
      albumMode: 'new',
      pricing: 'free',
      audio: baseAudio,
    });
    expect(parsed.success).toBe(false);
  });

  it('exige un prix si payant', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'POP',
      albumMode: 'none',
      pricing: 'paid',
      priceEuros: '',
      audio: baseAudio,
    });
    expect(parsed.success).toBe(false);
  });

  it('convertit le prix en euros', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'POP',
      albumMode: 'none',
      pricing: 'paid',
      priceEuros: '1,99',
      audio: baseAudio,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toPrice(parsed.data)).toBe(1.99);
    }
  });
});

describe('updateTrackSchema', () => {
  it('accepte une édition gratuite sans audio', () => {
    const parsed = updateTrackSchema.safeParse({
      title: 'Rebelle remix',
      genre: 'AFRO',
      pricing: 'free',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toUpdateTrackPrice(parsed.data)).toBeNull();
    }
  });

  it('exige un prix si payant', () => {
    const parsed = updateTrackSchema.safeParse({
      title: 'Rebelle',
      genre: 'RAP',
      pricing: 'paid',
      priceEuros: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('convertit le prix payant', () => {
    const parsed = updateTrackSchema.safeParse({
      title: 'Rebelle',
      genre: 'RAP',
      pricing: 'paid',
      priceEuros: '2.50',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toUpdateTrackPrice(parsed.data)).toBe(2.5);
    }
  });
});

describe('audio formats (M4A / AAC / MP3)', () => {
  it('accepte MIME et extensions API', () => {
    expect(isAllowedAudioMime('audio/mpeg')).toBe(true);
    expect(isAllowedAudioMime('audio/mp3')).toBe(true);
    expect(isAllowedAudioMime('audio/mp4')).toBe(true);
    expect(isAllowedAudioMime('audio/wav')).toBe(false);
    expect(isAllowedAudioName('song.mp3')).toBe(true);
    expect(isAllowedAudioName('song.m4a')).toBe(true);
    expect(isAllowedAudioName('song.wav')).toBe(false);
  });

  it('normalise le MIME upload selon l’extension', () => {
    expect(normalizeAudioUploadMime('hit.mp3', 'application/octet-stream')).toBe(
      'audio/mpeg',
    );
    expect(normalizeAudioUploadMime('hit.m4a', '')).toBe('audio/mp4');
    expect(normalizeAudioUploadMime('hit.aac', 'audio/aac')).toBe('audio/aac');
  });

  it('accepte un titre studio avec fichier mp3', () => {
    const parsed = studioTrackSchema.safeParse({
      title: 'Rebelle',
      artistName: 'FOFO',
      genre: 'AFRO',
      albumMode: 'none',
      pricing: 'free',
      audio: {
        uri: 'file:///tmp/song.mp3',
        name: 'song.mp3',
        mimeType: 'audio/mpeg',
      },
    });
    expect(parsed.success).toBe(true);
  });
});
