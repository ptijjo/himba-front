/**
 * Signalements — POST /reports (auth).
 */
import {
  createReportSchema,
  reportSchema,
  type AppReport,
  type CreateReportValues,
} from '@/schemas/reports';
import { baseApi } from '@/store/api/baseApi';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createReport: build.mutation<AppReport, CreateReportValues>({
      query: (body) => ({
        url: '/reports',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const parsed = reportSchema.safeParse(response);
        if (!parsed.success) {
          throw new Error('Réponse signalement invalide');
        }
        return parsed.data;
      },
      async onQueryStarted(arg, { queryFulfilled }) {
        createReportSchema.parse(arg);
        await queryFulfilled;
      },
    }),
  }),
});

export const { useCreateReportMutation } = reportsApi;
