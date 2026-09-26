import { describe, expect, it } from "vitest";
import {
  type AccountProfile,
  type AccountUsage,
  API_ERROR_CODE,
  type BulkCreateResponse,
  type CreateLinkOptions,
  type DomainSummary,
  LINK_STATE,
  LINK_STATUS,
  type Link,
  type LinkSummary,
  QR_DOT_STYLE,
  QR_MARKER_STYLE,
} from "../src/models";

describe("Models and Constants", () => {
  describe("Constants", () => {
    it("exports LINK_STATUS with expected values", () => {
      expect(LINK_STATUS.ACTIVE).toBe("active");
      expect(LINK_STATUS.ARCHIVED).toBe("archived");
      expect(LINK_STATUS.DISABLED).toBe("disabled");
      expect(Object.keys(LINK_STATUS).length).toBe(3);
    });

    it("exports LINK_STATE with expected values", () => {
      expect(LINK_STATE.ACTIVE).toBe("active");
      expect(LINK_STATE.EXPIRED).toBe("expired");
      expect(LINK_STATE.ARCHIVED).toBe("archived");
      expect(LINK_STATE.DISABLED).toBe("disabled");
      expect(Object.keys(LINK_STATE).length).toBe(4);
    });

    it("exports QR_DOT_STYLE with expected values", () => {
      expect(QR_DOT_STYLE.ROUNDED).toBe("rounded");
      expect(QR_DOT_STYLE.SQUARE).toBe("square");
      expect(QR_DOT_STYLE.DOTS).toBe("dots");
      expect(Object.keys(QR_DOT_STYLE).length).toBe(3);
    });

    it("exports QR_MARKER_STYLE with expected values", () => {
      expect(QR_MARKER_STYLE.ROUNDED).toBe("rounded");
      expect(QR_MARKER_STYLE.SQUARE).toBe("square");
      expect(QR_MARKER_STYLE.CIRCLE).toBe("circle");
      expect(Object.keys(QR_MARKER_STYLE).length).toBe(3);
    });

    it("exports API_ERROR_CODE with expected values", () => {
      expect(API_ERROR_CODE.BAD_REQUEST).toBe("bad_request");
      expect(API_ERROR_CODE.UNAUTHORIZED).toBe("unauthorized");
      expect(API_ERROR_CODE.NOT_FOUND).toBe("not_found");
      expect(API_ERROR_CODE.CONFLICT).toBe("conflict");
      expect(API_ERROR_CODE.RATE_LIMIT_EXCEEDED).toBe("rate_limit_exceeded");
      expect(API_ERROR_CODE.INTERNAL_SERVER_ERROR).toBe(
        "internal_server_error",
      );
      expect(Object.keys(API_ERROR_CODE).length).toBe(6);
    });
  });

  describe("Types", () => {
    it("LinkSummary satisfies expected properties", () => {
      const summary: LinkSummary = {
        id: "link_123",
        slug: "123",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/123",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2024-01-01T00:00:00Z",
      };
      expect(summary.id).toBe("link_123");
    });

    it("Link satisfies expected properties and extends LinkSummary", () => {
      const link: Link = {
        id: "link_123",
        slug: "123",
        domain: "linkto.so",
        shortUrl: "https://linkto.so/123",
        url: "https://example.com",
        title: null,
        description: null,
        status: "active",
        state: "active",
        clicks: 0,
        lastClickedAt: null,
        expiresAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        routing: null,
        protected: false,
        utm: {},
        tags: [],
        externalId: null,
        updatedAt: "2024-01-01T00:00:00Z",
        qrCode: "https://linkto.so/123/qr",
      };
      expect(link.protected).toBe(false);
    });

    it("CreateLinkOptions satisfies expected properties", () => {
      const opts: CreateLinkOptions = {
        url: "https://example.com",
      };
      expect(opts.url).toBe("https://example.com");
    });

    it("BulkCreateResponse satisfies expected properties", () => {
      const res: BulkCreateResponse = {
        created: [],
        rejected: [],
        allSucceeded: true,
        hasFailures: false,
      };
      expect(res.allSucceeded).toBe(true);
    });

    it("DomainSummary satisfies expected properties", () => {
      const domain: DomainSummary = {
        id: "dom_123",
        domain: "example.com",
        status: "active",
        verified: true,
        primary: false,
        createdAt: "2024-01-01T00:00:00Z",
      };
      expect(domain.domain).toBe("example.com");
    });

    it("AccountProfile satisfies expected properties", () => {
      const profile: AccountProfile = {
        workspaceId: "ws_123",
        name: "Test Workspace",
        role: "admin",
        tokenValid: true,
      };
      expect(profile.workspaceId).toBe("ws_123");
    });

    it("AccountUsage satisfies expected properties", () => {
      const usage: AccountUsage = {
        plan: "free",
        linksUsage: 10,
        linksLimit: 100,
        clicksUsage: 50,
        clicksLimit: 1000,
      };
      expect(usage.linksUsage).toBe(10);
    });
  });
});
