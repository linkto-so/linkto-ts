import type { HttpClient } from "../internal/http.js";
import type { ApiTokenCreated, ApiTokenSummary } from "../models.js";

export class TokensResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ApiTokenSummary[]> {
    return await this.http.request<ApiTokenSummary[]>("/api/v1/tokens");
  }

  async create(params: {
    name: string;
    expiresAt?: string;
  }): Promise<ApiTokenCreated> {
    return await this.http.request<ApiTokenCreated>("/api/v1/tokens", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>(`/api/v1/tokens/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}
