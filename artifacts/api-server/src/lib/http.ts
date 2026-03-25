import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

const JSON_BODY_LIMIT_BYTES = 10 * 1024 * 1024;

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type HttpMethod = "GET" | "POST" | "DELETE";

export interface AppRequest {
  body: unknown;
  headers: IncomingHttpHeaders;
  method: string;
  params: Record<string, string>;
  path: string;
  query: URLSearchParams;
  raw: IncomingMessage;
  url: URL;
}

export interface AppResponse {
  json: (payload: unknown, statusCode?: number) => void;
  noContent: () => void;
  raw: ServerResponse;
  setHeader: (name: string, value: string) => void;
}

export interface RouteDefinition {
  handler: (req: AppRequest, res: AppResponse) => Promise<void> | void;
  method: HttpMethod;
  path: string;
}

interface CompiledRoute extends RouteDefinition {
  matcher: RegExp;
  paramNames: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePath(path: string): Pick<CompiledRoute, "matcher" | "paramNames"> {
  const segments = path.split("/").filter(Boolean);
  const paramNames: string[] = [];

  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }

      return escapeRegExp(segment);
    })
    .join("/");

  return {
    matcher: new RegExp(`^/${pattern}${segments.length === 0 ? "" : ""}/?$`),
    paramNames,
  };
}

function compileRoutes(routes: RouteDefinition[]): CompiledRoute[] {
  return routes.map((route) => ({
    ...route,
    ...compilePath(route.path),
  }));
}

function matchRoute(
  routes: CompiledRoute[],
  method: string,
  path: string,
): { params: Record<string, string>; route: CompiledRoute } | null {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const match = route.matcher.exec(path);

    if (!match) {
      continue;
    }

    const params = route.paramNames.reduce<Record<string, string>>((acc, name, index) => {
      acc[name] = decodeURIComponent(match[index + 1] ?? "");
      return acc;
    }, {});

    return { params, route };
  }

  return null;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") {
    return null;
  }

  const chunks: Buffer[] = [];
  let totalLength = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalLength += buffer.length;

    if (totalLength > JSON_BODY_LIMIT_BYTES) {
      throw new HttpError(413, "Request body is too large.");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return null;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new HttpError(400, "Invalid JSON request body.");
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return rawBody;
}

function writeJson(res: ServerResponse, payload: unknown, statusCode = 200): void {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function writeNoContent(res: ServerResponse): void {
  if (res.writableEnded) {
    return;
  }

  res.statusCode = 204;
  res.end();
}

export function applyCors(
  req: IncomingMessage,
  res: ServerResponse,
  corsOrigin: string,
): void {
  if (corsOrigin === "*") {
    res.setHeader("access-control-allow-origin", "*");
  } else {
    res.setHeader("access-control-allow-origin", corsOrigin);
    res.setHeader("vary", "Origin");
  }

  res.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "Content-Type, Authorization");
}

export function isPreflight(req: IncomingMessage): boolean {
  return req.method === "OPTIONS";
}

export function createRouteHandler(routes: RouteDefinition[]) {
  const compiledRoutes = compileRoutes(routes);

  return async (req: IncomingMessage, res: ServerResponse, path: string): Promise<void> => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const matched = matchRoute(compiledRoutes, req.method ?? "GET", path);

    if (!matched) {
      throw new HttpError(404, "Route not found.");
    }

    const body = await readBody(req);
    const request: AppRequest = {
      body,
      headers: req.headers,
      method: req.method ?? "GET",
      params: matched.params,
      path,
      query: url.searchParams,
      raw: req,
      url,
    };
    const response: AppResponse = {
      json: (payload, statusCode) => {
        writeJson(res, payload, statusCode);
      },
      noContent: () => {
        writeNoContent(res);
      },
      raw: res,
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
    };

    await matched.route.handler(request, response);
  };
}

export function sendError(res: ServerResponse, err: unknown): void {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";

  writeJson(
    res,
    {
      message,
      details: err instanceof HttpError ? err.details ?? null : null,
    },
    statusCode,
  );
}

export function assertExists<T>(
  value: T | null | undefined,
  message: string,
  statusCode = 404,
): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new HttpError(statusCode, message);
  }

  return value as NonNullable<T>;
}
