import type { DBFileData } from "#db/models/project/DBFileData";
import type { ProjectSlugRelation } from "#db/models/project/DBProject";
import type { TimestampTZ } from "#db/models/DBTypes";

export interface DBProjectApiKey extends ProjectSlugRelation {
  key_hash: DBFileData["sha256"];
  created_at: TimestampTZ; // Creation date
  last_used_at: TimestampTZ;
}
