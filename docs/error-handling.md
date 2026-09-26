# Error Handling

The Linkto SDK provides a structured, strongly typed error hierarchy designed to make failure states predictable and simple to inspect.

## Error Hierarchy

All errors thrown by the SDK inherit from `LinktoError`:

```text
LinktoError (base error class)
├── LinktoNetworkError (network failures, DNS resolution errors, connection timeouts)
└── LinktoApiError (HTTP response errors returned by the server)
    ├── LinktoRateLimitError (HTTP 429 rate limit exceeded)
    └── LinktoQuotaExceededError (HTTP 401/402/403 workspace usage quota reached)
```

---

## Catching and Handling Errors

Because `LinktoRateLimitError` and `LinktoQuotaExceededError` inherit from `LinktoApiError`, order matters when using `instanceof` guards: check specific subclasses before the broader `LinktoApiError`.

```typescript
import {
  Linkto,
  LinktoApiError,
  LinktoError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "@linkto-so/sdk";

const linkto = new Linkto();

try {
  await linkto.links.create({
    url: "https://example.com",
    slug: "custom-slug",
  });
} catch (err: unknown) {
  if (err instanceof LinktoRateLimitError) {
    // 1. Rate limiting (HTTP 429)
    console.warn(`Hit rate limit. Retry suggested in ${err.retryAfter}s`);
    console.warn(`Status: ${err.status}, Code: ${err.code}`);
  } else if (err instanceof LinktoQuotaExceededError) {
    // 2. Resource quota exhaustion (HTTP 401, 402, or 403)
    console.error(`Quota reached for resource: ${err.resource}`);
    console.error(`Message: ${err.message}`);
  } else if (err instanceof LinktoApiError) {
    // 3. Other API errors (400 Bad Request, 404 Not Found, 409 Conflict, etc.)
    console.error(`API Error ${err.status} [${err.code}]: ${err.message}`);
    if (err.fieldErrors && err.fieldErrors.length > 0) {
      console.error("Field validation issues:");
      for (const fe of err.fieldErrors) {
        console.error(`  - Field "${fe.field}": ${fe.message}`);
      }
    }
    if (err.docUrl) {
      console.error(`See documentation: ${err.docUrl}`);
    }
  } else if (err instanceof LinktoNetworkError) {
    // 4. Network or connectivity issues
    console.error("Network request failed:", err.message);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
  } else if (err instanceof LinktoError) {
    // 5. Any other SDK-specific error
    console.error("Linkto SDK error:", err.message);
  } else {
    // 6. Generic JavaScript runtime error
    console.error("Unexpected runtime error:", err);
  }
}
```

---

## Automatic 429 Retry Backoff

When an API call receives an HTTP 429 response, the SDK automatically pauses and retries the request up to `maxRetries` times (default: 2 retries, configurable in `ClientOptions`).

### Retry Delay Resolution

1. If the server provides a `Retry-After` header, the SDK parses it:
   - If the header is a number of seconds (e.g. `Retry-After: 5`), the SDK waits that duration.
   - If the header is an HTTP Date (e.g. `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT`), the SDK calculates the delta in seconds until that timestamp.
2. If no `Retry-After` header is supplied, the SDK uses exponential backoff: `2 ** attempt` seconds (1s, 2s, 4s, etc.).

If the request still fails after exhausting all retries, a `LinktoRateLimitError` is thrown with:
- `err.status`: `429`
- `err.code`: `"rate_limit_exceeded"`
- `err.retryAfter`: Number of seconds to wait before attempting another request
- `err.message`: Human-readable error description

### Configuring Retries

```typescript
const linkto = new Linkto({
  maxRetries: 4, // Increase retry attempts for high-throughput batch scripts
});
```

---

## Quota Exceeded Errors (`LinktoQuotaExceededError`)

When your workspace reaches plan limits (such as monthly link count or click thresholds), the server returns HTTP 401, 402, or 403 with a quota error code.

The SDK translates this into a `LinktoQuotaExceededError`:

```typescript
try {
  await linkto.links.create({ url: "https://example.com" });
} catch (err) {
  if (err instanceof LinktoQuotaExceededError) {
    console.error(`Status code: ${err.status}`);
    console.error(`Exceeded resource: ${err.resource}`); // e.g. "links", "clicks", or "workspace"
    console.error(`Message: ${err.message}`);
  }
}
```

---

## Field Validation Errors (`fieldErrors`)

When link creation or update options fail schema validation (such as an invalid URL format or an illegal slug name), `LinktoApiError` captures the detailed field breakdowns:

```typescript
interface FieldError {
  field: string;
  message: string;
}
```

```typescript
try {
  await linkto.links.create({
    url: "invalid-url",
    slug: "bad/slug/with/slashes",
  });
} catch (err) {
  if (err instanceof LinktoApiError && err.fieldErrors) {
    for (const error of err.fieldErrors) {
      console.warn(`Validation failed on "${error.field}": ${error.message}`);
    }
  }
}
```

---

## Network Errors (`LinktoNetworkError`)

If a network timeout occurs, DNS resolution fails, or an offline environment is encountered, the SDK throws `LinktoNetworkError`. The original underlying error (such as `TypeError: fetch failed`) is preserved on `err.cause`:

```typescript
try {
  await linkto.links.list();
} catch (err) {
  if (err instanceof LinktoNetworkError) {
    console.error("Failed to connect to Linkto API:", err.message);
    if (err.cause) {
      console.error("Underlying cause:", err.cause);
    }
  }
}
```
