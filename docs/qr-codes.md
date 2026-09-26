# QR Codes

The `qr` resource provides methods to generate customized QR codes for any destination or short link. The SDK offers two complementary approaches:
1. **Synchronous URL formatting (`getUrl`)**: Instantly creates an image URL without an extra network request, ideal for React / JSX / HTML `<img src="..." />` tags.
2. **Asynchronous SVG markup (`getSvg`)**: Fetches raw SVG XML markup, ideal for server-side rendering, document generation, PDF creation, or offline storage.

## Initializing the Client

```typescript
import { Linkto, QR_DOT_STYLE, QR_MARKER_STYLE } from "@linkto-so/sdk";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

---

## Configuration Options (`QrRenderOptions`)

All QR generation methods accept a `QrRenderOptions` object:

| Property | Type | Description | Default |
|:---------|:-----|:------------|:--------|
| `url` | `string` | **Required.** The destination or short URL to encode. | - |
| `fgColor` | `string` | Hex color code for the foreground QR code elements. | `"#000000"` |
| `bgColor` | `string` | Hex color code for the background canvas. | `"#ffffff"` |
| `dotStyle` | `QrDotStyle` | Pattern style for data dots (`"rounded"`, `"square"`, `"dots"`). | `"rounded"` |
| `markerStyle` | `QrMarkerStyle` | Corner eye positioning marker style (`"rounded"`, `"square"`, `"circle"`). | `"rounded"` |
| `caption` | `string` | Optional human-readable caption text displayed under the QR code. | `undefined` |

### Style Constants

The SDK exports object constants with `as const` for IDE autocomplete:

```typescript
import { QR_DOT_STYLE, QR_MARKER_STYLE } from "@linkto-so/sdk";

// Dot pattern options:
QR_DOT_STYLE.ROUNDED; // "rounded"
QR_DOT_STYLE.SQUARE;  // "square"
QR_DOT_STYLE.DOTS;    // "dots"

// Eye marker options:
QR_MARKER_STYLE.ROUNDED; // "rounded"
QR_MARKER_STYLE.SQUARE;  // "square"
QR_MARKER_STYLE.CIRCLE;  // "circle"
```

---

## 1. Synchronous Image URL (`getUrl`)

`linkto.qr.getUrl(options)` synchronously constructs the full endpoint URL. Because no HTTP call is made, this is fast, non-blocking, and suitable for client-side or server-side component rendering.

```typescript
import { Linkto, QR_DOT_STYLE, QR_MARKER_STYLE } from "@linkto-so/sdk";

const linkto = new Linkto();

const qrUrl = linkto.qr.getUrl({
  url: "https://linkto.so/promo",
  fgColor: "#0f172a",
  bgColor: "#f8fafc",
  dotStyle: QR_DOT_STYLE.ROUNDED,
  markerStyle: QR_MARKER_STYLE.ROUNDED,
  caption: "Scan for 20% off",
});

console.log(qrUrl);
// https://linkto.so/api/v1/qr?url=https%3A%2F%2Flinkto.so%2Fpromo&fgColor=%230f172a&bgColor=%23f8fafc&dotStyle=rounded&markerStyle=rounded&caption=Scan+for+20%25+off
```

### React / Next.js Component Example

```tsx
import React from "react";
import { Linkto, QR_DOT_STYLE } from "@linkto-so/sdk";

const linkto = new Linkto();

export function PromoCard({ shortUrl }: { shortUrl: string }) {
  const qrSrc = linkto.qr.getUrl({
    url: shortUrl,
    fgColor: "#1e293b",
    dotStyle: QR_DOT_STYLE.DOTS,
    caption: "Scan to Visit",
  });

  return (
    <div className="promo-card">
      <h3>Special Offer</h3>
      <img
        src={qrSrc}
        alt="Promotion QR Code"
        width={240}
        height={240}
        loading="lazy"
      />
      <p>{shortUrl}</p>
    </div>
  );
}
```

---

## 2. Asynchronous SVG Markup (`getSvg`)

`linkto.qr.getSvg(options)` performs an HTTP request to the `/api/v1/qr` endpoint with `Accept: image/svg+xml` and returns the raw SVG string.

```typescript
import { Linkto, QR_DOT_STYLE, QR_MARKER_STYLE } from "@linkto-so/sdk";
import * as fs from "node:fs/promises";

const linkto = new Linkto();

const svgMarkup = await linkto.qr.getSvg({
  url: "https://linkto.so/summer",
  fgColor: "#000000",
  bgColor: "#ffffff",
  dotStyle: QR_DOT_STYLE.SQUARE,
  markerStyle: QR_MARKER_STYLE.CIRCLE,
  caption: "Summer 2026",
});

// Save directly to disk
await fs.writeFile("qr-code.svg", svgMarkup, "utf8");
console.log("SVG saved successfully!");
```

### Server-Side Rendering / Inline SVG

```tsx
import { Linkto, QR_DOT_STYLE } from "@linkto-so/sdk";

const linkto = new Linkto();

export async function SvgQrView({ targetUrl }: { targetUrl: string }) {
  const svg = await linkto.qr.getSvg({
    url: targetUrl,
    dotStyle: QR_DOT_STYLE.ROUNDED,
  });

  return (
    <div
      className="qr-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

---

## QR Code Included with Link Creation

When a short link is created via `linkto.links.create(...)` or fetched via `linkto.links.get(...)`, the returned `Link` model already contains a default `qrCode` SVG data URI:

```typescript
const link = await linkto.links.create({
  url: "https://example.com",
});

// Default QR code SVG data URI is readily available
console.log(link.qrCode);
```
