import {
  type ISODateString,
  isoDateStringSchema,
} from "@shared/domain/readModels/ISODateString";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type AppMetadataJSON, appMetadataJSONSchema } from "./AppMetadataJSON";
import { type FileMetadata, fileMetadataSchema } from "./FileMetadata";

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
  blur_hash?: null | string; // see https://github.com/woltapp/blurhash
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
  blur_hash: z.string().optional().nullable(),
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
