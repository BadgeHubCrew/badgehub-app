import { repopulateDB } from "#dev/populate-db/populateDB";
import { runMigrations } from "#db/migrations";
import { exec } from "node:child_process";

const overwriteMockupData = async () => {
  console.log("START overwriting mockup data...");
  exec("npm run overwrite-mockup-data").on("close", () => {
    console.log("DONE overwriting mockup data...");
  });
};

async function runWithMigrationFirst() {
  console.log("Running migrations first...");
  await runMigrations();
  console.log("Running repopulateDB...");
  await repopulateDB();
}

runWithMigrationFirst().catch((e) => {
  console.error(e);
  throw e;
});
