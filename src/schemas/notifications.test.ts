import {
  notificationListSchema,
  notificationSchema,
  upsertPushTokenSchema,
} from '@/schemas/notifications';

describe('schemas/notifications', () => {
  it('parse une notification TRACK_RELEASE', () => {
    const parsed = notificationSchema.safeParse({
      id: 'n1',
      userId: 'u1',
      type: 'TRACK_RELEASE',
      title: 'Sortie',
      body: 'Nouveau titre',
      data: { artistId: 'a1', trackId: 't1' },
      readAt: null,
      createdAt: '2026-07-30T10:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
  });

  it('parse une notification NEW_FOLLOWER', () => {
    const parsed = notificationSchema.safeParse({
      id: 'n2',
      userId: 'artist-user',
      type: 'NEW_FOLLOWER',
      title: 'Nouveau follower',
      body: 'marie a commencé à te suivre',
      data: {
        artistId: 'a1',
        followerId: 'u2',
        followerUsername: 'marie',
      },
      readAt: null,
      createdAt: '2026-08-01T10:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
  });

  it('parse une notification REPORT_UPDATE', () => {
    const parsed = notificationSchema.safeParse({
      id: 'n3',
      userId: 'u1',
      type: 'REPORT_UPDATE',
      title: 'Signalement traité',
      body: 'Ton signalement a été traité.',
      data: {
        reportId: 'r1',
        reportStatus: 'RESOLVED',
        targetType: 'TRACK',
        targetId: 't1',
        reason: 'SPAM',
      },
      readAt: null,
      createdAt: '2026-08-05T10:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejette un type inconnu', () => {
    const parsed = notificationSchema.safeParse({
      id: 'n1',
      userId: 'u1',
      type: 'OTHER',
      title: 'x',
      body: 'y',
      data: { artistId: 'a1' },
      createdAt: '2026-07-30T10:00:00.000Z',
    });
    expect(parsed.success).toBe(false);
  });

  it('parse une page cursor', () => {
    const parsed = notificationListSchema.safeParse({
      items: [],
      nextCursor: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('valide upsert push token', () => {
    expect(
      upsertPushTokenSchema.safeParse({
        token: 'ExponentPushToken[xxxxxx]',
        platform: 'android',
      }).success,
    ).toBe(true);
  });
});
