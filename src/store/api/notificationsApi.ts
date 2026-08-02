/**
 * Endpoints notifications + tokens push Expo.
 */
import {
  notificationListSchema,
  notificationSchema,
  type AppNotification,
  type UpsertPushTokenValues,
} from '@/schemas/notifications';
import { baseApi } from '@/store/api/baseApi';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<
      { items: AppNotification[]; nextCursor: string | null },
      { cursor?: string; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.cursor) {
          params.set('cursor', args.cursor);
        }
        if (args?.limit != null) {
          params.set('limit', String(args.limit));
        }
        const qs = params.toString();
        return qs ? `/notifications?${qs}` : '/notifications';
      },
      providesTags: ['Notifications'],
      transformResponse: (response: unknown) => {
        const parsed = notificationListSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Notifications invalides');
        }
        return parsed.data;
      },
    }),
    markNotificationRead: build.mutation<AppNotification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
      transformResponse: (response: unknown) => {
        const parsed = notificationSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Notification invalide');
        }
        return parsed.data;
      },
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: build.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteAllNotifications: build.mutation<{ deleted: number }, void>({
      query: () => ({
        url: '/notifications/all',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),
    upsertPushToken: build.mutation<unknown, UpsertPushTokenValues>({
      query: (body) => ({
        url: '/devices/push-token',
        method: 'POST',
        body,
      }),
    }),
    deletePushToken: build.mutation<void, string>({
      query: (token) => ({
        url: '/devices/push-token',
        method: 'DELETE',
        body: { token },
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useUpsertPushTokenMutation,
  useDeletePushTokenMutation,
} = notificationsApi;
