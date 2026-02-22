import { appMetadataJSONSchema } from "./AppMetadataJSON.ts";
import type { AppMetadataJSON } from "./AppMetadataJSON.ts";
import { fileMetadataSchema } from "./FileMetadata.ts";
import type { FileMetadata } from "./FileMetadata.ts";
import type { ProjectDetails } from "@badgehub/shared/domain/readModels/project/ProjectDetails";
import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { isoDateStringSchema } from "@badgehub/shared/domain/readModels/ISODateString";
import type { ISODateString } from "@badgehub/shared/domain/readModels/ISODateString";

export type LatestVersionAlias = "latest";
type DraftVersionAlias = "draft";
export type LatestOrDraftAlias = LatestVersionAlias | DraftVersionAlias;
export type RevisionNumber = number;
export type RevisionNumberOrAlias = LatestOrDraftAlias | RevisionNumber;

export interface VersionRelation {
  version: Version;
}

export interface Version {
  revision: RevisionNumber;
  // zip?: null | string;
  // size_of_zip?: null | number;
  // git_commit_id?: null | string; // Allow spefifying a git commit ID for the version, if it exists // TODO allow updating this somehow
  files: Array<FileMetadata>;
  app_metadata: AppMetadataJSON; // Changed! New property that has the content of the metadata.json file that is installed on the project.
  published_at?: null | ISODateString;
  // download_count: number;
  project_slug?: null | ProjectDetails["slug"]; // TODO remove because has no value in http response, is more of an internal detail
}

export const versionSchema = z.object({
  revision: z.number(),
  // zip: z.string().optional().nullable(),
  // size_of_zip: z.number().optional().nullable(),
  // git_commit_id: z.string().optional().nullable(),
  files: z.array(fileMetadataSchema),
  app_metadata: appMetadataJSONSchema,
  published_at: isoDateStringSchema.optional().nullable(),
  // download_count: z.coerce.number(),
  project_slug: z.string().optional().nullable(), // Project slug
});

__tsCheckSame<Version, Version, z.infer<typeof versionSchema>>(true);
