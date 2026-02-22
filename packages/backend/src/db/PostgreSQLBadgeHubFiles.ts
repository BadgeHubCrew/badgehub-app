import type { BadgeHubFiles } from "#domain/BadgeHubFiles";
import type { UploadedFile } from "@badgehub/shared/domain/UploadedFile";
import { Pool } from "pg";
import { getPool } from "#db/connectionPool";
import sql from "sql-template-tag";
import type { DBDatedData } from "#db/models/project/DBDatedData";

export class PostgreSQLBadgeHubFiles implements BadgeHubFiles {
  private readonly pool: Pool = getPool();

  async writeFile(
    uploadedFile: UploadedFile,
    sha256: string,
    dates?: DBDatedData
  ): Promise<void> {
    const results = await this.pool.query(
      sql`select 1
                from file_data
                where sha256 = ${sha256}`
    );
    if (results.rows.length > 0) {
      return; // File already exists
    }
    await this.pool.query(
      sql`insert into file_data (sha256, content)
                values (${sha256}, ${uploadedFile.fileContent})`
    );
    if (dates) {
      await this.pool.query(
        sql`update file_data
                    set created_at = ${dates.created_at},
                        updated_at = ${dates.updated_at}
                    where sha256 = ${sha256}`
      );
    }
  }

  async getFileContents(sha256: string): Promise<Uint8Array | undefined> {
    const queryResult = await this.pool.query<{ content: Uint8Array }>(
      sql`select content
                from file_data
                where sha256 = ${sha256}`
    );
    return queryResult.rows[0]?.content;
  }
}
