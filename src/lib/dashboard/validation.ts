import { z } from 'zod';

// A MatrimonialProfile id — always resolved server-side to the owning User
// before any write happens. Bounded length guards against abusive payloads.
export const profileIdSchema = z.string().trim().min(1).max(64);

export const sendInterestSchema = z.object({
  profileId: profileIdSchema,
  message: z.string().trim().max(300).optional(),
});

export const respondInterestSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'WITHDRAW']),
});

export const shortlistAddSchema = z.object({
  profileId: profileIdSchema,
});

export const shortlistRemoveSchema = z
  .object({
    profileId: profileIdSchema.optional(),
    shortlistId: profileIdSchema.optional(),
  })
  .refine((d) => Boolean(d.profileId || d.shortlistId), {
    message: 'profileId or shortlistId is required',
  });

export const markAllNotificationsSchema = z.object({
  action: z.literal('MARK_ALL_READ'),
});
