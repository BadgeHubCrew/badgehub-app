import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

export interface ProjectUserRating {
  rating: number;
}

export const projectUserRatingSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
  })
  .describe("The authenticated user's rating for this app.");

__tsCheckSame<
  ProjectUserRating,
  ProjectUserRating,
  z.infer<typeof projectUserRatingSchema>
>(true);
