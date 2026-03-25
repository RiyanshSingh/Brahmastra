import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";
import { HttpError } from "./lib/http";
import { env } from "./lib/env";

const app: Express = express();

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info(
      {
        req: {
          method: req.method,
          url: req.originalUrl.split("?")[0],
        },
        res: {
          statusCode: res.statusCode,
        },
        responseTimeMs: Date.now() - startedAt,
      },
      "Request completed",
    );
  });

  next();
});
app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Class-Guard API Server",
    version: "1.0.0",
    service: "api-server"
  });
});

app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";

  logger.error({ err, statusCode }, "Request failed");
  res.status(statusCode).json({
    message,
    details: err instanceof HttpError ? err.details ?? null : null,
  });
});

export default app;
