import { BadgeHubFiles } from "@domain/BadgeHubFiles";
import { UploadedFile } from "@shared/domain/UploadedFile";
import { DBDatedData } from "@db/models/project/DBDatedData";
import { SQLITE_FILES_DIR } from "@config";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class SQLiteBadgeHubFiles implements BadgeHubFiles {
  private readonly filesDir: string;

  constructor(filesDir: string = SQLITE_FILES_DIR) {
    this.filesDir = filesDir;
  }

  private getFilePath(sha256: string): string {
    return path.join(this.filesDir, sha256);
  }

  async writeFile(
    uploadedFile: UploadedFile,
    sha256: string,
    _dates?: DBDatedData
  ): Promise<void> {
    const filePath = this.getFilePath(sha256);
    await mkdir(this.filesDir, { recursive: true });

    try {
      await access(filePath);
      return; // file already exists
    } catch {
      await writeFile(filePath, uploadedFile.fileContent);
    }
  }

  async getFileContents(sha256: string): Promise<Uint8Array | undefined> {
    const filePath = this.getFilePath(sha256);
    try {
      const buffer = await readFile(filePath);
      return buffer;
    } catch {
      return undefined;
    }
  }
}
