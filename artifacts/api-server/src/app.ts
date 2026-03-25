import type { IncomingMessage, ServerResponse } from "node:http";
import routes from "./routes";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { applyCors, createRouteHandler, isPreflight, sendError } from "./lib/http";

const apiRouteHandler = createRouteHandler(routes);

function logRequest(req: IncomingMessage, res: ServerResponse, startedAt: number): void {
  logger.info(
    {
      req: {
        method: req.method,
        url: (req.url ?? "/").split("?")[0],
      },
      res: {
        statusCode: res.statusCode,
      },
      responseTimeMs: Date.now() - startedAt,
    },
    "Request completed",
  );
}

async function app(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startedAt = Date.now();

  res.on("finish", () => {
    logRequest(req, res, startedAt);
  });

  applyCors(req, res, env.corsOrigin);

  if (isPreflight(req)) {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          status: "ok",
          message: "Class-Guard API Server",
          version: "1.0.0",
          service: "api-server",
        }),
      );
      return;
    }

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      const routePath = pathname === "/api" ? "/" : pathname.slice(4);
      await apiRouteHandler(req, res, routePath);
      return;
    }

    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ message: "Route not found.", details: null }));
  } catch (err) {
    logger.error({ err }, "Request failed");
    sendError(res, err);
  }
}

export default app;
