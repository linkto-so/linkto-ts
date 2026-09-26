import {
  Linkto,
  LinktoApiError,
  LinktoError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "../src/index.js";

/**
 * Demonstrates exhaustive error handling with Linkto SDK error classes.
 *
 * Notice the inheritance hierarchy:
 *   LinktoError (base error)
 *   ├── LinktoNetworkError (network/DNS/timeout failures)
 *   └── LinktoApiError (HTTP response errors)
 *       ├── LinktoRateLimitError (HTTP 429 rate limit exceeded)
 *       └── LinktoQuotaExceededError (HTTP 401/402/403 usage quota exceeded)
 *
 * When using `instanceof`, check specialized subclasses before `LinktoApiError`.
 */
function handleLinktoError(err: unknown): void {
  if (err instanceof LinktoRateLimitError) {
    // 429: Rate limit hit
    console.error(`[RateLimitError] HTTP ${err.status} (${err.code})`);
    console.error(`  Message:     ${err.message}`);
    console.error(`  Retry After: ${err.retryAfter} seconds`);
    console.error("  Action: Back off and retry the request after the delay.");
  } else if (err instanceof LinktoQuotaExceededError) {
    // 401/402/403: Workspace quota reached
    console.error(`[QuotaExceededError] HTTP ${err.status} (${err.code})`);
    console.error(`  Message:  ${err.message}`);
    console.error(`  Resource: "${err.resource}" (e.g. "links" or "clicks")`);
    console.error(
      "  Action: Upgrade your workspace plan or free up resources.",
    );
  } else if (err instanceof LinktoApiError) {
    // Other API errors (400 Bad Request, 404 Not Found, 409 Conflict, 500, etc.)
    console.error(
      `[ApiError] HTTP ${err.status} (${err.code}): ${err.message}`,
    );
    if (err.fieldErrors && err.fieldErrors.length > 0) {
      console.error("  Field validation errors:");
      for (const fieldError of err.fieldErrors) {
        console.error(`    - ${fieldError.field}: ${fieldError.message}`);
      }
    }
    if (err.docUrl) {
      console.error(`  API Docs: ${err.docUrl}`);
    }
  } else if (err instanceof LinktoNetworkError) {
    // Fetch failure, offline, DNS lookup failure, connection refused
    console.error(`[NetworkError] ${err.message}`);
    if (err.cause) {
      console.error("  Underlying cause:", err.cause);
    }
    console.error(
      "  Action: Check internet connection or retry with exponential backoff.",
    );
  } else if (err instanceof LinktoError) {
    // Generic SDK error
    console.error(`[LinktoError] ${err.message}`);
  } else if (err instanceof Error) {
    // Standard unexpected JavaScript runtime error
    console.error(`[Generic Error] ${err.message}`);
  } else {
    console.error("[Unknown Error]", err);
  }
}

async function main() {
  console.log("=== Linkto SDK: Error Handling Demonstration ===\n");

  // 1. Simulate and demonstrate how each error type is handled
  console.log("1. Simulating LinktoRateLimitError:");
  handleLinktoError(
    new LinktoRateLimitError({
      code: "rate_limit_exceeded",
      message: "Too many requests. Please slow down.",
      retryAfter: 30,
    }),
  );

  console.log("\n2. Simulating LinktoQuotaExceededError:");
  handleLinktoError(
    new LinktoQuotaExceededError({
      status: 403,
      code: "quota_exceeded",
      message: "Monthly link creation limit reached for free plan.",
      resource: "links",
    }),
  );

  console.log("\n3. Simulating LinktoApiError with field errors:");
  handleLinktoError(
    new LinktoApiError({
      status: 400,
      code: "bad_request",
      message: "Invalid link parameters provided.",
      fieldErrors: [
        { field: "url", message: "Must be a valid HTTP or HTTPS URL." },
        { field: "slug", message: "Slug 'docs' is already taken." },
      ],
      docUrl: "https://linkto.so/docs/api#errors",
    }),
  );

  console.log("\n4. Simulating LinktoNetworkError:");
  handleLinktoError(
    new LinktoNetworkError(
      "fetch failed: getaddrinfo ENOTFOUND api.linkto.so",
      new Error("DNS lookup timeout"),
    ),
  );

  // 2. Real call demonstration in a try/catch block
  console.log(
    "\n5. Executing live call with invalid credentials to trigger actual catch block:",
  );
  const client = new Linkto({
    apiKey: "lnk_invalid_key",
    baseUrl: "https://api.linkto.so",
  });

  try {
    await client.links.create({ url: "https://example.com" });
  } catch (err) {
    console.log("Caught live error:");
    handleLinktoError(err);
  }
}

main().catch((err) => {
  console.error("Failed to run error-handling example:", err);
  process.exit(1);
});
