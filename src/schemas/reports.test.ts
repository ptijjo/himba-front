import {
  createReportSchema,
  reportSchema,
  REPORT_REASON_OPTIONS,
} from '@/schemas/reports';

describe('schemas/reports', () => {
  it('createReportSchema valide', () => {
    const parsed = createReportSchema.safeParse({
      targetType: 'TRACK',
      targetId: 't1',
      reason: 'SPAM',
    });
    expect(parsed.success).toBe(true);
  });

  it('refuse details trop longs', () => {
    const parsed = createReportSchema.safeParse({
      targetType: 'USER',
      targetId: 'u1',
      reason: 'OTHER',
      details: 'x'.repeat(501),
    });
    expect(parsed.success).toBe(false);
  });

  it('reportSchema + options FR', () => {
    const parsed = reportSchema.safeParse({
      id: 'r1',
      reporterId: 'u1',
      targetType: 'ARTIST',
      targetId: 'a1',
      reason: 'FRAUD_SCAM',
      details: null,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
    expect(REPORT_REASON_OPTIONS.length).toBe(6);
  });
});
