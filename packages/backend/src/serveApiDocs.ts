import { createSwaggerDoc } from "@createSwaggerDoc";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

export default function serveApiDocs(app: Express) {
  // Lazy-generate once; generation is async
  let swaggerDocPromise = createSwaggerDoc();

  app.get("/api-docs/swagger.json", async (_req, res, next) => {
    try {
      const doc = await swaggerDocPromise;
      res.json(doc);
    } catch (err) {
      // Retry next request if generation failed once
      swaggerDocPromise = createSwaggerDoc();
      next(err);
    }
  });

  const options = {
    swaggerOptions: { url: "/api-docs/swagger.json" },
  };
  app.use(
    "/api-docs",
    swaggerUi.serveFiles(undefined, options),
    swaggerUi.setup(undefined, options)
  );
}
