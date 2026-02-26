import { EXPRESS_PORT, IS_DEV_ENVIRONMENT } from "@config";
import { runMigrations } from "@db/migrations";
import { createExpressServer } from "@createExpressServer";
import { startMqtt } from "@reporting/mqtt";
import { startRefreshReportsInterval } from "@reporting/refreshReports";
import { createBadgeHubData } from "@domain/createBadgeHubData";

async function startServer() {
  const app = createExpressServer();

  await runMigrations();
  app.listen(EXPRESS_PORT, () => {
    console.info(
      `Node.js server started with settings port [${EXPRESS_PORT}], IS_DEV_ENV [${IS_DEV_ENVIRONMENT}].\nApp available at http://localhost:${EXPRESS_PORT}/`
    );
    const badgeHubData = createBadgeHubData();

    startMqtt(badgeHubData);
    startRefreshReportsInterval(badgeHubData);
  });
}

// noinspection JSIgnoredPromiseFromCall
startServer();
