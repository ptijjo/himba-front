import { paymentIntentResponseSchema } from '@/schemas/payments';

describe('schemas/payments', () => {
  it('parse une intent titre', () => {
    const parsed = paymentIntentResponseSchema.safeParse({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test',
      amount: '1.99',
      kind: 'track',
    });
    expect(parsed.success).toBe(true);
  });

  it('refuse sans clientSecret', () => {
    const parsed = paymentIntentResponseSchema.safeParse({
      paymentIntentId: 'pi_test',
      amount: '1.99',
      kind: 'track',
    });
    expect(parsed.success).toBe(false);
  });
});
