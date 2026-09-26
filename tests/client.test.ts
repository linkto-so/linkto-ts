import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Linkto as ClientFromModule,
  default as ClientModuleDefault,
  type ClientOptions,
} from "../src/client.js";
import DefaultClient, {
  AccountResource,
  AnalyticsResource,
  DomainsResource,
  LinksResource,
  Linkto,
  name,
  QrResource,
  type ClientOptions as RootClientOptions,
  TagsResource,
  TokensResource,
  version,
} from "../src/index.js";

describe("Linkto Client & Package Exports", () => {
  const originalEnv = process.env.LINKTO_API_KEY;

  beforeEach(() => {
    delete process.env.LINKTO_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.LINKTO_API_KEY = originalEnv;
    } else {
      delete process.env.LINKTO_API_KEY;
    }
    vi.restoreAllMocks();
  });

  describe("Package exports", () => {
    it("exports version and name constants", () => {
      expect(version).toBe("0.1.0");
      expect(name).toBe("@linkto-so/sdk");
    });

    it("exports Linkto as both named and default export from index and client", () => {
      expect(Linkto).toBeDefined();
      expect(DefaultClient).toBe(Linkto);
      expect(ClientFromModule).toBe(Linkto);
      expect(ClientModuleDefault).toBe(Linkto);
    });

    it("allows typing options with ClientOptions and RootClientOptions", () => {
      const opts1: ClientOptions = { apiKey: "lnk_1" };
      const opts2: RootClientOptions = { apiKey: "lnk_2" };
      const client1 = new Linkto(opts1);
      const client2 = new Linkto(opts2);
      expect(client1).toBeInstanceOf(Linkto);
      expect(client2).toBeInstanceOf(Linkto);
    });
  });

  describe("Client instantiation & submodules", () => {
    it("instantiates new Linkto with apiKey and initializes all resources", () => {
      const client = new Linkto({ apiKey: "lnk_123" });

      expect(client).toBeInstanceOf(Linkto);
      expect(client.links).toBeInstanceOf(LinksResource);
      expect(client.analytics).toBeInstanceOf(AnalyticsResource);
      expect(client.domains).toBeInstanceOf(DomainsResource);
      expect(client.qr).toBeInstanceOf(QrResource);
      expect(client.tags).toBeInstanceOf(TagsResource);
      expect(client.account).toBeInstanceOf(AccountResource);
      expect(client.tokens).toBeInstanceOf(TokensResource);
    });

    it("instantiates with empty options", () => {
      const client = new Linkto();

      expect(client.links).toBeInstanceOf(LinksResource);
      expect(client.analytics).toBeInstanceOf(AnalyticsResource);
      expect(client.domains).toBeInstanceOf(DomainsResource);
      expect(client.qr).toBeInstanceOf(QrResource);
      expect(client.tags).toBeInstanceOf(TagsResource);
      expect(client.account).toBeInstanceOf(AccountResource);
      expect(client.tokens).toBeInstanceOf(TokensResource);
    });
  });

  describe("Environment variable fallback", () => {
    it("falls back to process.env.LINKTO_API_KEY when apiKey is not provided", async () => {
      process.env.LINKTO_API_KEY = "lnk_env_secret_key";

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              workspaceId: "ws_1",
              name: "Test",
              role: "owner",
              tokenValid: true,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

      const client = new Linkto({ fetch: mockFetch });
      await client.account.checkToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, requestInit] = mockFetch.mock.calls[0];
      expect(requestInit.headers).toMatchObject({
        Authorization: "Bearer lnk_env_secret_key",
      });
    });

    it("prefers explicit apiKey over process.env.LINKTO_API_KEY", async () => {
      process.env.LINKTO_API_KEY = "lnk_env_key";

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              workspaceId: "ws_1",
              name: "Test",
              role: "owner",
              tokenValid: true,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

      const client = new Linkto({
        apiKey: "lnk_explicit_key",
        fetch: mockFetch,
      });
      await client.account.checkToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, requestInit] = mockFetch.mock.calls[0];
      expect(requestInit.headers).toMatchObject({
        Authorization: "Bearer lnk_explicit_key",
      });
    });
  });

  describe("Custom fetch injection", () => {
    it("uses injected custom fetch for requests across resources", async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/v1/links")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  links: [
                    {
                      id: "link_1",
                      slug: "my-link",
                      destination: "https://example.com",
                    },
                  ],
                  cursor: null,
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }
        if (url.includes("/api/v1/tags")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: ["marketing", "promo"] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      const client = new Linkto({
        apiKey: "lnk_custom_fetch",
        baseUrl: "https://custom.linkto.so",
        fetch: mockFetch,
      });

      const linksPage = await client.links.list();
      expect(linksPage.links).toHaveLength(1);
      expect(linksPage.links[0].slug).toBe("my-link");

      const tags = await client.tags.list();
      expect(tags).toEqual(["marketing", "promo"]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://custom.linkto.so/api/v1/links",
      );
      expect(mockFetch.mock.calls[1][0]).toBe(
        "https://custom.linkto.so/api/v1/tags",
      );
    });

    it("passes custom headers and apiKey across all resource endpoints", async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/v1/domains")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        if (url.includes("/api/v1/qr")) {
          return Promise.resolve(
            new Response("<svg></svg>", {
              status: 200,
              headers: { "Content-Type": "image/svg+xml" },
            }),
          );
        }
        if (url.includes("/api/v1/tokens")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        if (url.includes("/api/v1/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  clicks: 10,
                  uniqueClicks: 8,
                  topReferrer: null,
                  topCountry: null,
                  topDevice: null,
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      const client = new Linkto({
        apiKey: "lnk_submodule_test",
        headers: { "X-Custom-Tracking": "true" },
        fetch: mockFetch,
      });

      await client.domains.list();
      const svg = await client.qr.getSvg({ url: "https://linkto.so/s" });
      expect(svg).toBe("<svg></svg>");
      await client.tokens.list();
      await client.analytics.get();

      expect(mockFetch).toHaveBeenCalledTimes(4);
      for (const call of mockFetch.mock.calls) {
        const [, reqInit] = call;
        expect(reqInit.headers).toMatchObject({
          Authorization: "Bearer lnk_submodule_test",
          "X-Custom-Tracking": "true",
          "X-Client": "linkto-ts/0.1.0",
        });
      }
    });
  });
});
