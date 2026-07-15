import { z } from "zod";

export const errorResponseSchema = z.object({
  reason: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
