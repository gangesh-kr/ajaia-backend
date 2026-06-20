import { z } from 'zod';

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  content_json: z.string().nullable().optional()
});
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
