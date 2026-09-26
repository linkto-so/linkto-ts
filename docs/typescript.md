# TypeScript & Module Interoperability

The Linkto SDK is written in TypeScript from the ground up, targeting modern standards (`ES2022`) while providing full backward and forward compatibility with both ECMAScript Modules (ESM) and CommonJS (CJS).

## TypeScript Best Practices

### Strict Typing & Compiler Options

The SDK ships comprehensive declaration files:
- `dist/index.d.ts` for ESM consumers
- `dist/index.d.cts` for CommonJS consumers

We recommend configuring your `tsconfig.json` with strict mode enabled:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## Object Constants with `as const` for IDE Autocomplete

Instead of TypeScript numeric enums (which produce runtime boilerplate and have known typing quirks), the SDK uses freeze-ready plain JavaScript objects declared with `as const`. Each constant also exports a companion union type:

```typescript
import {
  LINK_STATUS,
  type LinkStatus,
  LINK_STATE,
  type LinkState,
  QR_DOT_STYLE,
  type QrDotStyle,
  QR_MARKER_STYLE,
  type QrMarkerStyle,
  API_ERROR_CODE,
  type ApiErrorCode,
} from "@linkto-so/sdk";
```

### 1. `LINK_STATUS` & `LinkStatus`

Represents administrative status values when updating or filtering links:

```typescript
export const LINK_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DISABLED: "disabled",
} as const;

export type LinkStatus = (typeof LINK_STATUS)[keyof typeof LINK_STATUS];
// Equivalent to: "active" | "archived" | "disabled"
```

**Usage:**

```typescript
await linkto.links.update("lnk_123", {
  status: LINK_STATUS.ARCHIVED,
});
```

### 2. `LINK_STATE` & `LinkState`

Represents the computed runtime state of a link (e.g. whether it has expired):

```typescript
export const LINK_STATE = {
  ACTIVE: "active",
  EXPIRED: "expired",
  ARCHIVED: "archived",
  DISABLED: "disabled",
} as const;

export type LinkState = (typeof LINK_STATE)[keyof typeof LINK_STATE];
```

**Usage:**

```typescript
const link = await linkto.links.get("lnk_123");

if (link.state === LINK_STATE.EXPIRED) {
  console.log("This link has expired and is serving fallback traffic.");
}
```

### 3. `QR_DOT_STYLE` & `QrDotStyle`

Style choices for internal QR data modules:

```typescript
export const QR_DOT_STYLE = {
  ROUNDED: "rounded",
  SQUARE: "square",
  DOTS: "dots",
} as const;

export type QrDotStyle = (typeof QR_DOT_STYLE)[keyof typeof QR_DOT_STYLE];
```

### 4. `QR_MARKER_STYLE` & `QrMarkerStyle`

Style choices for QR positioning eye markers:

```typescript
export const QR_MARKER_STYLE = {
  ROUNDED: "rounded",
  SQUARE: "square",
  CIRCLE: "circle",
} as const;

export type QrMarkerStyle = (typeof QR_MARKER_STYLE)[keyof typeof QR_MARKER_STYLE];
```

### 5. `API_ERROR_CODE` & `ApiErrorCode`

Standard API error codes returned by the service:

```typescript
export const API_ERROR_CODE = {
  BAD_REQUEST: "bad_request",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INTERNAL_SERVER_ERROR: "internal_server_error",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];
```

---

## Types vs Interfaces

The SDK follows standard TypeScript conventions:
- **Interfaces** represent extensible data shapes, models, options, and payloads (e.g. `Link`, `LinkSummary`, `CreateLinkOptions`, `UpdateLinkOptions`, `QrRenderOptions`, `AccountUsage`, `WorkspaceStats`, `BulkCreateResponse`, `FieldError`).
- **Type aliases** represent union types, primitives, and mapped types (e.g. `LinkStatus`, `LinkState`, `QrDotStyle`, `QrMarkerStyle`, `ApiErrorCode`).

You can import all interfaces and types directly from `@linkto-so/sdk`:

```typescript
import type {
  AccountProfile,
  AccountUsage,
  BulkCreateResponse,
  BulkRejectedItem,
  ClientOptions,
  CreateLinkOptions,
  DomainSummary,
  FieldError,
  Link,
  LinkStats,
  LinkSummary,
  LinkSummaryPage,
  ListLinksOptions,
  QrRenderOptions,
  RoutingConfig,
  UpdateLinkOptions,
  UtmParams,
  WorkspaceStats,
} from "@linkto-so/sdk";
```

---

## Dual ESM & CommonJS Module Interoperability

The SDK package is built with `tsup` into dual distribution formats with unconditional `exports` mapping in `package.json`:

```json
{
  "name": "@linkto-so/sdk",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### ECMAScript Modules (ESM)

Works seamlessly with Node.js ESM (`"type": "module"`), Vite, Next.js, Remix, Astro, Bun, Deno, and Cloudflare Workers:

```typescript
// Named import (recommended)
import { Linkto, QR_DOT_STYLE } from "@linkto-so/sdk";

// Default import also supported
import Linkto from "@linkto-so/sdk";

const linkto = new Linkto();
```

### CommonJS (CJS)

Works with legacy Node.js projects, older build pipelines, and Jest test runners:

```javascript
// Destructured require
const { Linkto, QR_DOT_STYLE } = require("@linkto-so/sdk");

// Or default require
const Linkto = require("@linkto-so/sdk").default;

const linkto = new Linkto();
```

### Runtime Environment Compatibility

The SDK requires zero runtime dependencies and only relies on standard `fetch`. It works out of the box in:
- Node.js 18.0.0 or higher
- Bun 1.0 or higher
- Deno 1.30 or higher
- Cloudflare Workers / Pages Functions
- Modern browsers (Chrome, Firefox, Safari, Edge)
