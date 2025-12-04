/**
 * Rate limit handling utility for HubSpot API calls
 * 
 * Provides:
 * - Exponential backoff retry for 429 rate limit errors
 * - Request deduplication to prevent thundering herd
 */

type HubSpotError = {
  code?: number;
  response?: {
    statusCode?: number;
    body?: {
      errorType?: string;
      message?: string;
    };
  };
  message?: string;
};

/**
 * Checks if an error is a HubSpot rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const hubspotError = error as HubSpotError;
  
  // Check for direct code property (429)
  if (hubspotError.code === 429) {
    return true;
  }

  // Check for statusCode in response (429)
  if (hubspotError.response?.statusCode === 429) {
    return true;
  }

  // Check for RATE_LIMIT error type in body
  if (hubspotError.response?.body?.errorType === "RATE_LIMIT") {
    return true;
  }

  return false;
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * In-flight request cache to prevent duplicate concurrent requests
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Wraps an async function with retry logic and request deduplication
 * 
 * @param fn - The async function to wrap
 * @param key - Unique key for request deduplication (optional, uses function name if not provided)
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Wrapped function with retry and deduplication
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  key?: string,
  maxRetries = 3
): T {
  const requestKey = key || fn.name || "default";

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Check if there's already an in-flight request with the same key
    const existingRequest = inFlightRequests.get(requestKey);
    if (existingRequest) {
      // Wait for the existing request to complete
      try {
        return (await existingRequest) as ReturnType<T>;
      } catch (error) {
        // If the existing request failed, we'll retry below
        // Remove it from the cache so we can try again
        inFlightRequests.delete(requestKey);
        throw error;
      }
    }

    // Create a new request promise
    const requestPromise = (async (): Promise<ReturnType<T>> => {
      let lastError: unknown;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn(...args);
          // Success - remove from cache and return
          inFlightRequests.delete(requestKey);
          return result as ReturnType<T>;
        } catch (error) {
          lastError = error;

          // Only retry on rate limit errors
          if (!isRateLimitError(error)) {
            // Not a rate limit error - remove from cache and throw immediately
            inFlightRequests.delete(requestKey);
            throw error;
          }

          // If this was the last attempt, don't wait
          if (attempt === maxRetries) {
            inFlightRequests.delete(requestKey);
            throw error;
          }

          // Calculate exponential backoff delay: 1s, 2s, 4s
          const delayMs = Math.pow(2, attempt) * 1000;
          
          console.warn(
            `HubSpot rate limit error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`
          );

          await sleep(delayMs);
        }
      }

      // Should never reach here, but TypeScript needs this
      inFlightRequests.delete(requestKey);
      throw lastError;
    })();

    // Store the request promise for deduplication
    inFlightRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } catch (error) {
      // Ensure we clean up on error
      if (inFlightRequests.get(requestKey) === requestPromise) {
        inFlightRequests.delete(requestKey);
      }
      throw error;
    }
  }) as T;
}

