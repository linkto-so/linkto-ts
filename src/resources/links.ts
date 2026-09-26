import type { HttpClient } from "../internal/http.js";
import { toQueryString } from "../internal/query.js";
import type {
  BulkCreateResponse,
  BulkRejectedItem,
  CreateLinkOptions,
  Link,
  LinkStats,
  LinkSummary,
  LinkSummaryPage,
  ListLinksOptions,
  UpdateLinkOptions,
} from "../models.js";

export function enrichLink<T extends LinkSummary>(item: T): T {
  if (
    !item.aliasUrl &&
    (item.domain === "linkto.so" || item.domain === "localhost")
  ) {
    item.aliasUrl = `https://shor.ink/${item.slug}`;
  }
  return item;
}

function normalizeCreateLinkOptions(
  options: CreateLinkOptions,
): Record<string, unknown> {
  const { url, destination, ...rest } = options;
  const finalDestination = destination ?? url;
  return {
    ...rest,
    ...(finalDestination !== undefined
      ? { destination: finalDestination }
      : {}),
  };
}

function normalizeUpdateLinkOptions(
  options: UpdateLinkOptions,
): Record<string, unknown> {
  const { url, destination, ...rest } = options;
  const finalDestination = destination ?? url;
  return {
    ...rest,
    ...(finalDestination !== undefined
      ? { destination: finalDestination }
      : {}),
  };
}

export class LinksResource {
  constructor(private readonly http: HttpClient) {}

  async create(options: CreateLinkOptions): Promise<Link> {
    const payload = normalizeCreateLinkOptions(options);
    const link = await this.http.request<Link>("/api/v1/links", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return enrichLink(link);
  }

  async get(id: string): Promise<Link> {
    const link = await this.http.request<Link>(
      `/api/v1/links/${encodeURIComponent(id)}`,
    );
    return enrichLink(link);
  }

  async list(options?: ListLinksOptions): Promise<LinkSummaryPage> {
    const qs = toQueryString(
      options as
        | Record<string, string | number | boolean | undefined | null>
        | undefined,
    );
    const raw = await this.http.request<LinkSummaryPage>(`/api/v1/links${qs}`);
    return {
      ...raw,
      links: (raw.links || []).map(enrichLink),
    };
  }

  async history(options?: ListLinksOptions): Promise<LinkSummaryPage> {
    return this.list(options);
  }

  async update(id: string, options: UpdateLinkOptions): Promise<Link> {
    const payload = normalizeUpdateLinkOptions(options);
    const link = await this.http.request<Link>(
      `/api/v1/links/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return enrichLink(link);
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>(`/api/v1/links/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async stats(
    id: string,
    options?: { days?: number; breakdown?: string },
  ): Promise<LinkStats> {
    const qs = toQueryString(options);
    return await this.http.request<LinkStats>(
      `/api/v1/links/${encodeURIComponent(id)}/stats${qs}`,
    );
  }

  async visitStats(
    id: string,
    options?: { days?: number; breakdown?: string },
  ): Promise<LinkStats> {
    return this.stats(id, options);
  }

  async rotate(id: string): Promise<Link> {
    const link = await this.http.request<Link>(
      `/api/v1/links/${encodeURIComponent(id)}/rotate`,
      {
        method: "POST",
      },
    );
    return enrichLink(link);
  }

  async setPassword(id: string, password: string): Promise<void> {
    await this.http.request<void>(
      `/api/v1/links/${encodeURIComponent(id)}/password`,
      {
        method: "PUT",
        body: JSON.stringify({ password }),
      },
    );
  }

  async removePassword(id: string): Promise<void> {
    await this.http.request<void>(
      `/api/v1/links/${encodeURIComponent(id)}/password`,
      {
        method: "DELETE",
      },
    );
  }

  async bulkCreate(links: CreateLinkOptions[]): Promise<BulkCreateResponse> {
    const normalizedLinks = links.map(normalizeCreateLinkOptions);
    const raw = await this.http.request<{
      created: LinkSummary[];
      rejected: BulkRejectedItem[];
    }>("/api/v1/links/bulk", {
      method: "POST",
      body: JSON.stringify({ links: normalizedLinks }),
    });

    const created = (raw.created || []).map(enrichLink);
    const rejected = raw.rejected || [];

    return {
      created,
      rejected,
      allSucceeded: rejected.length === 0,
      hasFailures: rejected.length > 0,
    };
  }
}
