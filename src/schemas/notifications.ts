import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'TRACK_RELEASE',
  'ALBUM_RELEASE',
]);

export const notificationDataSchema = z.object({
  artistId: z.string(),
  trackId: z.string().optional(),
  albumId: z.string().optional(),
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
