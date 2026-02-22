import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { createExpressEndpoints, initServer } from "@ts-rest/express";
import { createSwaggerDoc, swaggerJsonContract } from "#createSwaggerDoc";

const swaggerDoc = createSwaggerDoc();

export default function serveApiDocs(app: Express) {
  const swaggerJsonRouter = initServer().router(swaggerJsonContract, {
    getSwaggerDoc: async () => ({
      status: 200,
      body: swaggerDoc,
    }),
  });
  createExpressEndpoints(swaggerJsonContract, swaggerJsonRouter, app);
  const options = {
    swaggerOptions: { url: "/api-docs/swagger.json" },
  };
  app.use(
    "/api-docs",
    swaggerUi.serveFiles(undefined, options),
    swaggerUi.setup(undefined, options)
  );
}
