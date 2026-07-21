import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type DatedData, datedDataSchema } from "./DatedData";
import type { User } from "./User";
import { type Version, versionSchema } from "./Version";

export interface ProjectRatings {
  average: number;
  count: number;
}

export const projectRatingsSchema = z
  .object({
    average: z.number(),
    count: z.number(),
  })
  .describe("Average rating and number of ratings for this app.");

__tsCheckSame<
  ProjectRatings,
  ProjectRatings,
  z.infer<typeof projectRatingsSchema>
>(true);

export interface ProjectCore {
  slug: string;
  idp_user_id: User["idp_user_id"];
  latest_revision?: null | number; // Latest revision number of the project
}

export interface ProjectDetails extends ProjectCore, DatedData {
  version: Version;
  ratings?: ProjectRatings;
  // author?: null | { name: string }; // TODO
  // states?: Array<ProjectStatusOnBadge>;|null
  // votes?: Array<VoteFromUser>;|null
  // warnings?: Array<WarningFromUser>;|null
  // collaborators?: Array<User>;|null
}

export type ProjectSlug = ProjectDetails["slug"];

export const projectCoreSchema = z.object({
  slug: z.string(),
  idp_user_id: z.string(),
  latest_revision: z.number().optional().nullable(),
});

export const detailedProjectSchema = projectCoreSchema
  .extend({
    version: versionSchema,
    ratings: projectRatingsSchema
      .optional()
      .describe("Average rating and number of ratings for this app."),
    // author: z.object({ name: z.string() }).optional().nullable(),
  })
  .extend(datedDataSchema.shape);

__tsCheckSame<
  ProjectDetails,
  ProjectDetails,
  z.infer<typeof detailedProjectSchema>
>(true);
