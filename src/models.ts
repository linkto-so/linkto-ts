export const LINK_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DISABLED: "disabled",
} as const;
export type LinkStatus = (typeof LINK_STATUS)[keyof typeof LINK_STATUS];

export const LINK_STATE = {
  ACTIVE: "active",
  EXPIRED: "expired",
  ARCHIVED: "archived",
  DISABLED: "disabled",
} as const;
export type LinkState = (typeof LINK_STATE)[keyof typeof LINK_STATE];

export const QR_DOT_STYLE = {
  ROUNDED: "rounded",
  SQUARE: "square",
  DOTS: "dots",
} as const;
export type QrDotStyle = (typeof QR_DOT_STYLE)[keyof typeof QR_DOT_STYLE];

export const QR_MARKER_STYLE = {
  ROUNDED: "rounded",
  SQUARE: "square",
  CIRCLE: "circle",
} as const;
export type QrMarkerStyle =
  (typeof QR_MARKER_STYLE)[keyof typeof QR_MARKER_STYLE];

export const API_ERROR_CODE = {
  BAD_REQUEST: "bad_request",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INTERNAL_SERVER_ERROR: "internal_server_error",
} as const;
export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface RoutingConfig {
  ios?: string;
  android?: string;
  fallback?: string;
  endedUrl?: string;
  geo?: Record<
    string,
    { ios?: string; android?: string; fallback?: string }
  > | null;
}

export interface CreateLinkOptions {
  /** Target URL. Accepts either `url` or `destination`. */
  url?: string;
  destination?: string;
  slug?: string;
  domain?: string;
  title?: string;
  description?: string;
  routing?: RoutingConfig;
  utm?: UtmParams;
  tags?: string[];
  expiresAt?: string | null;
  externalId?: string;
  password?: string;
}

export interface UpdateLinkOptions {
  url?: string;
  destination?: string;
  title?: string;
  description?: string;
  routing?: RoutingConfig;
  utm?: UtmParams;
  tags?: string[];
  expiresAt?: string | null;
  status?: LinkStatus;
}

export interface LinkSummary {
  id: string;
  slug: string;
  domain: string;
  shortUrl: string;
  /** Secondary alias short URL (e.g. https://shor.ink/:slug) when using default domain. */
  aliasUrl?: string;
  url: string;
  title: string | null;
  description: string | null;
  status: string;
  state: LinkState;
  clicks: number;
  lastClickedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  sparkline?: number[];
}

export interface Link extends LinkSummary {
  routing: RoutingConfig | null;
  protected: boolean;
  utm: UtmParams;
  tags: string[];
  externalId: string | null;
  updatedAt: string;
  qrCode: string;
}

export interface ListLinksOptions {
  limit?: number;
  cursor?: string;
  status?: string;
  search?: string;
  tag?: string;
  sparkline?: number;
}

export interface LinkSummaryPage {
  links: LinkSummary[];
  cursor: string | null;
}

export interface BulkRejectedItem {
  index: number;
  field: string;
  message: string;
}

export interface BulkCreateResponse {
  /** Links successfully created in the batch. */
  created: LinkSummary[];
  /** Items that failed validation or constraints, with input index and reason. */
  rejected: BulkRejectedItem[];
  /** True when every input item was successfully created. */
  allSucceeded: boolean;
  /** True when at least one input item failed. */
  hasFailures: boolean;
}

export interface LinkStats {
  clicks: number;
  timeZone: string;
  byDay?: Array<{ day: string; clicks: number }>;
  byDevice?: Record<string, number>;
  byBrowser?: Record<string, number>;
  byOs?: Record<string, number>;
  byCountry?: Record<string, number>;
}

export interface QrRenderOptions {
  url: string;
  fgColor?: string;
  bgColor?: string;
  dotStyle?: QrDotStyle;
  markerStyle?: QrMarkerStyle;
  caption?: string;
}

export interface DomainSummary {
  id: string;
  domain: string;
  status: "pending" | "active" | "failed";
  verified: boolean;
  primary: boolean;
  createdAt: string;
}

export interface AccountProfile {
  workspaceId: string;
  name: string;
  role: string;
  tokenValid: boolean;
}

export interface AccountUsage {
  plan: string;
  linksUsage: number;
  linksLimit: number | null;
  clicksUsage: number;
  clicksLimit: number | null;
}

export interface WorkspaceStats {
  clicks: number;
  timeZone: string;
  byDay?: Array<{ day: string; clicks: number }>;
}

export interface ApiTokenSummary {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export interface ApiTokenCreated {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}
