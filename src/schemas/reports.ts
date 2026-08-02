import { z } from 'zod';

export const reportTargetTypeSchema = z.enum(['TRACK', 'ARTIST', 'USER']);
export const reportReasonSchema = z.enum([
  'INAPPROPRIATE_CONTENT',
  'FRAUD_SCAM',
  'IMPERSONATION',
  'SPAM',
  'COPYRIGHT',
  'OTHER',
]);

export const createReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.string().min(1).max(64),
  reason: reportReasonSchema,
  details: z.string().max(500).optional(),
});

export const reportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  targetType: reportTargetTypeSchema,
  targetId: z.string(),
  reason: reportReasonSchema,
  details: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
  createdAt: z.union([z.string(), z.coerce.date()]),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type CreateReportValues = z.infer<typeof createReportSchema>;
export type AppReport = z.infer<typeof reportSchema>;

export const REPORT_REASON_OPTIONS: Array<{
  value: ReportReason;
  label: string;
}> = [
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Contenu inapproprié (cover, photo, texte…)',
  },
  { value: 'FRAUD_SCAM', label: 'Fraude / arnaque' },
  { value: 'IMPERSONATION', label: 'Usurpation d’identité' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'COPYRIGHT', label: 'Droits d’auteur' },
  { value: 'OTHER', label: 'Autre' },
];
