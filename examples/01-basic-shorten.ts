import { Linkto } from "../src/index.js";

// Initialize the Linkto client.
// Reads LINKTO_API_KEY from environment, with a placeholder fallback for demonstration.
const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});

async function main() {
  console.log("=== Linkto SDK: Basic Link Shortening ===\n");

  // 1. Create a short link with custom slug, title, and domain
  console.log("1. Creating a new short link...");
  const link = await linkto.links.create({
    url: "https://example.com/blog/getting-started-with-linkto",
    title: "Getting Started with Linkto",
    slug: "getting-started",
    domain: "linkto.so",
  });

  console.log("Link created successfully:");
  console.log(`  - ID:        ${link.id}`);
  console.log(`  - Title:     ${link.title}`);
  console.log(`  - Target:    ${link.url}`);
  console.log(`  - Short URL: ${link.shortUrl}`);
  if (link.aliasUrl) {
    console.log(`  - Alias URL: ${link.aliasUrl}`);
  }

  // 2. Retrieve link by ID
  console.log(`\n2. Retrieving link by ID (${link.id})...`);
  const fetched = await linkto.links.get(link.id);
  console.log(`Retrieved: "${fetched.title}" -> ${fetched.shortUrl}`);

  // 3. List recent links with pagination / history
  console.log("\n3. Listing recent links...");
  const page = await linkto.links.list({ limit: 10 });
  console.log(`Found ${page.links.length} link(s) via list():`);
  for (const item of page.links) {
    console.log(`  - [${item.slug}] ${item.shortUrl} (${item.clicks} clicks)`);
  }

  // linkto.links.history() is a convenient alias for list()
  const history = await linkto.links.history({ limit: 5 });
  console.log(`Fetched ${history.links.length} link(s) via history()`);
}

main().catch((err) => {
  console.error("Failed to run basic-shorten example:", err);
  process.exit(1);
});
