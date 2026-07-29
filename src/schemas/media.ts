import { z } from 'zod';

export const signedUrlSchema = z.object({
  url: z.string().min(1),
  expiresInSeconds: z.number(),
});

export type SignedUrl = z.infer<typeof signedUrlSchema>;
