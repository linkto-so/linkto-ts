import { Linkto, LinktoApiError } from "../src/index.js";

// Initialize the Linkto client once for use across route handler invocations.
// In Next.js, process.env.LINKTO_API_KEY is available server-side.
const linkto = new Linkto({
  apiKey: process.env.LINKTO_API_KEY,
});

/**
 * Next.js App Router route handler (e.g., app/api/links/route.ts).
 *
 * Handles POST requests to shorten a link:
 *   POST /api/links
 *   Content-Type: application/json
 *   {
 *     "url": "https://example.com/docs",
 *     "title": "Documentation",
 *     "slug": "docs"
 *   }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      url?: string;
      title?: string;
      slug?: string;
    };

    // 1. Basic server-side request validation
    if (!body || typeof body.url !== "string" || !body.url.trim()) {
      return Response.json(
        {
          error: "Validation failed",
          fieldErrors: [
            {
              field: "url",
              message: "The 'url' parameter is required and cannot be empty.",
            },
          ],
        },
        { status: 400 },
      );
    }

    // 2. Call the Linkto SDK to create the link
    const link = await linkto.links.create({
      url: body.url.trim(),
      title: body.title?.trim(),
      slug: body.slug?.trim(),
    });

    // 3. Return created resource
    return Response.json(
      {
        success: true,
        data: {
          id: link.id,
          shortUrl: link.shortUrl,
          aliasUrl: link.aliasUrl,
          destination: link.url,
          title: link.title,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // 4. Catch and translate Linkto API errors
    if (err instanceof LinktoApiError) {
      return Response.json(
        {
          error: err.message,
          code: err.code,
          fieldErrors: err.fieldErrors,
        },
        { status: err.status },
      );
    }

    // Fallback for unexpected runtime or internal errors
    console.error("Unhandled error in POST /api/links:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Self-test runner when executed directly via Node / tsx
if (process.argv[1]?.endsWith("05-nextjs-route.ts")) {
  const simulatedRequest = new Request("http://localhost:3000/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://example.com/demo-page",
      title: "Demo Page",
    }),
  });

  console.log("Simulating Next.js App Router POST request...");
  POST(simulatedRequest)
    .then(async (res) => {
      console.log(`Response status: ${res.status}`);
      const data = await res.json();
      console.log("Response body:", data);
    })
    .catch((err) => {
      console.error("Handler error:", err);
    });
}
