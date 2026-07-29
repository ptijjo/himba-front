/**
 * Tokens couleurs Himba — alignés sur la maquette home (nuit pourpre, accent corail).
 * Référence unique avec tailwind.config.js (classes himba-*).
 */
export const himbaColors = {
  night: '#0B0618',
  surface: '#161022',
  earth: '#1E1730',
  ember: '#FF6600',
  saffron: '#F0B429',
  ochre: '#8B6B4A',
  copper: '#C4845A',
  pulse: '#FF7A1A',
  alert: '#E83A4A',
  ink: '#F5F0FF',
  mist: '#A39BB8',
  canopy: '#2A1F3D',
  glass: 'rgba(22, 16, 34, 0.72)',
  white: '#FFFFFF',
  ptah: '#FF6600',
  /** Accent lecteur (play / repeat actif) — maquette contrôles */
  player: '#7C6BFF',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Images décoratives (covers / hero) — pas de vidéos embarquées. */
export const homeMedia = {
  heroConcert:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
  selectionAbstract:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
} as const;
