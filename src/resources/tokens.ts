import type { HttpClient } from "../internal/http.js";
import type {
  ApiTokenCreated,
  ApiTokenSummary,
  CreateApiTokenOptions,
} from "../models.js";

/**
 * Resource for managing API tokens.
 *
 * NOTE: Token management endpoints require an authenticated browser dashboard
 * session cookie (sessionOnly) and cannot be called using a Bearer API token.
 */
export class TokensResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ApiTokenSummary[]> {
    return await this.http.request<ApiTokenSummary[]>("/api/v1/tokens");
  }

  async create(params: CreateApiTokenOptions): Promise<ApiTokenCreated> {
    let expiresIn = params.expiresIn;
    if (expiresIn === undefined && params.expiresAt) {
      const targetTime =
        params.expiresAt instanceof Date
          ? params.expiresAt.getTime()
          : new Date(params.expiresAt).getTime();
      expiresIn = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
    }

    const payload: { name: string; expiresIn?: number | null } = {
      name: params.name,
      ...(expiresIn !== undefined ? { expiresIn } : {}),
    };

    return await this.http.request<ApiTokenCreated>("/api/v1/tokens", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>(`/api/v1/tokens/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}
