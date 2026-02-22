import express from "express";
import { pinoHttp } from "pino-http";
import serveApiDocs from "#serveApiDocs";
import {
  FRONTEND_DIST_DIR,
  FRONTEND_PUBLIC_DIR,
  IS_DEV_ENVIRONMENT,
} from "#config";
import rateLimit from "express-rate-limit";
import { createExpressEndpoints } from "@ts-rest/express";
import { publicRestContracts } from "@badgehub/shared/contracts/publicRestContracts";
import { createPublicRestRouter } from "#controllers/ts-rest/publicRestRouter";
import { privateRestContracts } from "@badgehub/shared/contracts/privateRestContracts";
import { createPrivateRestRouter } from "#controllers/ts-rest/privateRestRouter";
import { addAuthenticationMiddleware } from "#auth/jwt-decode";
import { jwtVerifyTokenMiddleware } from "#auth/jwt-verify";
import cors from "cors";
import * as path from "path";
import * as fs from "node:fs";
import { getSharedConfig } from "@badgehub/shared/config/sharedConfig";

function getIndexHtmlContents() {
  const indexPath = path.join(FRONTEND_DIST_DIR, "index.html");
  const original = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, { encoding: "utf8" })
    : "<!doctype html><html><head></head><body><div id=\"root\"></div><!-- __SHARED_CONFIG_SCRIPT_PLACEHOLDER__ --></body></html>";
  return original.replace(
    `<!-- __SHARED_CONFIG_SCRIPT_PLACEHOLDER__ -->`,
    `<script type="application/javascript">globalThis.__SHARED_CONFIG__ = ${JSON.stringify(getSharedConfig())};</script>
`
  );
}

export const createExpressServer = () => {
  const app = express();
  if (IS_DEV_ENVIRONMENT) {
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      next(); // for inspection during development
    });
  }

  app.use(cors());

  // Accept any valid JSON value (including primitives like JSON strings).
  app.use(express.json({ strict: false }));
  const indexHtmlContents = getIndexHtmlContents();
  // Handle requests for the root and /page routes by sending the main HTML file.
  // This is crucial for Single Page Applications (SPAs) that use client-side routing.
  app.get(["/", "/page", "/page/*"], (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(indexHtmlContents);
  });

  app.use(express.static(FRONTEND_DIST_DIR));
  app.use(express.static(FRONTEND_PUBLIC_DIR));

  const pino = pinoHttp();
  app.use(pino);

  serveApiDocs(app);

  const apiV3Router = express.Router();
  app.use("/api/v3", apiV3Router);
  createExpressEndpoints(
    publicRestContracts,
    createPublicRestRouter(),
    apiV3Router
  );

  const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 100 requests per windowMs
  });
  createExpressEndpoints(
    privateRestContracts,
    createPrivateRestRouter(),
    apiV3Router,
    {
      globalMiddleware: [
        rateLimiter,
        jwtVerifyTokenMiddleware,
        addAuthenticationMiddleware,
      ],
    }
  );
  app.use((err: any, req: any, res: any, next: any) => {
    console.warn(err);
    next(err);
  });
  return app;
};
