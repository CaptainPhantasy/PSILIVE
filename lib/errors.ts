/**
 * Centralized Error Handling System
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

// Standard error codes
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  RATE_LIMITED = "RATE_LIMITED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_STAGE = "INVALID_STAGE",
  GATE_BLOCKED = "GATE_BLOCKED",
}

// Custom application error
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Type guard for AppError
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Error factory
export const Errors = {
  unauthorized: (message = "Unauthorized") =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),
  forbidden: (message = "Access denied") =>
    new AppError(ErrorCode.FORBIDDEN, message, 403),
  notFound: (resource: string, id?: string) =>
    new AppError(
      ErrorCode.NOT_FOUND,
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      404
    ),
  validationError: (message: string, metadata?: Record<string, unknown>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, metadata),
  alreadyExists: (message: string) =>
    new AppError(ErrorCode.ALREADY_EXISTS, message, 409),
  internal: (message = "An unexpected error occurred") =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),
  badRequest: (message: string) =>
    new AppError(ErrorCode.BAD_REQUEST, message, 400),
  invalidStage: (currentStage: string, targetStage: string) =>
    new AppError(ErrorCode.INVALID_STAGE, `Cannot transition from ${currentStage} to ${targetStage}`, 400),
  gateBlocked: (stage: string, missingRequirements: string[]) =>
    new AppError(ErrorCode.GATE_BLOCKED, `Stage ${stage} blocked: missing ${missingRequirements.join(", ")}`, 400, { missingRequirements }),
};

// User-friendly error messages
export const USER_FRIENDLY_ERRORS: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: "Please log in to continue.",
  [ErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ErrorCode.NOT_FOUND]: "The item you're looking for wasn't found.",
  [ErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorCode.ALREADY_EXISTS]: "This item already exists.",
  [ErrorCode.INTERNAL_ERROR]: "Something went wrong. Please try again.",
  [ErrorCode.BAD_REQUEST]: "Invalid request.",
  [ErrorCode.RATE_LIMITED]: "Too many requests. Please wait a moment.",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable.",
  [ErrorCode.INVALID_STAGE]: "Invalid stage transition.",
  [ErrorCode.GATE_BLOCKED]: "Cannot proceed - requirements not met.",
};

/**
 * Create a standardized error response
 */
export function errorResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    logger.error(`AppError: ${error.code}`, { message: error.message, metadata: error.metadata });
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    logger.error("Unhandled error", { message: error.message, stack: error.stack });
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  logger.error("Unknown error type", { error: String(error) });
  return NextResponse.json(
    {
      success: false,
      error: "Unknown error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Create a 404 not found response
 */
export function notFoundResponse(resource: string, id?: string): NextResponse {
  const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
  return NextResponse.json(
    { success: false, error: message, code: "NOT_FOUND" },
    { status: 404 }
  );
}

/**
 * Create a 401 unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

/**
 * Create a 403 forbidden response
 */
export function forbiddenResponse(message = "Access denied"): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: "FORBIDDEN" },
    { status: 403 }
  );
}

/**
 * Create a 400 bad request response
 */
export function badRequestResponse(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: "VALIDATION_ERROR", details },
    { status: 400 }
  );
}
