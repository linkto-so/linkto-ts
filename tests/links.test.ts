import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/internal/http.js";
import type {
  BulkRejectedItem,
  CreateLinkOptions,
  Link,
  LinkSummary,
  LinkSummaryPage,
  UpdateLinkOptions,
} from "../src/models.js";
import { LinksResource, enrichLink } from "../src/resources/links.js";

function createMockLink(overrides: Partial<Link> = {}): Link {
  return {
    id: "lnk_123",
    slug: "custom-slug",
    domain: "linkto.so",
    shortUrl: "https://linkto.so/custom-slug",
    url: "https://example.com/target",
    title: "Example Title",
    description: "Example Description",
    status: "active",
    state: "active",
    clicks: 42,
    lastClickedAt: "2026-09-26T10:00:00Z",
    expiresAt: null,
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-21T00:00:00Z",
    routing: null,
    protected: false,
    utm: {},
    tags: ["test"],
    externalId: null,
    qrCode:
      "https://linkto.so/api/v1/qr?url=https%3A%2F%2Flinkto.so%2Fcustom-slug",
    ...overrides,
  };
}

describe("LinksResource", () => {
  describe("enrichLink helper", () => {
    it("sets aliasUrl when domain is linkto.so and aliasUrl is missing", () => {
      const summary: LinkSummary = {
        id: "lnk_1",
        slug: "abc12",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/abc12",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const enriched = enrichLink(summary);
      expect(enriched.aliasUrl).toBe("https://shor.ink/abc12");
    });

    it("sets aliasUrl when domain is localhost and aliasUrl is missing", () => {
      const summary: LinkSummary = {
        id: "lnk_2",
        slug: "local-slug",
        domain: "localhost",
        shortUrl: "http://localhost:3000/local-slug",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const enriched = enrichLink(summary);
      expect(enriched.aliasUrl).toBe("https://shor.ink/local-slug");
    });

    it("preserves existing aliasUrl", () => {
      const summary: LinkSummary = {
        id: "lnk_3",
        slug: "existing-alias",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/existing-alias",
        aliasUrl: "https://custom-alias.example.com/existing-alias",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const enriched = enrichLink(summary);
      expect(enriched.aliasUrl).toBe(
        "https://custom-alias.example.com/existing-alias",
      );
    });

    it("does not set aliasUrl for custom domains", () => {
      const summary: LinkSummary = {
        id: "lnk_4",
        slug: "custom-slug",
        domain: "go.brand.com",
        shortUrl: "https://go.brand.com/custom-slug",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const enriched = enrichLink(summary);
      expect(enriched.aliasUrl).toBeUndefined();
    });
  });

  describe("create", () => {
    it("creates a link normalizing url to destination", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({
              slug: "url-norm",
              domain: "linkto.so",
            }),
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const options: CreateLinkOptions = {
        url: "https://my-destination.com/page",
        title: "My Page",
      };

      const result = await links.create(options);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links");
      expect(reqInit.method).toBe("POST");

      const sentBody = JSON.parse(reqInit.body as string);
      expect(sentBody.destination).toBe("https://my-destination.com/page");
      expect(sentBody.url).toBeUndefined();
      expect(sentBody.title).toBe("My Page");

      expect(result.aliasUrl).toBe("https://shor.ink/url-norm");
    });

    it("preserves destination when destination is explicitly provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({
              slug: "dest-explicit",
              domain: "linkto.so",
            }),
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const options: CreateLinkOptions = {
        destination: "https://explicit-destination.com",
        url: "https://ignored-url.com",
        title: "Explicit",
      };

      const result = await links.create(options);

      const [, reqInit] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(reqInit.body as string);
      expect(sentBody.destination).toBe("https://explicit-destination.com");
      expect(sentBody.url).toBeUndefined();
      expect(result.aliasUrl).toBe("https://shor.ink/dest-explicit");
    });
  });

  describe("get", () => {
    it("retrieves a link and returns it enriched", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({
              id: "lnk_abc",
              slug: "my-link",
              domain: "linkto.so",
            }),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.get("lnk_abc");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_abc");
      expect(result.id).toBe("lnk_abc");
      expect(result.aliasUrl).toBe("https://shor.ink/my-link");
    });

    it("properly encodes special characters in id", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({ id: "lnk/special id" }),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.get("lnk/special id");

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe(
        "https://linkto.so/api/v1/links/lnk%2Fspecial%20id",
      );
    });
  });

  describe("list and history", () => {
    it("serializes list options into query parameters and enriches links", async () => {
      const pageData: LinkSummaryPage = {
        links: [
          {
            id: "lnk_1",
            slug: "item-1",
            domain: "linkto.so",
            shortUrl: "https://linkto.so/item-1",
            url: "https://example.com/1",
            title: "Item 1",
            description: null,
            status: "active",
            state: "active",
            clicks: 5,
            lastClickedAt: null,
            expiresAt: null,
            createdAt: "2026-09-26T00:00:00Z",
          },
          {
            id: "lnk_2",
            slug: "item-2",
            domain: "custom.com",
            shortUrl: "https://custom.com/item-2",
            url: "https://example.com/2",
            title: "Item 2",
            description: null,
            status: "active",
            state: "active",
            clicks: 10,
            lastClickedAt: null,
            expiresAt: null,
            createdAt: "2026-09-26T00:00:00Z",
          },
        ],
        cursor: "next_cursor_token",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: pageData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.list({
        limit: 25,
        cursor: "cur_abc",
        status: "active",
        search: "test query",
        tag: "promo",
        sparkline: 14,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/links");
      expect(parsed.searchParams.get("limit")).toBe("25");
      expect(parsed.searchParams.get("cursor")).toBe("cur_abc");
      expect(parsed.searchParams.get("status")).toBe("active");
      expect(parsed.searchParams.get("search")).toBe("test query");
      expect(parsed.searchParams.get("tag")).toBe("promo");
      expect(parsed.searchParams.get("sparkline")).toBe("14");

      expect(result.cursor).toBe("next_cursor_token");
      expect(result.links[0].aliasUrl).toBe("https://shor.ink/item-1");
      expect(result.links[1].aliasUrl).toBeUndefined();
    });

    it("handles list without options calling /api/v1/links", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { links: [], cursor: null },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.list();

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links");
    });

    it("history is an alias for list", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { links: [], cursor: null },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.history({ limit: 10 });

      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/links");
      expect(parsed.searchParams.get("limit")).toBe("10");
    });
  });

  describe("update", () => {
    it("updates a link normalizing url to destination", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({
              id: "lnk_upd",
              slug: "updated-link",
              domain: "linkto.so",
            }),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const options: UpdateLinkOptions = {
        url: "https://new-target.com",
        title: "Updated Title",
      };

      const result = await links.update("lnk_upd", options);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_upd");
      expect(reqInit.method).toBe("PATCH");

      const sentBody = JSON.parse(reqInit.body as string);
      expect(sentBody.destination).toBe("https://new-target.com");
      expect(sentBody.url).toBeUndefined();
      expect(sentBody.title).toBe("Updated Title");

      expect(result.aliasUrl).toBe("https://shor.ink/updated-link");
    });
  });

  describe("delete", () => {
    it("deletes a link by id", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.delete("lnk_del");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_del");
      expect(reqInit.method).toBe("DELETE");
    });
  });

  describe("stats and visitStats", () => {
    it("fetches link stats with optional days and breakdown", async () => {
      const statsPayload = {
        clicks: 120,
        timeZone: "UTC",
        byDay: [{ day: "2026-09-25", clicks: 120 }],
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: statsPayload }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.stats("lnk_stat", {
        days: 7,
        breakdown: "devices",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/links/lnk_stat/stats");
      expect(parsed.searchParams.get("days")).toBe("7");
      expect(parsed.searchParams.get("breakdown")).toBe("devices");
      expect(result.clicks).toBe(120);
    });

    it("visitStats is an alias for stats", async () => {
      const statsPayload = { clicks: 50, timeZone: "America/New_York" };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: statsPayload }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.visitStats("lnk_stat", { days: 30 });
      expect(result.clicks).toBe(50);

      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/links/lnk_stat/stats");
      expect(parsed.searchParams.get("days")).toBe("30");
    });
  });

  describe("rotate", () => {
    it("calls POST /rotate and returns enriched link", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: createMockLink({
              id: "lnk_rot",
              slug: "new-rotated-slug",
              domain: "linkto.so",
            }),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.rotate("lnk_rot");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_rot/rotate");
      expect(reqInit.method).toBe("POST");
      expect(result.slug).toBe("new-rotated-slug");
      expect(result.aliasUrl).toBe("https://shor.ink/new-rotated-slug");
    });
  });

  describe("setPassword and removePassword", () => {
    it("setPassword calls PUT /password with password in body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { success: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.setPassword("lnk_pwd", "mypassword123");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_pwd/password");
      expect(reqInit.method).toBe("PUT");
      expect(JSON.parse(reqInit.body as string)).toEqual({
        password: "mypassword123",
      });
    });

    it("removePassword calls DELETE /password", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      await links.removePassword("lnk_pwd");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/lnk_pwd/password");
      expect(reqInit.method).toBe("DELETE");
    });
  });

  describe("bulkCreate", () => {
    it("maps allSucceeded: true and hasFailures: false when all items succeed", async () => {
      const createdItem: LinkSummary = {
        id: "lnk_b1",
        slug: "bulk-1",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/bulk-1",
        url: "https://dest1.com",
        title: "Bulk 1",
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              created: [createdItem],
              rejected: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.bulkCreate([
        { url: "https://dest1.com", title: "Bulk 1" },
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/links/bulk");
      expect(reqInit.method).toBe("POST");

      const sentBody = JSON.parse(reqInit.body as string);
      expect(sentBody.links[0].destination).toBe("https://dest1.com");
      expect(sentBody.links[0].url).toBeUndefined();

      expect(result.allSucceeded).toBe(true);
      expect(result.hasFailures).toBe(false);
      expect(result.created).toHaveLength(1);
      expect(result.created[0].aliasUrl).toBe("https://shor.ink/bulk-1");
      expect(result.rejected).toHaveLength(0);
    });

    it("maps allSucceeded: false and hasFailures: true when some items fail", async () => {
      const createdItem: LinkSummary = {
        id: "lnk_b2",
        slug: "bulk-2",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/bulk-2",
        url: "https://dest2.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2026-09-26T00:00:00Z",
      };

      const rejectedItem: BulkRejectedItem = {
        index: 1,
        field: "url",
        message: "Invalid target URL",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              created: [createdItem],
              rejected: [rejectedItem],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const links = new LinksResource(client);

      const result = await links.bulkCreate([
        { destination: "https://dest2.com" },
        { url: "invalid-url" },
      ]);

      expect(result.allSucceeded).toBe(false);
      expect(result.hasFailures).toBe(true);
      expect(result.created).toHaveLength(1);
      expect(result.rejected).toHaveLength(1);
      expect(result.rejected[0].index).toBe(1);
      expect(result.rejected[0].message).toBe("Invalid target URL");
    });
  });
});
