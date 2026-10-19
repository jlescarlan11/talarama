import { z } from 'zod';
import { isTimeZone } from '@/app/lib/diary/dates';
export const reservedUsernames = new Set(['admin','api','me','settings','support']);
export const usernameSchema = z.string().trim().toLowerCase().min(3).max(20).regex(/^[a-z0-9_]+$/).refine(value=>!reservedUsernames.has(value), 'This handle is reserved');
export const profileSchema = z.object({
 username: usernameSchema,
 name: z.string().trim().min(1).max(80),
 bio: z.string().trim().max(300),
 timeZone: z.string().refine(isTimeZone, 'Choose a valid IANA timezone'),
 profilePublished: z.boolean(),
 showFavorites: z.boolean(),
}).strict();
export type ProfileInput = z.infer<typeof profileSchema>;
