# Analytics

The Linkto SDK provides real-time click metrics and demographic breakdowns at both the workspace level and the individual link level.

## Initializing the Client

```typescript
import { Linkto } from "@linkto-so/sdk";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

---

## Workspace Analytics

Query aggregated click metrics across all links in your active workspace using `linkto.analytics.get(options)`.

```typescript
// Fetch workspace stats for the past 30 days (default is 7 or 30 days)
const workspaceStats = await linkto.analytics.get({ days: 30 });

console.log("Total Workspace Clicks:", workspaceStats.clicks);

if (workspaceStats.byDay) {
  console.log("\nDaily Click Trends:");
  for (const entry of workspaceStats.byDay) {
    console.log(`  ${entry.day}: ${entry.clicks} click(s)`);
  }
}
```

### `WorkspaceStats` Model

```typescript
interface WorkspaceStats {
  clicks: number;
  timeZone?: string;
  grain?: "hour" | "day";
  timeseries?: Array<{ date: string; clicks: number }>;
  byDay?: Array<{ day: string; clicks: number }>;
  devices?: Array<{ name: string; clicks: number; sharePct: number }>;
  browsers?: Array<{ name: string; clicks: number; sharePct: number }>;
  hardware?: Array<{ name: string; clicks: number; sharePct: number }>;
  countries?: Array<{ name: string; clicks: number; sharePct: number }>;
  channels?: Array<{ name: string; clicks: number; sharePct: number }>;
}
```

---

## Link Analytics

Retrieve detailed analytics for a single short link using either `linkto.links.stats()`, its alias `linkto.links.visitStats()`, or `linkto.analytics.forLink()`.

The `breakdown` query parameter accepts a single dimension per request: `"device"`, `"browser"`, `"os"`, or `"country"`.

```typescript
const stats = await linkto.links.stats("lnk_abc123", {
  days: 14,
  breakdown: "device",
});

console.log("Link Clicks:", stats.clicks);
if (stats.breakdowns?.device) {
  console.log("Device Breakdown:", stats.breakdowns.device);
}
```

### Method Aliases

The following calls are completely equivalent:

```typescript
// 1. Through the links resource:
await linkto.links.stats("lnk_abc123", { days: 30 });

// 2. Convenience alias on links:
await linkto.links.visitStats("lnk_abc123", { days: 30 });

// 3. Through the analytics resource:
await linkto.analytics.forLink("lnk_abc123", { days: 30 });
```

---

## Breakdowns & Dimension Metrics

The `LinkStats` response contains timeseries metrics and breakdown data:

```typescript
interface LinkStats {
  clicks: number;
  timeZone?: string;
  grain?: "hour" | "day";
  timeseries?: Array<{ date: string; clicks: number }>;
  byDay?: Array<{ day: string; clicks: number }>;
  breakdowns?: Partial<Record<string, Array<{ name: string; clicks: number; sharePct: number }>>>;
  byDevice?: Record<string, number>;
  byBrowser?: Record<string, number>;
  byOs?: Record<string, number>;
  byCountry?: Record<string, number>;
  scanned?: { clicks: number };
  configured?: boolean;
}
```

### 1. Daily Trends (`byDay`)

```typescript
if (stats.byDay) {
  for (const day of stats.byDay) {
    console.log(`${day.day}: ${day.clicks}`);
  }
}
```

### 2. Device Breakdown (`byDevice`)

Categorizes clicks by form factor (e.g. `desktop`, `mobile`, `tablet`):

```typescript
if (stats.byDevice) {
  console.log("Clicks by Device:");
  for (const [device, count] of Object.entries(stats.byDevice)) {
    console.log(`  - ${device}: ${count}`);
  }
}
```

### 3. Browser Breakdown (`byBrowser`)

Categorizes clicks by web browser (e.g. `Chrome`, `Safari`, `Firefox`, `Edge`):

```typescript
if (stats.byBrowser) {
  console.log("Clicks by Browser:");
  for (const [browser, count] of Object.entries(stats.byBrowser)) {
    console.log(`  - ${browser}: ${count}`);
  }
}
```

### 4. Operating System Breakdown (`byOs`)

Categorizes clicks by operating system (e.g. `iOS`, `Android`, `macOS`, `Windows`, `Linux`):

```typescript
if (stats.byOs) {
  console.log("Clicks by OS:");
  for (const [os, count] of Object.entries(stats.byOs)) {
    console.log(`  - ${os}: ${count}`);
  }
}
```

### 5. Geographic Country Breakdown (`byCountry`)

Categorizes clicks by two-letter ISO country codes (e.g. `US`, `GB`, `DE`, `VN`):

```typescript
if (stats.byCountry) {
  console.log("Clicks by Country:");
  for (const [country, count] of Object.entries(stats.byCountry)) {
    console.log(`  - ${country}: ${count}`);
  }
}
```

---

## Sparklines on Link Listings

When fetching lists of links, pass `sparkline: 7` or `sparkline: 30` to receive an inline array of daily click counts for quick visualization in dashboard UIs:

```typescript
const page = await linkto.links.list({
  limit: 20,
  sparkline: 7, // 7-day sparkline
});

for (const link of page.links) {
  console.log(`${link.title ?? link.slug}: ${link.clicks} total clicks`);
  if (link.sparkline) {
    console.log("  Sparkline points:", link.sparkline.join(" -> "));
  }
}
```
