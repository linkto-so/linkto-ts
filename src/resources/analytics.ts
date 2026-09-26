import type { HttpClient } from "../internal/http.js";
import { toQueryString } from "../internal/query.js";
import type { LinkStats, WorkspaceStats } from "../models.js";

function enrichStats<
  T extends {
    timeseries?: Array<{ date: string; clicks: number }>;
    byDay?: Array<{ day: string; clicks: number }>;
  },
>(stats: T): T {
  if (!stats.byDay && stats.timeseries) {
    return {
      ...stats,
      byDay: stats.timeseries.map((pt) => ({
        day: pt.date,
        clicks: pt.clicks,
      })),
    };
  }
  return stats;
}

export class AnalyticsResource {
  constructor(private readonly http: HttpClient) {}

  async get(options?: { days?: number }): Promise<WorkspaceStats> {
    const qs = toQueryString(options);
    const raw = await this.http.request<WorkspaceStats>(`/api/v1/stats${qs}`);
    return enrichStats(raw);
  }

  async forLink(
    id: string,
    options?: { days?: number; breakdown?: string },
  ): Promise<LinkStats> {
    const qs = toQueryString(options);
    const raw = await this.http.request<LinkStats>(
      `/api/v1/links/${encodeURIComponent(id)}/stats${qs}`,
    );
    return enrichStats(raw);
  }
}
