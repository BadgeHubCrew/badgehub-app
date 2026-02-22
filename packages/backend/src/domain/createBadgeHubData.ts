import { BadgeHubData } from "@domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";
import { DATABASE_ENGINE } from "@config";
import { SQLiteBadgeHubMetadata } from "@db/SQLiteBadgeHubMetadata";
import { SQLiteBadgeHubFiles } from "@db/SQLiteBadgeHubFiles";

export function createBadgeHubData(): BadgeHubData {
  switch (DATABASE_ENGINE) {
    case "postgres":
      return new BadgeHubData(
        new PostgreSQLBadgeHubMetadata(),
        new PostgreSQLBadgeHubFiles()
      );
    case "sqlite":
      return new BadgeHubData(
        new SQLiteBadgeHubMetadata(),
        new SQLiteBadgeHubFiles()
      );
    default:
      throw new Error(
        `Unsupported DATABASE_ENGINE: ${DATABASE_ENGINE}. Expected one of: postgres, sqlite.`
      );
  }
}
