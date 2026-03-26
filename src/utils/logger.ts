/**
 * Lightweight structured logger.
 * Outputs JSON lines — easy to pipe into any log aggregator (Datadog, ELK, etc.).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  info:  (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, meta),
};
