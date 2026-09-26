# @linkto-so/sdk

Official TypeScript/JavaScript SDK for [linkto.so](https://linkto.so) - the Cloudflare-native smart link platform with device-aware routing, custom QR codes, and click analytics.

[![npm version](https://img.shields.io/npm/v/@linkto-so/sdk.svg)](https://www.npmjs.com/package/@linkto-so/sdk)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/linkto-so/linkto-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/linkto-so/linkto-ts/actions/workflows/ci.yml)

## Features

- **Zero Runtime Dependencies**: Ultra-lightweight with zero external dependencies.
- **Native Fetch**: Uses standard global `fetch` on Node.js 18+, Bun, Deno, Cloudflare Workers, and modern browsers.
- **Dual ESM & CommonJS**: Full compatibility with both `import` and `require`, shipping complete TypeScript `.d.ts` and `.d.cts` declarations.
- **Smart Device Routing**: Route visitors to iOS App Store, Google Play Store, or fallback URLs based on device OS.
- **Custom QR Codes**: Generate instant image URLs synchronously for JSX/HTML or retrieve styled SVG markup asynchronously.
- **Bulk Link Creation**: Create multiple links in a single request with detailed partial failure reporting.
- **Click Analytics**: Query workspace-level summaries and per-link stats broken down by device, browser, OS, and country.
- **Typed Error Hierarchy**: Granular error classes with automatic 429 rate limit backoff and `Retry-After` header support.

## Installation

Install using your preferred package manager:

```bash
pnpm add @linkto-so/sdk
```

```bash
npm install @linkto-so/sdk
```

```bash
yarn add @linkto-so/sdk
```

```bash
bun add @linkto-so/sdk
```

## Quickstart

Initialize the `Linkto` client. By default, the SDK automatically reads the `LINKTO_API_KEY` environment variable if present.

```typescript
import { Linkto } from "@linkto-so/sdk";

// Initialize with an explicit API key or rely on process.env.LINKTO_API_KEY
const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

CommonJS is also supported:

```javascript
const { Linkto } = require("@linkto-so/sdk");

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

## Core Usage

### 1. Basic Link Shortening

Create short links using either `url` or `destination`. Default domain links automatically receive a secondary alias URL (`https://shor.ink/:slug`).

```typescript
import { Linkto } from "@linkto-so/sdk";

const linkto = new Linkto();

// Both 'url' and 'destination' are supported
const link = await linkto.links.create({
  url: "https://example.com/blog/launch-announcement",
  title: "Launch Announcement",
  slug: "launch",
});

console.log("Short URL:", link.shortUrl); // e.g. https://linkto.so/launch
console.log("Alias URL:", link.aliasUrl); // e.g. https://shor.ink/launch
console.log("Target URL:", link.url);
```

### 2. Device Routing & UTM Tagging

Direct visitors to platform-specific targets (such as App Store or Google Play) while retaining a default fallback and UTM tracking parameters:

```typescript
const smartLink = await linkto.links.create({
  destination: "https://myapp.com/download",
  title: "Mobile App Download",
  routing: {
    ios: "https://apps.apple.com/app/id1234567890",
    android: "https://play.google.com/store/apps/details?id=com.myapp",
    fallback: "https://myapp.com/download",
  },
  utm: {
    source: "newsletter",
    medium: "email",
    campaign: "spring_sale",
  },
});

console.log("Smart link created:", smartLink.shortUrl);
```

### 3. Custom QR Code Rendering

Generate direct image URLs synchronously without an extra HTTP request, or fetch raw SVG markup asynchronously for inline embedding:

```typescript
import { Linkto, QR_DOT_STYLE, QR_MARKER_STYLE } from "@linkto-so/sdk";

const linkto = new Linkto();

const qrOptions = {
  url: "https://linkto.so/launch",
  fgColor: "#0f172a",
  bgColor: "#ffffff",
  dotStyle: QR_DOT_STYLE.ROUNDED,
  markerStyle: QR_MARKER_STYLE.ROUNDED,
  caption: "Scan to learn more",
};

// 1. Synchronous URL generation: perfect for JSX / HTML <img src="...">
const imageUrl = linkto.qr.getUrl(qrOptions);
// <img src={imageUrl} alt="Scan QR Code" />

// 2. Asynchronous SVG string fetching: ideal for SSR, PDF generation, or direct storage
const svgMarkup = await linkto.qr.getSvg(qrOptions);
```

### 4. Typed Error Handling

Catch specific errors to handle rate limiting and workspace quota constraints gracefully:

```typescript
import {
  Linkto,
  LinktoApiError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "@linkto-so/sdk";

const linkto = new Linkto();

try {
  const link = await linkto.links.create({
    url: "https://example.com",
  });
} catch (error) {
  if (error instanceof LinktoRateLimitError) {
    // HTTP 429: SDK automatically retried up to maxRetries before throwing
    console.warn(`Rate limit reached. Retry after ${error.retryAfter}s`);
  } else if (error instanceof LinktoQuotaExceededError) {
    // HTTP 401/402/403: Workspace limit exceeded for a specific resource
    console.error(`Quota exceeded for ${error.resource}: ${error.message}`);
  } else if (error instanceof LinktoApiError) {
    // Validation or API error (400, 404, 409, 500, etc.)
    console.error(`API error ${error.status} (${error.code}): ${error.message}`);
    if (error.fieldErrors) {
      for (const fe of error.fieldErrors) {
        console.error(`- ${fe.field}: ${fe.message}`);
      }
    }
  } else if (error instanceof LinktoNetworkError) {
    // Network connectivity, DNS failure, or timeout
    console.error("Network issue:", error.message, error.cause);
  }
}
```

## Architecture

- **Zero Runtime Dependencies**: Declares empty runtime dependencies (`dependencies: {}`) and uses native `globalThis.fetch` along with standard Web APIs (Request, Response, URL, Headers).
- **Dual ESM and CommonJS**: Compiled with `tsup` to output both modern ECMAScript modules (`.js`, `.d.ts`) and legacy CommonJS modules (`.cjs`, `.d.cts`) for seamless compatibility across runtimes and bundlers.
- **Resource Modularity**: Features dedicated, modular resource clients (`links`, `analytics`, `domains`, `qr`, `tags`, `account`, `tokens`) that share a single underlying typed `HttpClient` transport.
- **Strict Typing with `as const`**: Employs TypeScript `as const` object constants for enum-like values to ensure compile-time type safety and rich IDE autocomplete without any runtime overhead.
- **Cloudflare-Native Alignment**: Designed from the ground up to integrate cleanly with Link-to's high-performance edge infrastructure and serverless execution environments.

## Documentation

Explore topic guides for detailed usage, full parameters, and practical examples:

- [Links Guide](docs/links.md): Creating, updating, deleting, listing, rotating slugs, password protection, bulk creation, and aliases.
- [QR Codes Guide](docs/qr-codes.md): Synchronous URL formatting, asynchronous SVG generation, color styling, dot/marker shapes, and captions.
- [Error Handling](docs/error-handling.md): Error class hierarchy, automatic 429 exponential backoff, field validation parsing, and quota limits.
- [Analytics Guide](docs/analytics.md): Workspace-wide stats, per-link analytics, daily trends, and breakdowns by device, browser, OS, and country.
- [Account & Workspaces](docs/account.md): Token verification, plan usage limits, custom domain verification, tags, and API token management.
- [TypeScript & Interop](docs/typescript.md): Type definitions, `as const` constants for autocomplete, and CommonJS / ESM dual module interoperability.

## Client Configuration

The `Linkto` constructor accepts an optional configuration object:

```typescript
const linkto = new Linkto({
  // Linkto API token (defaults to process.env.LINKTO_API_KEY)
  apiKey: "lnk_your_api_token",

  // Base API URL (defaults to "https://linkto.so")
  baseUrl: "https://linkto.so",

  // Custom fetch implementation (defaults to globalThis.fetch)
  fetch: customFetch,

  // Maximum retry attempts on 429 rate limit responses (defaults to 2)
  maxRetries: 3,

  // Additional headers sent with every request
  headers: {
    "X-Application-Name": "my-service",
  },
});
```

## License

[MIT](LICENSE)
