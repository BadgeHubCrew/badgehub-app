import { Version, versionSchema } from "./Version";
import { User } from "./User";
import { DatedData, datedDataSchema } from "./DatedData";
import { BadgeSlug } from "../Badge";
import {
  CategoryName,
  categoryNameSchema,
} from "@shared/domain/readModels/project/Category";
import { z } from "zod/v3";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import {
  ProjectSummary,
  projectSummarySchema,
} from "@shared/domain/readModels/project/ProjectSummaries";

export type ProjectStatusName =
  | "working"
  | "in_progress"
  | "broken"
  | "unknown";

export const projectStatusNameSchema = z.enum([
  "working",
  "in_progress",
  "broken",
  "unknown",
]);

export interface ProjectCore {
  slug: string;
  idp_user_id: User["idp_user_id"];
  latest_revision?: null | number; // Latest revision number of the project
}

export interface ProjectDetails extends ProjectCore, DatedData {
  version: Version;
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
    // author: z.object({ name: z.string() }).optional().nullable(),
  })
  .extend(datedDataSchema.shape);

__tsCheckSame<
  ProjectDetails,
  ProjectDetails,
  z.infer<typeof detailedProjectSchema>
>(true);

__tsCheckSame<
  ProjectStatusName,
  ProjectStatusName,
  z.infer<typeof projectStatusNameSchema>
>(true);
