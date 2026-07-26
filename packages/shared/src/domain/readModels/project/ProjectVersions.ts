import {
  type ISODateString,
  isoDateStringSchema,
} from "@shared/domain/readModels/ISODateString";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

/**
 * One entry per unique metadata `version` string for a project, pointing at
 * the highest published revision that carried that version label.
 */
export type ProjectVersionEntry = {
  /** Semantic/version label from app metadata (`metadata.json` `version` field). Omitted when missing in metadata. */
  version?: string;
  /** Highest published revision number that used this version label. */
  latestRevision: number;
  /** Publish date of the revision identified by `latestRevision`. */
  latestPublishDate: ISODateString;
};

export const projectVersionEntrySchema = z.object({
  version: z
    .string()
    .optional()
    .describe(
      "Version string from project metadata. Omitted when the version field was missing or blank for that revision."
    ),
  latestRevision: z
    .number()
    .int()
    .describe("The highest revisionNumber for this version"),
  latestPublishDate: isoDateStringSchema.describe(
    "Publish date of the highest revision for this version"
  ),
});

export const projectVersionsSchema = z
  .array(projectVersionEntrySchema)
  .describe(
    "Unique version labels from published project metadata, each with the highest revision for that label. Ordered by latestRevision descending."
  );

export type ProjectVersions = ProjectVersionEntry[];

__tsCheckSame<
  ProjectVersions,
  ProjectVersions,
  z.infer<typeof projectVersionsSchema>
>(true);
