import type { DBDatedData } from "#db/models/project/DBDatedData";
import type { VersionRelation } from "#db/models/project/DBVersion";
import type { DBFileData } from "#db/models/project/DBFileData";

// table name: files
export interface DBFileMetadata extends VersionRelation, DBDatedData {
  id: number;
  dir: string; // directory of the file in the project, empty string if top level
  name: string; // file name without extension
  ext: string; // file name without extension
  mimetype: string; // Can include info about the programming language
  size_of_content: string;
  sha256: DBFileData["sha256"]; // lowercase hex sha256 digest, allows verifying whether content is the same as other file.
  image_width: number | null;
  image_height: number | null;
}

export const fileColumnsForCopying = [
  "dir",
  "name",
  "ext",
  "mimetype",
  "size_of_content",
  "sha256",
  "image_width",
  "image_height",
];
