import { Linkto } from "../src/index.js";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});

async function main() {
  console.log("=== Linkto SDK: Device-Aware Routing & Analytics ===\n");

  // 1. Create a smart link that redirects visitors based on their operating system
  console.log("1. Creating a device-aware smart link with UTM tagging...");
  const link = await linkto.links.create({
    destination: "https://myapp.com/download",
    title: "Download App - Mobile & Desktop",
    routing: {
      ios: "https://apps.apple.com/app/id1234567890",
      android: "https://play.google.com/store/apps/details?id=com.myapp",
      fallback: "https://myapp.com/download",
    },
    utm: {
      source: "newsletter",
      medium: "email",
      campaign: "launch",
    },
  });

  console.log("Smart link created successfully:");
  console.log(`  - Short URL:       ${link.shortUrl}`);
  console.log(`  - Desktop/Fallback: ${link.url}`);
  console.log(`  - iOS Route:       ${link.routing?.ios}`);
  console.log(`  - Android Route:   ${link.routing?.android}`);
  console.log(`  - UTM Campaign:    ${link.utm?.campaign}`);

  // 2. Fetch click analytics for the past 30 days
  console.log(`\n2. Fetching 30-day analytics for link (${link.id})...`);
  const stats = await linkto.links.stats(link.id, { days: 30 });

  console.log("Analytics summary:");
  console.log(`  - Total clicks: ${stats.clicks}`);
  console.log(`  - Timezone:     ${stats.timeZone}`);

  if (stats.byDevice && Object.keys(stats.byDevice).length > 0) {
    console.log("  - Clicks by device:");
    for (const [device, count] of Object.entries(stats.byDevice)) {
      console.log(`      * ${device}: ${count}`);
    }
  }

  if (stats.byDay && stats.byDay.length > 0) {
    console.log(`  - Daily breakdown: ${stats.byDay.length} day(s) recorded`);
  }
}

main().catch((err) => {
  console.error("Failed to run device-routing example:", err);
  process.exit(1);
});
