import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/internal/http.js";
import type {
  AccountProfile,
  AccountUsage,
  ApiTokenCreated,
  ApiTokenSummary,
  DomainSummary,
  LinkStats,
  WorkspaceStats,
} from "../src/models.js";
import { AccountResource } from "../src/resources/account.js";
import { AnalyticsResource } from "../src/resources/analytics.js";
import { DomainsResource } from "../src/resources/domains.js";
import { TagsResource } from "../src/resources/tags.js";
import { TokensResource } from "../src/resources/tokens.js";

describe("Account, Analytics, Domains, Tags, and Tokens Resources", () => {
  describe("AccountResource", () => {
    it("checkToken calls /api/v1/account and returns AccountProfile", async () => {
      const profile: AccountProfile = {
        workspaceId: "ws_123",
        name: "Acme Workspace",
        role: "owner",
        tokenValid: true,
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: profile }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const account = new AccountResource(client);

      const result = await account.checkToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/account");
      expect(result).toEqual(profile);
      expect(result.tokenValid).toBe(true);
    });

    it("usage calls /api/v1/account/usage and returns AccountUsage", async () => {
      const usageData: AccountUsage = {
        plan: "pro",
        linksUsage: 45,
        linksLimit: 500,
        clicksUsage: 1240,
        clicksLimit: 50000,
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: usageData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const account = new AccountResource(client);

      const result = await account.usage();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/account/usage");
      expect(result).toEqual(usageData);
      expect(result.linksUsage).toBe(45);
    });
  });

  describe("DomainsResource", () => {
    it("list calls /api/v1/domains and returns DomainSummary array", async () => {
      const domainsData: DomainSummary[] = [
        {
          id: "dom_1",
          domain: "go.brand.com",
          status: "active",
          verified: true,
          primary: true,
          createdAt: "2026-09-20T00:00:00Z",
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: domainsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const domains = new DomainsResource(client);

      const result = await domains.list();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/domains");
      expect(result).toEqual(domainsData);
      expect(result[0].domain).toBe("go.brand.com");
    });
  });

  describe("TagsResource", () => {
    it("list calls /api/v1/tags and returns string array", async () => {
      const tagsData = ["marketing", "newsletter", "twitter"];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: tagsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const tags = new TagsResource(client);

      const result = await tags.list();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/tags");
      expect(result).toEqual(tagsData);
    });
  });

  describe("AnalyticsResource", () => {
    it("get calls /api/v1/stats with optional days", async () => {
      const statsData: WorkspaceStats = {
        clicks: 3400,
        timeZone: "America/Chicago",
        byDay: [
          { day: "2026-09-24", clicks: 1700 },
          { day: "2026-09-25", clicks: 1700 },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: statsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const analytics = new AnalyticsResource(client);

      const result = await analytics.get({ days: 30 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/stats");
      expect(parsed.searchParams.get("days")).toBe("30");
      expect(result.clicks).toBe(3400);
    });

    it("get calls /api/v1/stats without params when options omitted", async () => {
      const statsData: WorkspaceStats = {
        clicks: 100,
        timeZone: "UTC",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: statsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const analytics = new AnalyticsResource(client);

      await analytics.get();

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/stats");
    });

    it("forLink calls /api/v1/links/:id/stats with query params", async () => {
      const linkStatsData: LinkStats = {
        clicks: 80,
        timeZone: "UTC",
        byDevice: { mobile: 50, desktop: 30 },
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: linkStatsData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const analytics = new AnalyticsResource(client);

      const result = await analytics.forLink("lnk_xyz", {
        days: 14,
        breakdown: "device",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/links/lnk_xyz/stats");
      expect(parsed.searchParams.get("days")).toBe("14");
      expect(parsed.searchParams.get("breakdown")).toBe("device");
      expect(result.byDevice?.mobile).toBe(50);
    });
  });

  describe("TokensResource", () => {
    it("list calls /api/v1/tokens and returns ApiTokenSummary array", async () => {
      const tokenList: ApiTokenSummary[] = [
        {
          id: "tok_1",
          name: "CI Key",
          createdAt: "2026-09-01T00:00:00Z",
          expiresAt: null,
          lastUsedAt: "2026-09-25T12:00:00Z",
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: tokenList }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const tokens = new TokensResource(client);

      const result = await tokens.list();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/tokens");
      expect(result).toEqual(tokenList);
    });

    it("create calls /api/v1/tokens with POST body containing expiresIn", async () => {
      const createdToken: ApiTokenCreated = {
        id: "tok_new",
        name: "Deploy Script",
        token: "lnk_abc123secret",
        expiresAt: "2026-12-31T23:59:59Z",
        createdAt: "2026-09-26T00:00:00Z",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: createdToken }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const tokens = new TokensResource(client);

      const result = await tokens.create({
        name: "Deploy Script",
        expiresIn: 3600,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/tokens");
      expect(reqInit.method).toBe("POST");
      expect(JSON.parse(reqInit.body as string)).toEqual({
        name: "Deploy Script",
        expiresIn: 3600,
      });
      expect(result.token).toBe("lnk_abc123secret");
    });

    it("create converts expiresAt date into relative expiresIn seconds", async () => {
      const createdToken: ApiTokenCreated = {
        id: "tok_new2",
        name: "Auto Expire",
        token: "lnk_secret2",
        expiresAt: "2026-12-31T23:59:59Z",
        createdAt: "2026-09-26T00:00:00Z",
      };

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: createdToken }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const tokens = new TokensResource(client);

      const futureDate = new Date(Date.now() + 60000); // 60s from now
      await tokens.create({
        name: "Auto Expire",
        expiresAt: futureDate,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, reqInit] = mockFetch.mock.calls[0];
      const parsedBody = JSON.parse(reqInit.body as string);
      expect(parsedBody.name).toBe("Auto Expire");
      expect(parsedBody.expiresIn).toBeGreaterThanOrEqual(58);
      expect(parsedBody.expiresIn).toBeLessThanOrEqual(61);
    });

    it("delete calls DELETE /api/v1/tokens/:id", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const tokens = new TokensResource(client);

      await tokens.delete("tok_123");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe("https://linkto.so/api/v1/tokens/tok_123");
      expect(reqInit.method).toBe("DELETE");
    });
  });
});
