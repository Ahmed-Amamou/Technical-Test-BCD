import { logger } from './logger';

export interface RetryOptions {
  retries: number;       // max number of retry attempts
  delayMs: number;       // base delay between retries (doubles each attempt)
  label: string;         // label for logging
}

const DEFAULT_OPTIONS: RetryOptions = {
  retries: 2,
  delayMs: 200,
  label: 'unknown',
};

/**
 * Retry a function with exponential back-off.
 * Used to absorb transient network / partner errors before giving up.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const { retries, delayMs, label } = { ...DEFAULT_OPTIONS, ...opts };

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${retries} for ${label} — waiting ${wait}ms`, {
          attempt: attempt + 1,
          label,
          error: err instanceof Error ? err.message : String(err),
        });
        await sleep(wait);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
