import { BadgeHubData } from "@domain/BadgeHubData";
import { SQLiteBadgeHubMetadata } from "@db/SQLiteBadgeHubMetadata";
import { SQLiteBadgeHubFiles } from "@db/SQLiteBadgeHubFiles";

export function createBadgeHubData(): BadgeHubData {
  return new BadgeHubData(new SQLiteBadgeHubMetadata(), new SQLiteBadgeHubFiles());
}
