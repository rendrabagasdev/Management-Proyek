/**
 * Production-ready logging utility
 * Only logs in development or when explicitly enabled
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isLoggingEnabled = process.env.ENABLE_LOGGING === "true";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment || isLoggingEnabled) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment || isLoggingEnabled) {
      console.warn(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment || isLoggingEnabled) {
      console.info(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
