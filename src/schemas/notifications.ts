import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'TRACK_RELEASE',
  'ALBUM_RELEASE',
  'NEW_FOLLOWER',
  'REPORT_UPDATE',
  'REPORT_SANCTION',
  'REPORT_CREATED',
]);

export const reportStatusSchema = z.enum([
  'OPEN',
  'REVIEWING',
  'RESOLVED',
  'DISMISSED',
]);

export const reportTargetTypeSchema = z.enum([
  'TRACK',
  'ALBUM',
  'ARTIST',
  'USER',
]);

export const reportReasonSchema = z.enum([
  'INAPPROPRIATE_CONTENT',
  'FRAUD_SCAM',
  'IMPERSONATION',
  'SPAM',
  'COPYRIGHT',
  'OTHER',
]);

export const notificationDataSchema = z.object({
  artistId: z.string().optional(),
  trackId: z.string().optional(),
  albumId: z.string().optional(),
  followerId: z.string().optional(),
  followerUsername: z.string().optional(),
  reportId: z.string().optional(),
  reportStatus: reportStatusSchema.optional(),
  targetType: reportTargetTypeSchema.optional(),
  targetId: z.string().optional(),
  reason: reportReasonSchema.optional(),
  sanction: z
    .enum(['WARNING', 'CONTENT_REMOVED', 'RESTRICTED', 'BANNED'])
    .optional(),
  audience: z.enum(['reporter', 'target', 'admin']).optional(),
});

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: notificationDataSchema,
  readAt: z.union([z.string(), z.coerce.date(), z.null()]).optional(),
  createdAt: z.union([z.string(), z.coerce.date()]),
});

export const notificationListSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().nullable(),
});

export const upsertPushTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['android', 'ios']),
});

export const deletePushTokenSchema = z.object({
  token: z.string().min(10),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationData = z.infer<typeof notificationDataSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
export type UpsertPushTokenValues = z.infer<typeof upsertPushTokenSchema>;
