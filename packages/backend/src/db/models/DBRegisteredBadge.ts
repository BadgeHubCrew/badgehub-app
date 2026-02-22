import type { DBDatedData } from "#db/models/project/DBDatedData";
import type { TimestampTZ } from "#db/models/DBTypes";

export interface DBRegisteredBadgeInsert {
  id: string;
  mac_address: string;
  badge_id: string;
  last_seen_at: TimestampTZ;
}

// table name: registered_badges
export interface DBRegisteredBadge
  extends DBRegisteredBadgeInsert,
    DBDatedData {}
