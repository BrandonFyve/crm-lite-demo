import { withRetry } from "@/lib/rate-limit";

describe("withRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("successful requests", () => {
    it("should return result on first successful attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = withRetry(mockFn, "test-key");

      const resultPromise = wrappedFn();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments correctly", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = withRetry(mockFn, "test-key");

      const resultPromise = wrappedFn("arg1", "arg2");
      jest.runAllTimers();
      await resultPromise;

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("rate limit error handling", () => {
    it("should retry on 429 error with code property", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 429, message: "Rate limited" })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const result = await wrappedFn();

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
      jest.useFakeTimers();
    }, 10000);

    it("should retry on 429 error with response.statusCode", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({
          response: { statusCode: 429 },
          message: "Rate limited",
        })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const result = await wrappedFn();

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
      jest.useFakeTimers();
    }, 10000);

    it("should retry on RATE_LIMIT errorType", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({
          response: {
            body: { errorType: "RATE_LIMIT", message: "Rate limited" },
          },
        })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const result = await wrappedFn();

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
      jest.useFakeTimers();
    }, 10000);

    it("should use exponential backoff (1s, 2s, 4s)", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 429 })
        .mockRejectedValueOnce({ code: 429 })
        .mockRejectedValueOnce({ code: 429 })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const result = await wrappedFn();

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(4);
      jest.useFakeTimers();
    }, 10000);

    it("should throw after max retries exceeded", async () => {
      jest.useRealTimers();
      const rateLimitError = { code: 429, message: "Rate limited" };
      const mockFn = jest.fn().mockRejectedValue(rateLimitError);

      const wrappedFn = withRetry(mockFn, "test-key", 2);

      await expect(wrappedFn()).rejects.toEqual(rateLimitError);
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      jest.useFakeTimers();
    }, 10000);
  });

  describe("non-rate-limit errors", () => {
    it("should not retry on non-429 errors", async () => {
      const error = { code: 404, message: "Not found" };
      const mockFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const resultPromise = wrappedFn();

      await expect(resultPromise).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });

    it("should not retry on generic errors", async () => {
      const error = new Error("Something went wrong");
      const mockFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const resultPromise = wrappedFn();

      await expect(resultPromise).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });

    it("should not retry on 401 authentication errors", async () => {
      const error = { code: 401, message: "Unauthorized" };
      const mockFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = withRetry(mockFn, "test-key", 3);

      const resultPromise = wrappedFn();

      await expect(resultPromise).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe("request deduplication", () => {
    it("should deduplicate concurrent requests with same key", async () => {
      const mockFn = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("success"), 100);
          })
      );

      const wrappedFn = withRetry(mockFn, "dedup-key");

      // Make two concurrent calls
      const promise1 = wrappedFn();
      const promise2 = wrappedFn();

      jest.advanceTimersByTime(100);
      jest.runAllTimers();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe("success");
      expect(result2).toBe("success");
      // Should only call the underlying function once
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should handle separate requests with different keys independently", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");

      const wrappedFn1 = withRetry(mockFn, "key-1");
      const wrappedFn2 = withRetry(mockFn, "key-2");

      const promise1 = wrappedFn1();
      const promise2 = wrappedFn2();

      jest.runAllTimers();
      await Promise.all([promise1, promise2]);

      // Each key should have its own call
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should clean up after successful request", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = withRetry(mockFn, "cleanup-key");

      // First request
      const promise1 = wrappedFn();
      jest.runAllTimers();
      await promise1;

      // Second request should make a new call (not deduplicated)
      const promise2 = wrappedFn();
      jest.runAllTimers();
      await promise2;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should clean up after failed request", async () => {
      const error = new Error("Failed");
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = withRetry(mockFn, "cleanup-key");

      // First request fails
      const promise1 = wrappedFn();
      jest.runAllTimers();
      await expect(promise1).rejects.toEqual(error);

      // Second request should make a new call (not deduplicated)
      const promise2 = wrappedFn();
      jest.runAllTimers();
      await expect(promise2).rejects.toEqual(error);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should handle concurrent requests where one fails and one succeeds", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 429 })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "mixed-key", 3);

      // Make two concurrent calls
      const promise1 = wrappedFn();
      const promise2 = wrappedFn();

      // Wait for retry (1s delay)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the success result after retry
      expect(result1).toBe("success");
      expect(result2).toBe("success");
      // Should only call twice: initial failure + retry success
      expect(mockFn).toHaveBeenCalledTimes(2);
      jest.useFakeTimers();
    });
  });

  describe("edge cases", () => {
    it("should work with default key when not provided", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = withRetry(mockFn);

      const resultPromise = wrappedFn();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should respect custom maxRetries", async () => {
      jest.useRealTimers();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ code: 429 })
        .mockRejectedValueOnce({ code: 429 })
        .mockRejectedValueOnce({ code: 429 })
        .mockRejectedValueOnce({ code: 429 })
        .mockResolvedValueOnce("success");

      const wrappedFn = withRetry(mockFn, "custom-retries", 4);

      const resultPromise = wrappedFn();
      // Wait for all retries: 1s + 2s + 4s + 8s = 15s + buffer
      const result = await Promise.race([
        resultPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 20000)
        ),
      ]);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(5); // Initial + 4 retries
      jest.useFakeTimers();
    }, 25000);
  });
});

