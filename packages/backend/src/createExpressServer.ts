import * as fs from "node:fs";
import * as path from "node:path";
import {
  FRONTEND_DIST_DIR,
  FRONTEND_PUBLIC_DIR,
  IS_DEV_ENVIRONMENT,
} from "@config";
import { OpenAPIHandler } from "@orpc/openapi/node";
import { onError } from "@orpc/server";
import serveApiDocs from "@serveApiDocs";
import { getSharedConfig } from "@shared/config/sharedConfig";
import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { PostgreSQLBadgeHubFiles } from "./db/PostgreSQLBadgeHubFiles";
import { PostgreSQLBadgeHubMetadata } from "./db/PostgreSQLBadgeHubMetadata";
import { BadgeHubData } from "./domain/BadgeHubData";
import type { AppContext } from "./orpc/context";
import { createApiRouter } from "./orpc/router";

function getIndexHtmlContents() {
  const indexPath = path.join(FRONTEND_DIST_DIR, "index.html");
  let original: string;
  try {
    original = fs.readFileSync(indexPath, { encoding: "utf8" });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      const indirectDevPath = path.join(
        path.dirname(FRONTEND_DIST_DIR),
        "index-indirect-dev.html"
      );
      original = fs.readFileSync(indirectDevPath, { encoding: "utf8" });
    } else {
      throw err;
    }
  }
  return original.replace(
    `<!-- __SHARED_CONFIG_SCRIPT_PLACEHOLDER__ -->`,
    `<script type="application/javascript">globalThis.__SHARED_CONFIG__ = ${JSON.stringify(getSharedConfig())};</script>
`
  );
}

function toHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

export const createExpressServer = () => {
  const app = express();
  if (IS_DEV_ENVIRONMENT) {
    app.use((_req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      next();
    });
  }

  app.use(cors());

  // Register body parsers AFTER oRPC so multipart/file uploads stay intact
  const indexHtmlContents = getIndexHtmlContents();
  app.get(["/", "/page{/*path}"], (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(indexHtmlContents);
  });

  app.use(express.static(FRONTEND_DIST_DIR));
  app.use(express.static(FRONTEND_PUBLIC_DIR));

  const pino = pinoHttp();
  app.use(pino);

  serveApiDocs(app);

  const badgeHubData = new BadgeHubData(
    new PostgreSQLBadgeHubMetadata(),
    new PostgreSQLBadgeHubFiles()
  );
  const router = createApiRouter(badgeHubData);

  const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  });

  const openApiHandler = new OpenAPIHandler(router, {
    interceptors: [
      onError((error) => {
        console.warn(error);
      }),
    ],
  });

  // Legacy path: /projects/:slug/revN/... → /projects/:slug/revisions/N/...
  // (oRPC/OpenAPI path params cannot encode the "rev" + number glued segment)
  app.use("/api/v3", (req, _res, next) => {
    const rewrite = (u: string) =>
      u.replace(/\/rev(\d+)(?=\/|$|\?)/g, "/revisions/$1");
    req.url = rewrite(req.url);
    // OpenAPIHandler reads originalUrl for path matching
    Object.defineProperty(req, "originalUrl", {
      value: rewrite(req.originalUrl),
      writable: true,
      configurable: true,
    });
    next();
  });

  // Public + private API under /api/v3 — auth enforced per-procedure via oRPC middleware.
  // Express 4: mount on /api/v3 (not Express-5-style /api/v3{/*path}).
  app.use("/api/v3", rateLimiter, async (req, res, next) => {
    try {
      const headers = toHeaders(req);
      const { matched } = await openApiHandler.handle(req, res, {
        prefix: "/api/v3",
        context: {
          headers,
          badgeHubData,
          user: undefined,
          apiToken: undefined,
        } satisfies AppContext,
      });
      if (matched) return;
      next();
    } catch (err) {
      next(err);
    }
  });

  // JSON body only for non-oRPC routes (if any)
  app.use(express.json({ strict: false }));

  const errorLogger: ErrorRequestHandler = (
    err: unknown,
    _req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    console.warn(err);
    next(err);
  };
  app.use(errorLogger);
  return app;
};
