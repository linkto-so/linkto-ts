# Account & Workspaces

The Linkto SDK provides utilities to inspect authentication credentials, monitor workspace usage quotas, manage custom domains, list workspace tags, and provision API tokens.

## Initializing the Client

```typescript
import { Linkto } from "@linkto-so/sdk";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});
```

---

## Token Verification (`linkto.account.checkToken`)

Verify that your API token is valid and retrieve the associated workspace identity:

```typescript
const profile = await linkto.account.checkToken();

console.log("Workspace ID:", profile.workspaceId);
console.log("User / Workspace Name:", profile.name);
console.log("Role:", profile.role);
console.log("Token Valid:", profile.tokenValid);
```

### `AccountProfile` Model

```typescript
interface AccountProfile {
  workspaceId: string;
  name: string;
  role: string;
  tokenValid: boolean;
}
```

---

## Subscription & Usage Monitoring (`linkto.account.usage`)

Check your current plan tier and monitor resource consumption against plan limits to avoid encountering `LinktoQuotaExceededError`:

```typescript
const usage = await linkto.account.usage();

console.log("Current Plan:", usage.plan);
console.log(`Links Created: ${usage.linksUsage} / ${usage.linksLimit ?? "unlimited"}`);
console.log(`Clicks Recorded: ${usage.clicksUsage} / ${usage.clicksLimit ?? "unlimited"}`);

if (usage.linksLimit !== null && usage.linksUsage >= usage.linksLimit * 0.9) {
  console.warn("Warning: Approaching 90% of monthly link creation limit.");
}
```

### `AccountUsage` Model

```typescript
interface AccountUsage {
  plan: string;
  linksUsage: number;
  linksLimit: number | null;
  clicksUsage: number;
  clicksLimit: number | null;
}
```

---

## Custom Domains (`linkto.domains.list`)

Retrieve all custom domains configured for your workspace and check their verification and primary routing status:

```typescript
const domains = await linkto.domains.list();

for (const d of domains) {
  console.log(`- Domain:   ${d.domain}`);
  console.log(`  ID:       ${d.id}`);
  console.log(`  Status:   ${d.status}`); // "pending", "active", or "failed"
  console.log(`  Verified: ${d.verified}`);
  console.log(`  Primary:  ${d.primary}`);
  console.log(`  Created:  ${d.createdAt}`);
}
```

### `DomainSummary` Model

```typescript
interface DomainSummary {
  id: string;
  domain: string;
  status: "pending" | "active" | "failed";
  verified: boolean;
  primary: boolean;
  createdAt: string;
}
```

---

## Workspace Tags (`linkto.tags.list`)

Retrieve a list of all distinct tags currently used across links in your workspace. Useful for autocompletion inputs and filter controls in management dashboards:

```typescript
const tags = await linkto.tags.list();

console.log("Active workspace tags:", tags.join(", "));
// e.g. ["marketing", "summer-2026", "product-launch", "social"]
```

---

## Managing API Tokens (`linkto.tokens`)

Programmatically list, create, and revoke workspace API tokens.

> [!NOTE]
> **Authentication Requirement**: Token management endpoints (`linkto.tokens.*`) require an authenticated browser dashboard session cookie (`sessionOnly`). They cannot be invoked using a Bearer API token (`lnk_...`). This ensures compromised API tokens cannot mint or enumerate credentials.

### 1. Listing Tokens

```typescript
const tokens = await linkto.tokens.list();

for (const token of tokens) {
  console.log(`- Token: ${token.name} (${token.id})`);
  console.log(`  Created:   ${token.createdAt}`);
  console.log(`  Expires:   ${token.expiresAt ?? "never"}`);
  console.log(`  Last Used: ${token.lastUsedAt ?? "never"}`);
}
```

### 2. Creating a Token

Create a new token with an optional relative lifetime (`expiresIn` in seconds) or absolute date (`expiresAt`). Note that the full `token` secret string is only returned once upon creation:

```typescript
// Option A: Specify duration in relative seconds (e.g. 90 days)
const created = await linkto.tokens.create({
  name: "CI/CD Deployment Token",
  expiresIn: 90 * 86400,
});

// Option B: Specify an absolute Date or ISO string
const createdWithDate = await linkto.tokens.create({
  name: "Temporary Staging Token",
  expiresAt: new Date(Date.now() + 86400 * 1000 * 30),
});

console.log("Token ID:", created.id);
console.log("API Secret (save securely):", created.token);
```

### 3. Revoking a Token

Immediately invalidate an API token:

```typescript
await linkto.tokens.delete("tok_123456");
console.log("Token successfully revoked.");
```
