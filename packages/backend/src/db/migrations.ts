export async function runMigrations(): Promise<void> {
  // SQLite schema is bootstrapped lazily by sqliteDatabase.ts.
  // Keep this as a no-op to preserve existing startup call sites.
}
