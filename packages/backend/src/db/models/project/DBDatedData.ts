import type { TimestampTZ } from "#db/models/DBTypes";

export interface DBDatedData {
  created_at: TimestampTZ; // Creation date
  updated_at: TimestampTZ; // Last update date
}

export interface DBSoftDeletable {
  deleted_at?: TimestampTZ; // Deletion date
}
