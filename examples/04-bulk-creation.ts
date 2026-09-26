import { Linkto } from "../src/index.js";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});

async function main() {
  console.log("=== Linkto SDK: Batch Link Creation ===\n");

  const batchPayload = [
    {
      url: "https://example.com/products/running-shoes",
      title: "Running Shoes",
      slug: "running-shoes",
    },
    {
      url: "https://example.com/products/windbreaker",
      title: "Trail Windbreaker",
      slug: "trail-windbreaker",
    },
    {
      url: "invalid-url-format", // intentionally invalid to demonstrate rejected items
      title: "Invalid Item",
      slug: "invalid-item",
    },
  ];

  console.log(`Submitting batch creation of ${batchPayload.length} link(s)...`);
  const res = await linkto.links.bulkCreate(batchPayload);

  console.log("\nBatch result summary:");
  console.log(`  - allSucceeded: ${res.allSucceeded}`);
  console.log(`  - hasFailures:  ${res.hasFailures}`);
  console.log(`  - Created count:  ${res.created.length}`);
  console.log(`  - Rejected count: ${res.rejected.length}`);

  // Inspect successfully created links
  if (res.created.length > 0) {
    console.log("\nCreated links:");
    for (const link of res.created) {
      console.log(`  ✓ [${link.slug}] ${link.title ?? "Untitled"}`);
      console.log(`    Short URL: ${link.shortUrl}`);
    }
  }

  // Inspect rejected items with validation/constraint reasons
  if (res.hasFailures) {
    console.log("\nRejected items:");
    for (const item of res.rejected) {
      console.log(
        `  ✗ Index ${item.index} (Field: "${item.field}"): ${item.message}`,
      );
    }
  }
}

main().catch((err) => {
  console.error("Failed to run bulk-creation example:", err);
  process.exit(1);
});
