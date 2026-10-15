import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../domain/common/errors/app-error";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Erro interno do servidor" });
}
