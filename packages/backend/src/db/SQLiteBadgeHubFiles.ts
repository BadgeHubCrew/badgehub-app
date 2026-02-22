import { BadgeHubFiles } from "@domain/BadgeHubFiles";

export class SQLiteBadgeHubFiles implements BadgeHubFiles {
  private fail(method: string): never {
    throw new Error(`SQLiteBadgeHubFiles.${method} is not implemented yet.`);
  }

  writeFile(..._args: Parameters<BadgeHubFiles["writeFile"]>) {
    this.fail("writeFile");
  }

  getFileContents(..._args: Parameters<BadgeHubFiles["getFileContents"]>) {
    this.fail("getFileContents");
  }
}
