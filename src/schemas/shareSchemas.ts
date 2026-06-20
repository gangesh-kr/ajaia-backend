import { z } from 'zod';

export const createShareSchema = z.object({
  document_id: z.string().uuid('Invalid document_id UUID format'),
  user_id: z.string().uuid('Invalid user_id UUID format'),
  role: z.enum(['viewer', 'editor']).default('viewer')
});
export type CreateShareInput = z.infer<typeof createShareSchema>;
