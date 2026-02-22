import { exec } from "node:child_process";
import { getClient } from "#db/connectionPool";

const MIGRATION_LOCK_ID = 108;

export async function runMigrations() {
  // This code runs the npm script 'db-migrate:up' to make sure all migrations are done
  console.log(`Waiting for db-migrations lock [${MIGRATION_LOCK_ID}]`);
  const dbClient = getClient();
  await dbClient.connect();
  await dbClient.query(`SELECT pg_advisory_lock($1)`, [MIGRATION_LOCK_ID]);
  console.log("Running migrations via child process");
  try {
    return await new Promise<void>((resolve, reject) => {
      exec("npm run db-migrate:up", (error, stdout, stderr) => {
        stdout && console.log(stdout);
        stderr && console.error(stderr);
        if (error) {
          console.error(`Error running migrations: ${error}`);
          reject(error);
        } else {
          resolve();
        }
        console.log("Migrations done");
      });
    });
  } finally {
    await dbClient.end();
    console.log("released db-migrations");
  }
}

runMigrations();
