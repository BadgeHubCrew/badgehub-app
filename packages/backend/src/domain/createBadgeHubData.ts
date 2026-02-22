import { BadgeHubData } from "@domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";
import { DATABASE_ENGINE } from "@config";

export function createBadgeHubData(): BadgeHubData {
  switch (DATABASE_ENGINE) {
    case "postgres":
      return new BadgeHubData(
        new PostgreSQLBadgeHubMetadata(),
        new PostgreSQLBadgeHubFiles()
      );
    case "sqlite":
      throw new Error(
        "DATABASE_ENGINE=sqlite is not implemented yet. Set DATABASE_ENGINE=postgres until SQLite store wiring lands."
      );
    default:
      throw new Error(
        `Unsupported DATABASE_ENGINE: ${DATABASE_ENGINE}. Expected one of: postgres, sqlite.`
      );
  }
}
