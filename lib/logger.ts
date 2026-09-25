/**
 * Production-grade logging utility
 * Structured logging with levels, context, and production integration
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  duration?: number;
  userId?: string;
  requestId?: string;
}

// Check if we're in development
const isDev = process.env.NODE_ENV === "development";

// ANSI color codes for development
const colors = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  reset: "\x1b[0m",
};

// Log level priority
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment or default
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDev ? "debug" : "info");

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[minLevel];
}

function formatLogEntry(entry: LogEntry): string {
  if (isDev) {
    // Pretty print for development
    const color = colors[entry.level];
    const prefix = `${color}[${entry.level.toUpperCase().padEnd(5)}]\x1b[0m`;
    const time = `\x1b[90m${entry.timestamp}\x1b[0m`;
    let message = `${time} ${prefix} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  ${JSON.stringify(entry.context, null, 2).split("\n").join("\n  ")}`;
    }

    if (entry.duration !== undefined) {
      message += ` \x1b[90m(${entry.duration}ms)\x1b[0m`;
    }

    return message;
  }

  // JSON for production (easier to parse by log aggregators)
  return JSON.stringify(entry);
}

class Logger {
  private context: Record<string, unknown> = {};
  private userId?: string;
  private requestId?: string;

  setContext(context: Record<string, unknown>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  setUserId(userId: string | undefined): this {
    this.userId = userId;
    return this;
  }

  setRequestId(requestId: string | undefined): this {
    this.requestId = requestId;
    return this;
  }

  clearContext(): this {
    this.context = {};
    return this;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      userId: this.userId,
      requestId: this.requestId,
    };

    const formatted = formatLogEntry(entry);

    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  // Time a operation
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
  time<T>(label: string, fn: () => T): T;
  async time<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Create a child logger with persistent context
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    childLogger.userId = this.userId;
    childLogger.requestId = this.requestId;
    return childLogger;
  }
}

// Singleton instance
export const logger = new Logger();

// Create a new logger instance
export function createLogger(): Logger {
  return new Logger();
}

// Export types
export type { LogLevel, LogEntry };
