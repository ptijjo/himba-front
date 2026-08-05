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

const strongPasswordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .max(72)
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Au moins un symbole');

export const registerFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Au moins 3 caractères')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et underscore uniquement'),
  email: z.string().email('Email invalide'),
  password: strongPasswordSchema,
});

export const registerPendingResponseSchema = z.object({
  message: z.string().min(1),
  email: z.string().email(),
});
export const authMessageResponseSchema = z.object({
  message: z.string().min(1),
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().email('Email invalide'),
});

/** PATCH /users/me — nouveau pseudo (unique). */
export const changeUsernameFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Au moins 3 caractères')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et underscore uniquement'),
});

/** POST /auth/change-password */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Le nouveau mot de passe doit être différent',
    path: ['newPassword'],
  });

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>;
export type RegisterPendingResponse = z.infer<
  typeof registerPendingResponseSchema
>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ChangeUsernameFormValues = z.infer<typeof changeUsernameFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
