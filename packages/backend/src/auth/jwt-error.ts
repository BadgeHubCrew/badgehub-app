import express from "express";
import type { NextFunction } from "express";

export interface JwtError extends Error {
  status: number;
  message: string;
}

// Handle TSOA errors
export function jwtErrorHandler(
  error: Error,
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  console.log("errorHandler::error", error);

  if (isJwtError(error) && error.status !== 200) {
    return res.status(401).json(error);
  } else {
    next();
  }
}

function isJwtError(err: Error): err is JwtError {
  return (err as JwtError).status > 0 && "message" in err;
}
