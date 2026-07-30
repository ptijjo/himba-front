import { pickNextInQueue, pickPrevInQueue } from '@/lib/player/queueNavigation';

describe('queueNavigation', () => {
  const tracks = [
    { id: 'a', title: 'A', artistId: 'x' },
    { id: 'b', title: 'B', artistId: 'x' },
    { id: 'c', title: 'C', artistId: 'x' },
  ];

  it('pickNextInQueue enchaîne puis s’arrête', () => {
    expect(
      pickNextInQueue(tracks, 'a', { shuffle: false, repeatMode: 'off' })?.id,
    ).toBe('b');
    expect(
      pickNextInQueue(tracks, 'c', { shuffle: false, repeatMode: 'off' }),
    ).toBeNull();
    expect(
      pickNextInQueue(tracks, 'c', { shuffle: false, repeatMode: 'all' })?.id,
    ).toBe('a');
  });

  it('pickPrevInQueue remonte la file', () => {
    expect(
      pickPrevInQueue(tracks, 'b', { shuffle: false, repeatMode: 'off' })?.id,
    ).toBe('a');
    expect(
      pickPrevInQueue(tracks, 'a', { shuffle: false, repeatMode: 'all' })?.id,
    ).toBe('c');
  });
});
