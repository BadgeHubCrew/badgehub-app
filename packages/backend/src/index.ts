import { EXPRESS_PORT, sharedConfig } from "@config";
import { runMigrations } from "@db/migrations";
import { createExpressServer } from "@createExpressServer";

async function startServer() {
  const app = createExpressServer();

  await runMigrations();
  app.listen(EXPRESS_PORT, () => {
    console.info(
      `Node.js server started with settings port [${EXPRESS_PORT}], IS_DEV_ENV [${sharedConfig.isDevEnvironment}].\nApp available at http://localhost:${EXPRESS_PORT}/`
    );
  });
}

// noinspection JSIgnoredPromiseFromCall
startServer();
