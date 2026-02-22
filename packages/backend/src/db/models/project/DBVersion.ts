import type { DBDatedData } from "#db/models/project/DBDatedData";
import type { TimestampTZ } from "../DBTypes.ts";
import type { ProjectSlugRelation } from "./DBProject.ts";
import type { AppMetadataJSON } from "@badgehub/shared/domain/readModels/project/AppMetadataJSON";

export type VersionRelation<
  K extends string = "version_id",
  VC extends keyof DBInsertVersion = "id",
> = Record<K, DBInsertVersion[VC]>;

export interface DBInsertVersion extends ProjectSlugRelation {
  id: number;
  revision: number;
  app_metadata: AppMetadataJSON; // JSON string of the app metadata
  zip?: string;
  size_of_zip?: number;
  git_commit_id?: string;
  published_at?: TimestampTZ;
  download_count?: number;
}

export interface DBVersion extends DBInsertVersion, DBDatedData {
  download_count: number;
}
