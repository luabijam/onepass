/**
 * Logger for debugging - stores logs in memory and writes to file
 * Log file location: ~/Library/Logs/OnePass/app.log
 */

import {NativeModules, Platform} from 'react-native';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
}

interface LogFileWriterInterface {
  writeLog(logLine: string): Promise<void>;
  getLogFilePath(): Promise<string>;
  clearLogFile(): Promise<void>;
  getLogFileSize(): Promise<number>;
  rotateLogIfNeeded(maxSizeMB: number): Promise<boolean>;
  readLastLines(linesCount: number): Promise<string>;
}

// Lazy initialization of native module
let _logFileWriter: LogFileWriterInterface | null | undefined;

function getLogFileWriter(): LogFileWriterInterface | null {
  if (_logFileWriter !== undefined) {
    return _logFileWriter;
  }

  try {
    if (Platform.OS !== 'macos') {
      _logFileWriter = null;
      return null;
    }

    const nativeModule = NativeModules.LogFileWriter;
    if (!nativeModule) {
      _logFileWriter = null;
      return null;
    }

    _logFileWriter = {
      writeLog: (logLine: string): Promise<void> => {
        try {
          return nativeModule.writeLog(logLine);
        } catch {
          return Promise.resolve();
        }
      },
      getLogFilePath: (): Promise<string> => {
        try {
          return nativeModule.getLogFilePath();
        } catch {
          return Promise.resolve('');
        }
      },
      clearLogFile: (): Promise<void> => {
        try {
          return nativeModule.clearLogFile();
        } catch {
          return Promise.resolve();
        }
      },
      getLogFileSize: (): Promise<number> => {
        try {
          return nativeModule.getLogFileSize();
        } catch {
          return Promise.resolve(0);
        }
      },
      rotateLogIfNeeded: (maxSizeMB: number): Promise<boolean> => {
        try {
          return nativeModule.rotateLogIfNeeded(maxSizeMB);
        } catch {
          return Promise.resolve(false);
        }
      },
      readLastLines: (linesCount: number): Promise<string> => {
        try {
          return nativeModule.readLastLines(linesCount);
        } catch {
          return Promise.resolve('');
        }
      },
    };

    return _logFileWriter;
  } catch {
    _logFileWriter = null;
    return null;
  }
}

const logBuffer: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;
const MAX_LOG_FILE_SIZE_MB = 10; // Rotate log when exceeds 10MB

let logFilePath: string | null = null;
let loggerInitialized = false;

/**
 * Initialize logger - get log file path
 */
export async function initLogger(): Promise<string | null> {
  if (loggerInitialized) {
    return logFilePath;
  }

  const writer = getLogFileWriter();
  if (!writer) {
    console.log('[Logger] File logging not available on this platform');
    return null;
  }

  try {
    logFilePath = await writer.getLogFilePath();
    console.log(`[Logger] Log file: ${logFilePath}`);

    // Rotate log if needed
    await writer.rotateLogIfNeeded(MAX_LOG_FILE_SIZE_MB);

    // Log startup message
    const startupMsg = `\n${'='.repeat(60)}\n[APP START] ${new Date().toISOString()}\n${'='.repeat(60)}`;
    await writer.writeLog(startupMsg);

    loggerInitialized = true;
    return logFilePath;
  } catch (error) {
    console.error('[Logger] Failed to initialize:', error);
    return null;
  }
}

/**
 * Get the log file path
 */
export function getLogFilePath(): string | null {
  return logFilePath;
}

/**
 * Format log entry for file
 */
function formatLogEntry(entry: LogEntry): string {
  const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
  return `[${entry.timestamp}] [${entry.level}] [${entry.tag}] ${entry.message}${dataStr}`;
}

/**
 * Log a message
 */
export function log(
  level: LogLevel,
  tag: string,
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = {timestamp, level, tag, message, data};

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift();
  }

  // Format for console
  const prefix = `[${timestamp}] [${level}] [${tag}]`;
  const fullMessage = data ? `${prefix} ${message}` : `${prefix} ${message}`;

  // Output to console
  switch (level) {
    case 'ERROR':
      console.error(fullMessage, data !== undefined ? data : '');
      break;
    case 'WARN':
      console.warn(fullMessage, data !== undefined ? data : '');
      break;
    default:
      console.log(fullMessage, data !== undefined ? data : '');
  }

  // Write to file (async, non-blocking) - only after initialization
  if (loggerInitialized) {
    const writer = getLogFileWriter();
    if (writer) {
      const logLine = formatLogEntry(entry);
      writer.writeLog(logLine).catch(() => {
        // Silent fail
      });
    }
  }
}

/**
 * Get all buffered logs
 */
export function getLogs(): LogEntry[] {
  return [...logBuffer];
}

/**
 * Get logs as formatted string
 */
export function getLogsAsString(): string {
  return logBuffer.map(formatLogEntry).join('\n');
}

/**
 * Clear all buffered logs (memory only, not file)
 */
export function clearLogs(): void {
  logBuffer.length = 0;
}

/**
 * Clear log file
 */
export async function clearLogFile(): Promise<void> {
  const writer = getLogFileWriter();
  if (writer && loggerInitialized) {
    await writer.clearLogFile();
    log('INFO', 'Logger', 'Log file cleared');
  }
}

/**
 * Get log file size in bytes
 */
export async function getLogFileSize(): Promise<number> {
  const writer = getLogFileWriter();
  if (writer && loggerInitialized) {
    return await writer.getLogFileSize();
  }
  return 0;
}

/**
 * Read last N lines from log file
 */
export async function readLogFileLines(linesCount: number): Promise<string> {
  const writer = getLogFileWriter();
  if (writer && loggerInitialized) {
    return await writer.readLastLines(linesCount);
  }
  return '';
}

/**
 * Set up global error handling
 */
export function setupErrorHandling(): void {
  // Handle unhandled errors
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    log('ERROR', 'GlobalHandler', `Unhandled error (fatal: ${isFatal})`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Log all unhandled promise rejections
  const originalPromiseRejectionHandler = (global as any)
    ._unhandledPromiseRejectionHandler;

  (global as any)._unhandledPromiseRejectionHandler = (
    id: number,
    error: Error,
  ) => {
    log('ERROR', 'PromiseRejection', `Unhandled promise rejection`, {
      id,
      message: error?.message,
      stack: error?.stack,
    });

    if (originalPromiseRejectionHandler) {
      originalPromiseRejectionHandler(id, error);
    }
  };

  log('INFO', 'Logger', 'Error handling set up');
}

// Convenience methods
export const logger = {
  info: (tag: string, message: string, data?: unknown) =>
    log('INFO', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) =>
    log('WARN', tag, message, data),
  error: (tag: string, message: string, data?: unknown) =>
    log('ERROR', tag, message, data),
  debug: (tag: string, message: string, data?: unknown) =>
    log('DEBUG', tag, message, data),
};

// Don't auto-setup error handling during module load - do it after initLogger
