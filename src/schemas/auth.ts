/**
 * Schémas Zod auth — miroir himba-api (AuthLoginResponse, AuthTokensResponse, User).
 */
import { z } from 'zod';

export const userRoleSchema = z.enum(['LISTENER', 'ARTIST', 'ADMIN']);
export const userStatusSchema = z.enum(['ACTIVE', 'RESTRICTED', 'BANNED']);

export const authUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.union([z.string(), z.coerce.date()]).transform((v) =>
    typeof v === 'string' ? v : v.toISOString(),
  ),
  updatedAt: z.union([z.string(), z.coerce.date()]).transform((v) =>
    typeof v === 'string' ? v : v.toISOString(),
  ),
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const authLoginResponseSchema = authTokensSchema.extend({
  sessionId: z.string().min(1),
  user: authUserSchema,
});

export const loginFormSchema = z.object({
  login: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Au moins 3 caractères')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et underscore uniquement'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .max(72)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Au moins une lettre et un chiffre'),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
