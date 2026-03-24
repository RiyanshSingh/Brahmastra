import type { NextFunction, Request, Response } from "express";

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

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
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
