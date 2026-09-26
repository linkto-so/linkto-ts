import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LinktoApiError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "../src/errors.js";
import { HttpClient } from "../src/internal/http.js";

describe("HttpClient", () => {
  const originalEnv = process.env.LINKTO_API_KEY;

  beforeEach(() => {
    delete process.env.LINKTO_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.LINKTO_API_KEY = originalEnv;
    } else {
      delete process.env.LINKTO_API_KEY;
    }
    vi.restoreAllMocks();
  });

  describe("Configuration & Headers", () => {
    it("uses default baseUrl https://linkto.so and strips trailing slash", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({
        baseUrl: "https://custom-api.linkto.so/",
        fetch: mockFetch,
      });

      expect(client.baseUrl).toBe("https://custom-api.linkto.so");

      await client.request("/api/v1/test");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom-api.linkto.so/api/v1/test",
        expect.anything(),
      );
    });

    it("defaults baseUrl to https://linkto.so when not provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      expect(client.baseUrl).toBe("https://linkto.so");

      await client.request("api/v1/test");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://linkto.so/api/v1/test",
        expect.anything(),
      );
    });

    it("supports absolute URL paths without prepending baseUrl", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("https://other.linkto.so/endpoint");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://other.linkto.so/endpoint",
        expect.anything(),
      );
    });

    it("sends default headers including X-Client and Accept", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/test");

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers).toMatchObject({
        Accept: "application/json",
        "X-Client": "linkto-ts/0.1.0",
      });
      expect(reqInit.headers.Authorization).toBeUndefined();
    });

    it("sets Authorization header when apiKey option is provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({
        apiKey: "lnk_test_key_123",
        fetch: mockFetch,
      });
      await client.request("/test");

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers.Authorization).toBe("Bearer lnk_test_key_123");
    });

    it("falls back to process.env.LINKTO_API_KEY when apiKey is not provided", async () => {
      process.env.LINKTO_API_KEY = "lnk_env_key_456";

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/test");

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers.Authorization).toBe("Bearer lnk_env_key_456");
    });

    it("merges custom client headers and request headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({
        headers: { "X-Client-Header": "client-val", "X-Override": "initial" },
        fetch: mockFetch,
      });

      await client.request("/test", {
        headers: { "X-Request-Header": "req-val", "X-Override": "overridden" },
      });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers["X-Client-Header"]).toBe("client-val");
      expect(reqInit.headers["X-Request-Header"]).toBe("req-val");
      expect(reqInit.headers["X-Override"]).toBe("overridden");
    });

    it("automatically sets Content-Type to application/json when body is provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/test", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers["Content-Type"]).toBe("application/json");
    });

    it("does not set Content-Type when body is not provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/test", { method: "GET" });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers["Content-Type"]).toBeUndefined();
    });

    it("does not overwrite custom Content-Type if already provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/test", {
        method: "POST",
        body: "raw text",
        headers: { "Content-Type": "text/plain" },
      });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers["Content-Type"]).toBe("text/plain");
    });
  });

  describe("Response Unwrapping", () => {
    it("automatically unwraps { data: T } from response", async () => {
      const payload = {
        id: "lnk_abc",
        slug: "docs",
        destination: "https://docs.linkto.so",
      };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: payload }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const result = await client.request<typeof payload>(
        "/api/v1/links/lnk_abc",
      );
      expect(result).toEqual(payload);
    });

    it("returns raw json if data property is not present", async () => {
      const payload = { success: true, count: 42 };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const result = await client.request<typeof payload>("/api/v1/count");
      expect(result).toEqual(payload);
    });

    it("requestText returns raw string content", async () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>';
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(svgContent, {
          status: 200,
          headers: { "Content-Type": "image/svg+xml" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const text = await client.requestText("/api/qr?url=https://linkto.so");
      expect(text).toBe(svgContent);
    });
  });

  describe("Error Parsing", () => {
    it("throws LinktoApiError on 4xx/5xx responses with parsed details", async () => {
      const errorBody = {
        error: {
          code: "bad_request",
          message: "Destination URL is invalid",
          errors: [{ field: "destination", message: "must be a valid URL" }],
          doc_url: "https://linkto.so/docs/api/errors#bad-request",
        },
      };

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });

      await expect(client.request("/api/v1/links")).rejects.toThrow(
        LinktoApiError,
      );

      try {
        await client.request("/api/v1/links");
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoApiError);
        const apiErr = err as LinktoApiError;
        expect(apiErr.status).toBe(400);
        expect(apiErr.code).toBe("bad_request");
        expect(apiErr.message).toBe("Destination URL is invalid");
        expect(apiErr.fieldErrors).toEqual([
          { field: "destination", message: "must be a valid URL" },
        ]);
        expect(apiErr.docUrl).toBe(
          "https://linkto.so/docs/api/errors#bad-request",
        );
      }
    });

    it("throws LinktoQuotaExceededError when error code or status indicates quota", async () => {
      const errorBody = {
        error: {
          code: "quota_exceeded",
          message: "Workspace has reached monthly link limit",
          resource: "links",
        },
      };

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });

      await expect(client.request("/api/v1/links")).rejects.toThrow(
        LinktoQuotaExceededError,
      );

      try {
        await client.request("/api/v1/links");
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoQuotaExceededError);
        const quotaErr = err as LinktoQuotaExceededError;
        expect(quotaErr.status).toBe(403);
        expect(quotaErr.code).toBe("quota_exceeded");
        expect(quotaErr.resource).toBe("links");
      }
    });

    it("handles non-JSON error responses gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("Bad Gateway Error", {
          status: 502,
          statusText: "Bad Gateway",
          headers: { "Content-Type": "text/plain" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });

      try {
        await client.request("/api/v1/links");
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoApiError);
        const apiErr = err as LinktoApiError;
        expect(apiErr.status).toBe(502);
        expect(apiErr.message).toContain("Bad Gateway Error");
      }
    });
  });

  describe("Rate Limit Retry (HTTP 429)", () => {
    it("retries on 429 using Retry-After and succeeds if next request succeeds", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: { code: "rate_limit_exceeded" } }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "2",
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: { success: true } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

      const client = new HttpClient({
        fetch: mockFetch,
        sleep: mockSleep,
      });

      const result = await client.request<{ success: boolean }>("/test");
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSleep).toHaveBeenCalledWith(2000);
    });

    it("throws LinktoRateLimitError when retries exceed maxRetries", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "rate_limit_exceeded",
              message: "Too many requests",
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "1",
            },
          },
        ),
      );

      const client = new HttpClient({
        maxRetries: 2,
        fetch: mockFetch,
        sleep: mockSleep,
      });

      await expect(client.request("/test")).rejects.toThrow(
        LinktoRateLimitError,
      );

      // 1 initial + 2 retries = 3 attempts total
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);

      try {
        await client.request("/test");
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoRateLimitError);
        const rateErr = err as LinktoRateLimitError;
        expect(rateErr.status).toBe(429);
        expect(rateErr.code).toBe("rate_limit_exceeded");
        expect(rateErr.retryAfter).toBe(1);
      }
    });

    it("does not retry if maxRetries is 0", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "rate_limit_exceeded" } }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "5",
            },
          },
        ),
      );

      const client = new HttpClient({
        maxRetries: 0,
        fetch: mockFetch,
        sleep: mockSleep,
      });

      await expect(client.request("/test")).rejects.toThrow(
        LinktoRateLimitError,
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });
  });

  describe("Network Error Handling", () => {
    it("wraps fetch TypeError or network failure in LinktoNetworkError", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed: ENOTFOUND"));

      const client = new HttpClient({ fetch: mockFetch });

      await expect(client.request("/test")).rejects.toThrow(LinktoNetworkError);

      try {
        await client.request("/test");
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoNetworkError);
        const netErr = err as LinktoNetworkError;
        expect(netErr.message).toBe("fetch failed: ENOTFOUND");
        expect(netErr.cause).toBeInstanceOf(TypeError);
      }
    });

    it("wraps network errors in requestText", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Connection reset"));

      const client = new HttpClient({ fetch: mockFetch });

      await expect(client.requestText("/test")).rejects.toThrow(
        LinktoNetworkError,
      );
    });

    it("does not re-wrap LinktoError thrown inside fetch", async () => {
      const customError = new LinktoApiError({
        status: 400,
        code: "custom",
        message: "already linkto error",
      });
      const mockFetch = vi.fn().mockRejectedValue(customError);

      const client = new HttpClient({ fetch: mockFetch });

      await expect(client.request("/test")).rejects.toThrow(customError);
    });
  });

  describe("Edge Cases & Advanced Scenarios", () => {
    it("uses default exponential backoff when Retry-After is absent", async () => {
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: { code: "rate_limit_exceeded" } }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

      const client = new HttpClient({
        fetch: mockFetch,
        sleep: mockSleep,
      });

      const result = await client.request<string>("/test");
      expect(result).toBe("ok");
      // attempt 0 without Retry-After: Math.pow(2, 0) * 1000 = 1000ms
      expect(mockSleep).toHaveBeenCalledWith(1000);
    });

    it("handles Retry-After as an HTTP Date", async () => {
      const futureDate = new Date(Date.now() + 10000).toUTCString();
      const mockSleep = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: { code: "rate_limit_exceeded" } }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": futureDate,
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

      const client = new HttpClient({
        fetch: mockFetch,
        sleep: mockSleep,
      });

      const result = await client.request<string>("/test");
      expect(result).toBe("ok");
      expect(mockSleep).toHaveBeenCalled();
      const sleepArg = mockSleep.mock.calls[0][0];
      // Should be approximately 10000ms (within 2s range due to test execution timing)
      expect(sleepArg).toBeGreaterThanOrEqual(8000);
      expect(sleepArg).toBeLessThanOrEqual(12000);
    });

    it("handles 204 No Content response gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
          statusText: "No Content",
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const result = await client.request("/api/v1/links/123", {
        method: "DELETE",
      });
      expect(result).toBeUndefined();
    });

    it("handles empty 200 OK body gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("", {
          status: 200,
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const result = await client.request("/test");
      expect(result).toBeUndefined();
    });

    it("serializes plain object body to JSON string", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "created" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      await client.request("/api/v1/links", {
        method: "POST",
        body: { url: "https://example.com" } as unknown as BodyInit,
      });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.body).toBe(JSON.stringify({ url: "https://example.com" }));
      expect(reqInit.headers["Content-Type"]).toBe("application/json");
    });

    it("supports Headers instance in options.headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const headers = new Headers();
      headers.set("X-From-Headers-Instance", "custom-instance-value");

      await client.request("/test", { headers });

      const [, reqInit] = mockFetch.mock.calls[0];
      expect(reqInit.headers["x-from-headers-instance"]).toBe(
        "custom-instance-value",
      );
    });

    it("detects clicks quota code and assigns clicks resource", async () => {
      const errorBody = {
        error: {
          code: "clicks_limit_exceeded",
          message: "Workspace click quota reached",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(errorBody), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });

      try {
        await client.request("/test");
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoQuotaExceededError);
        const quotaErr = err as LinktoQuotaExceededError;
        expect(quotaErr.resource).toBe("clicks");
      }
    });

    it("handles 402 Payment Required as LinktoQuotaExceededError", async () => {
      const errorBody = {
        error: {
          code: "payment_required",
          message: "Upgrade required to use this feature",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(errorBody), {
          status: 402,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });

      try {
        await client.request("/test");
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(LinktoQuotaExceededError);
        const quotaErr = err as LinktoQuotaExceededError;
        expect(quotaErr.status).toBe(402);
      }
    });
  });
});
