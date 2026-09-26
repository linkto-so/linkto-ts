import type { HttpClient } from "../internal/http.js";
import { toQueryString } from "../internal/query.js";
import type { LinkStats, WorkspaceStats } from "../models.js";

export class AnalyticsResource {
  constructor(private readonly http: HttpClient) {}

  async get(options?: { days?: number }): Promise<WorkspaceStats> {
    const qs = toQueryString(options);
    return await this.http.request<WorkspaceStats>(`/api/v1/stats${qs}`);
  }

  async forLink(
    id: string,
    options?: { days?: number; breakdown?: string },
  ): Promise<LinkStats> {
    const qs = toQueryString(options);
    return await this.http.request<LinkStats>(
      `/api/v1/links/${encodeURIComponent(id)}/stats${qs}`,
    );
  }
}
