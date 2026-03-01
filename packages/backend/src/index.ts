import { EXPRESS_PORT, IS_DEV_ENVIRONMENT } from "@config";
import { runMigrations } from "@db/migrations";
import { createExpressServer } from "@createExpressServer";
import { startMqtt } from "@reporting/mqtt";
import { startRefreshReportsInterval } from "@reporting/refreshReports";
import { BadgeHubData } from "@domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";

// unhandled-rejection-handler.js

process.on("unhandledRejection", (reason, promise) => {
  console.error("=== UNHANDLED PROMISE REJECTION ===");

  if (reason instanceof Error) {
    console.error(reason.stack);
  } else {
    console.error("Non-error rejection value:");
    console.error(require("util").inspect(reason, { depth: null }));
  }

  // Ensure logs flush before exit
  process.nextTick(() => {
    process.exit(1);
  });
});

async function startServer() {
  const app = createExpressServer();

  await runMigrations();
  app.listen(EXPRESS_PORT, () => {
    console.info(
      `Node.js server started with settings port [${EXPRESS_PORT}], IS_DEV_ENV [${IS_DEV_ENVIRONMENT}].\nApp available at http://localhost:${EXPRESS_PORT}/`
    );
    const badgeHubData = new BadgeHubData(
      new PostgreSQLBadgeHubMetadata(),
      new PostgreSQLBadgeHubFiles()
    );

    startMqtt(badgeHubData);
    startRefreshReportsInterval(badgeHubData);
  });
}

// noinspection JSIgnoredPromiseFromCall
startServer();
