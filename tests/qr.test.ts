import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/internal/http.js";
import {
  QR_DOT_STYLE,
  QR_MARKER_STYLE,
  type QrRenderOptions,
} from "../src/models.js";
import { QrResource } from "../src/resources/qr.js";

describe("QrResource", () => {
  describe("getSvg", () => {
    it("fetches SVG with Accept: image/svg+xml header and query parameters", async () => {
      const svgOutput =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect /></svg>';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(svgOutput, {
          status: 200,
          headers: { "Content-Type": "image/svg+xml" },
        }),
      );

      const client = new HttpClient({
        baseUrl: "https://linkto.so",
        fetch: mockFetch,
      });
      const qr = new QrResource(client);

      const options: QrRenderOptions = {
        url: "https://linkto.so/promo",
        fgColor: "#111827",
        bgColor: "#ffffff",
        dotStyle: QR_DOT_STYLE.ROUNDED,
        markerStyle: QR_MARKER_STYLE.CIRCLE,
        caption: "Scan me",
      };

      const result = await qr.getSvg(options);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, reqInit] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.origin).toBe("https://linkto.so");
      expect(parsed.pathname).toBe("/api/v1/qr");
      expect(parsed.searchParams.get("url")).toBe("https://linkto.so/promo");
      expect(parsed.searchParams.get("fgColor")).toBe("#111827");
      expect(parsed.searchParams.get("bgColor")).toBe("#ffffff");
      expect(parsed.searchParams.get("dotStyle")).toBe("rounded");
      expect(parsed.searchParams.get("markerStyle")).toBe("circle");
      expect(parsed.searchParams.get("caption")).toBe("Scan me");

      expect(reqInit.headers).toMatchObject({
        Accept: "image/svg+xml",
      });

      expect(result).toBe(svgOutput);
    });

    it("works with minimal options (only url)", async () => {
      const svgOutput = "<svg></svg>";

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(svgOutput, {
          status: 200,
          headers: { "Content-Type": "image/svg+xml" },
        }),
      );

      const client = new HttpClient({ fetch: mockFetch });
      const qr = new QrResource(client);

      const result = await qr.getSvg({ url: "https://example.com" });

      const [calledUrl] = mockFetch.mock.calls[0];
      const parsed = new URL(calledUrl);
      expect(parsed.pathname).toBe("/api/v1/qr");
      expect(parsed.searchParams.get("url")).toBe("https://example.com");
      expect(parsed.searchParams.get("fgColor")).toBeNull();
      expect(result).toBe(svgOutput);
    });
  });

  describe("getUrl", () => {
    it("returns synchronous string without making network calls", () => {
      const mockFetch = vi.fn();
      const client = new HttpClient({
        baseUrl: "https://custom.linkto.so/",
        fetch: mockFetch,
      });
      const qr = new QrResource(client);

      const options: QrRenderOptions = {
        url: "https://custom.linkto.so/landing",
        fgColor: "#000000",
        bgColor: "#ffffff",
        dotStyle: QR_DOT_STYLE.DOTS,
        markerStyle: QR_MARKER_STYLE.ROUNDED,
        caption: "Exclusive",
      };

      const url = qr.getUrl(options);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(url.startsWith("https://custom.linkto.so/api/v1/qr?")).toBe(true);

      const parsed = new URL(url);
      expect(parsed.origin).toBe("https://custom.linkto.so");
      expect(parsed.pathname).toBe("/api/v1/qr");
      expect(parsed.searchParams.get("url")).toBe(
        "https://custom.linkto.so/landing",
      );
      expect(parsed.searchParams.get("fgColor")).toBe("#000000");
      expect(parsed.searchParams.get("bgColor")).toBe("#ffffff");
      expect(parsed.searchParams.get("dotStyle")).toBe("dots");
      expect(parsed.searchParams.get("markerStyle")).toBe("rounded");
      expect(parsed.searchParams.get("caption")).toBe("Exclusive");
    });
  });
});
