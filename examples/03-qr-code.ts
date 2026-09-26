import { Linkto, QR_DOT_STYLE, QR_MARKER_STYLE } from "../src/index.js";

const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});

async function main() {
  console.log("=== Linkto SDK: QR Code Customization & Rendering ===\n");

  // 1. Create a short link to attach the QR code to
  console.log("1. Creating a short link for QR code generation...");
  const link = await linkto.links.create({
    url: "https://example.com/summer-promo",
    title: "Summer Promotion",
    slug: "summer-promo",
  });
  console.log(`Link created: ${link.shortUrl}`);

  // 2. Define QR customization options
  const qrOptions = {
    url: link.shortUrl,
    fgColor: "#0f172a",
    bgColor: "#ffffff",
    dotStyle: QR_DOT_STYLE.ROUNDED,
    markerStyle: QR_MARKER_STYLE.ROUNDED,
    caption: "Scan me",
  };

  // 3. Generate a direct image URL (synchronous, ideal for <img src="..."> in web apps)
  const qrImageUrl = linkto.qr.getUrl(qrOptions);
  console.log("\n2. Direct QR code image URL (synchronous):");
  console.log(`  ${qrImageUrl}`);
  console.log(`  Usage: <img src="${qrImageUrl}" alt="Scan QR code" />`);

  // 4. Fetch raw SVG markup asynchronously (ideal for SSR, embedding inline, or file storage)
  console.log("\n3. Fetching raw SVG markup (asynchronous)...");
  const svgMarkup = await linkto.qr.getSvg(qrOptions);
  console.log(
    `  Fetched SVG markup successfully (${svgMarkup.length} characters)`,
  );
  console.log("  SVG snippet:");
  console.log(`  ${svgMarkup.slice(0, 150)}...`);
}

main().catch((err) => {
  console.error("Failed to run qr-code example:", err);
  process.exit(1);
});
