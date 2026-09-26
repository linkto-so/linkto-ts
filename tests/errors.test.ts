import { describe, expect, it } from "vitest";
import {
  LinktoApiError,
  LinktoError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "../src/errors";

describe("Error Classes", () => {
  it("LinktoError should inherit from Error", () => {
    const error = new LinktoError("test error");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("LinktoError");
    expect(error.message).toBe("test error");
  });

  it("LinktoNetworkError should inherit from LinktoError", () => {
    const error = new LinktoNetworkError("network error", "cause");
    expect(error).toBeInstanceOf(LinktoError);
    expect(error.name).toBe("LinktoNetworkError");
    expect(error.message).toBe("network error");
    expect(error.cause).toBe("cause");
  });

  it("LinktoApiError should inherit from LinktoError and set properties", () => {
    const error = new LinktoApiError({
      status: 400,
      code: "bad_request",
      message: "Bad Request",
      fieldErrors: [{ field: "email", message: "invalid" }],
      docUrl: "https://docs.linkto.so/errors#bad_request",
    });
    expect(error).toBeInstanceOf(LinktoError);
    expect(error.name).toBe("LinktoApiError");
    expect(error.status).toBe(400);
    expect(error.code).toBe("bad_request");
    expect(error.message).toBe("Bad Request");
    expect(error.fieldErrors).toEqual([{ field: "email", message: "invalid" }]);
    expect(error.docUrl).toBe("https://docs.linkto.so/errors#bad_request");
  });

  it("LinktoRateLimitError should inherit from LinktoApiError and set properties", () => {
    const error = new LinktoRateLimitError({
      status: 429,
      code: "rate_limited",
      message: "Too Many Requests",
      retryAfter: 60,
    });
    expect(error).toBeInstanceOf(LinktoApiError);
    expect(error.name).toBe("LinktoRateLimitError");
    expect(error.status).toBe(429);
    expect(error.code).toBe("rate_limited");
    expect(error.message).toBe("Too Many Requests");
    expect(error.retryAfter).toBe(60);
  });

  it("LinktoQuotaExceededError should inherit from LinktoApiError and set properties", () => {
    const error = new LinktoQuotaExceededError({
      status: 403,
      code: "quota_exceeded",
      message: "Quota Exceeded",
      resource: "links",
    });
    expect(error).toBeInstanceOf(LinktoApiError);
    expect(error.name).toBe("LinktoQuotaExceededError");
    expect(error.status).toBe(403);
    expect(error.code).toBe("quota_exceeded");
    expect(error.message).toBe("Quota Exceeded");
    expect(error.resource).toBe("links");
  });
});
