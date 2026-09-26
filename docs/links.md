# Links

The `links` resource provides methods to create, retrieve, list, update, rotate, and manage smart links and QR codes.

## Initializing the Client

```typescript
import { Linkto } from "@linkto-so/sdk";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

---

## Creating Links

Links can be created using either `url` or `destination` as the destination parameter.

```typescript
const link = await linkto.links.create({
  url: "https://example.com/product/summer-shoes",
  title: "Summer Shoes Promo",
  description: "Limited summer collection launch",
  slug: "summer-shoes",
  domain: "linkto.so",
  tags: ["marketing", "summer-2026"],
});

console.log("Link ID:", link.id);
console.log("Short URL:", link.shortUrl); // e.g. https://linkto.so/summer-shoes
console.log("Alias URL:", link.aliasUrl); // e.g. https://shor.ink/summer-shoes
```

### Destination Parameters

- `url`: Target URL for redirection.
- `destination`: Alternative alias for `url`. If both are provided, `destination` takes precedence.

### Secondary Alias URLs

When creating links under the default domain (`linkto.so` or `localhost` in local development), the SDK automatically enriches the return payload with an `aliasUrl` attribute pointing to `https://shor.ink/:slug`. This provides a secondary, ultra-short redirect alias for SMS and print campaigns.

```typescript
console.log(link.shortUrl); // "https://linkto.so/summer-shoes"
console.log(link.aliasUrl); // "https://shor.ink/summer-shoes"
```

### Custom Domains

If your workspace has verified custom domains configured, specify the `domain` option:

```typescript
const customLink = await linkto.links.create({
  url: "https://example.com/promo",
  domain: "go.brand.com",
  slug: "deal",
});

console.log(customLink.shortUrl); // "https://go.brand.com/deal"
```

### Link Expiration

Set an optional expiration timestamp using an ISO 8601 string:

```typescript
const expiringLink = await linkto.links.create({
  url: "https://example.com/flash-sale",
  expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(), // 7 days from now
});
```

---

## Device-Aware Routing

Device routing allows a single smart link to detect the visitor's operating system and redirect them to targeted destinations, while sending other devices to a default fallback.

```typescript
const smartLink = await linkto.links.create({
  url: "https://myapp.com/download",
  title: "Download App",
  routing: {
    ios: "https://apps.apple.com/app/id1234567890",
    android: "https://play.google.com/store/apps/details?id=com.myapp",
    fallback: "https://myapp.com/download",
    endedUrl: "https://myapp.com/campaign-ended", // destination if expired
  },
});
```

---

## UTM Campaign Tagging

Attach standard UTM parameters directly to link configurations to ensure accurate tracking in analytics platforms:

```typescript
const trackedLink = await linkto.links.create({
  url: "https://example.com/landing",
  utm: {
    source: "newsletter",
    medium: "email",
    campaign: "spring_sale",
    term: "shoes",
    content: "hero_banner",
  },
});
```

---

## Retrieving a Link

Fetch full details for a link by its unique ID:

```typescript
const link = await linkto.links.get("lnk_abc123");

console.log("Title:", link.title);
console.log("Clicks:", link.clicks);
console.log("QR Code SVG:", link.qrCode);
console.log("Status:", link.status); // "active", "archived", or "disabled"
console.log("State:", link.state);   // "active", "expired", "archived", or "disabled"
```

---

## Listing Links & History

Retrieve paginated lists of links with optional filtering by status, search query, or tag:

```typescript
const page = await linkto.links.list({
  limit: 25,
  status: "active",
  search: "summer",
  tag: "marketing",
  sparkline: 7, // include 7-day click sparkline array
});

for (const item of page.links) {
  console.log(`- [${item.slug}] ${item.shortUrl} (${item.clicks} clicks)`);
  if (item.sparkline) {
    console.log("  Sparkline:", item.sparkline);
  }
}

// Fetch the next page if a cursor is present
if (page.cursor) {
  const nextPage = await linkto.links.list({
    limit: 25,
    cursor: page.cursor,
  });
}
```

### The `history()` Alias

`linkto.links.history(options)` is an alias for `linkto.links.list(options)`:

```typescript
const history = await linkto.links.history({ limit: 10 });
```

---

## Updating Links

Update metadata, destination URL, device routing, tags, or status on an existing link:

```typescript
import { LINK_STATUS } from "@linkto-so/sdk";

const updated = await linkto.links.update("lnk_abc123", {
  title: "Updated Promotion Title",
  destination: "https://example.com/new-landing-page",
  tags: ["marketing", "updated"],
  status: LINK_STATUS.ACTIVE,
});
```

---

## Rotating Slugs

If a short link slug has been compromised or needs to be changed without losing stats and configuration, call `rotate()`:

```typescript
const rotated = await linkto.links.rotate("lnk_abc123");

console.log("New Slug:", rotated.slug);
console.log("New Short URL:", rotated.shortUrl);
```

---

## Password Protection

Secure links so visitors must enter a password before being redirected:

```typescript
// Set or update a password on a link
await linkto.links.setPassword("lnk_abc123", "super-secret-password");

// Remove password protection
await linkto.links.removePassword("lnk_abc123");
```

---

## Deleting Links

Delete a link by ID. In Linkto, link deletion is soft, safely archiving the slug while preserving click history:

```typescript
await linkto.links.delete("lnk_abc123");
```

---

## Bulk Link Creation

Create up to 100 links in a single atomic batch request. The SDK normalizes destination parameters and enriches created items with aliases.

```typescript
const batchResult = await linkto.links.bulkCreate([
  {
    url: "https://example.com/page-1",
    title: "Page One",
    slug: "page-1",
  },
  {
    destination: "https://example.com/page-2",
    title: "Page Two",
    slug: "page-2",
  },
  {
    url: "not-a-valid-url",
    title: "Page Three",
  },
]);

console.log("All succeeded:", batchResult.allSucceeded); // boolean
console.log("Has failures:", batchResult.hasFailures);   // boolean

// Inspect successfully created links
for (const created of batchResult.created) {
  console.log(`Created: ${created.slug} -> ${created.shortUrl}`);
  if (created.aliasUrl) {
    console.log(`Alias:   ${created.aliasUrl}`);
  }
}

// Inspect rejected items with validation error details
if (batchResult.hasFailures) {
  for (const rejected of batchResult.rejected) {
    console.error(
      `Item at index ${rejected.index} failed on field "${rejected.field}": ${rejected.message}`,
    );
  }
}
```

### `BulkCreateResponse` Shape

```typescript
interface BulkCreateResponse {
  created: LinkSummary[];
  rejected: BulkRejectedItem[];
  allSucceeded: boolean;
  hasFailures: boolean;
}

interface BulkRejectedItem {
  index: number;
  field: string;
  message: string;
}
```
